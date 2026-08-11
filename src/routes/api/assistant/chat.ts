import { createFileRoute } from "@tanstack/react-router";
import { verifyBearer } from "@/lib/assistant-auth";
import { buildAssistantContext, contextPrompt } from "@/lib/assistant-data";
import type { GpsDay, ManualTest, MedicalEvent, Player, Session, Team, Wellness } from "@/data/performance";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";

export const Route = createFileRoute("/api/assistant/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabase, userId } = await verifyBearer(request);

          const body = (await request.json()) as {
            messages?: Array<{ role: "user" | "assistant"; content: string }>;
            threadId?: string;
          };

          if (!Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const { data: row } = await supabase
            .from("workspace_data")
            .select("team, players, sessions, gps_history, manual_tests, medical_events")
            .eq("user_id", userId)
            .single();

          const team = (row?.team ?? { name: "", club: "", season: "" }) as Team;
          const players = Array.isArray(row?.players) ? (row.players as Player[]) : [];
          const sessions = Array.isArray(row?.sessions) ? (row.sessions as Session[]) : [];
          const gpsHistory = Array.isArray(row?.gps_history) ? (row.gps_history as GpsDay[]) : [];
          const manualTests = Array.isArray(row?.manual_tests) ? (row.manual_tests as ManualTest[]) : [];
          const medicalEvents = Array.isArray(row?.medical_events) ? (row.medical_events as MedicalEvent[]) : [];
          const wellness: Wellness[] = [];

          const ctx = buildAssistantContext(team, players, gpsHistory, sessions, manualTests, medicalEvents, wellness);
          const system = contextPrompt(ctx);

          const input = [
            { role: "developer", content: system },
            ...body.messages.map((m) => ({ role: m.role, content: m.content })),
          ];

          const lovableApiKey = process.env["LOVABLE_API_KEY"];
          if (!lovableApiKey) {
            return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 503, headers: { "Content-Type": "application/json" } });
          }

          const gatewayRes = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": lovableApiKey,
              "X-Lovable-AIG-SDK": "fetch",
            },
            body: JSON.stringify({
              model: "openai/gpt-5.5",
              input,
              stream: true,
              reasoning: { effort: "low", summary: "auto" },
              include: ["reasoning.encrypted_content"],
            }),
          });

          if (!gatewayRes.ok) {
            const text = await gatewayRes.text();
            return new Response(JSON.stringify({ error: `AI gateway error ${gatewayRes.status}: ${text}` }), {
              status: gatewayRes.status,
              headers: { "Content-Type": "application/json" },
            });
          }

          const runId = gatewayRes.headers.get("X-Lovable-AIG-Run-ID") ?? "";

          const stream = new ReadableStream({
            async start(controller) {
              const reader = gatewayRes.body?.getReader();
              if (!reader) {
                controller.close();
                return;
              }

              try {
                controller.enqueue(new TextEncoder().encode(`event: runId\ndata: ${JSON.stringify({ runId })}\n\n`));

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  const chunk = new TextDecoder().decode(value);
                  const lines = chunk.split("\n");
                  for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6);
                    if (data === "[DONE]") continue;
                    try {
                      const parsed = JSON.parse(data);
                      const deltas: string[] = [];
                      if (parsed.response?.status === "completed") {
                        const text = parsed.response.output_text ?? "";
                        if (text) deltas.push(text);
                      }
                      if (parsed.type === "response.output_text.delta") {
                        deltas.push(parsed.delta ?? "");
                      }
                      if (parsed.type === "response.reasoning_summary_text.delta") {
                        controller.enqueue(new TextEncoder().encode(`event: reasoning\ndata: ${JSON.stringify({ text: parsed.delta })}\n\n`));
                      }
                      if (deltas.length) {
                        controller.enqueue(new TextEncoder().encode(`event: text\ndata: ${JSON.stringify({ text: deltas.join("") })}\n\n`));
                      }
                    } catch {
                      // ignore malformed SSE lines
                    }
                  }
                }
              } finally {
                controller.enqueue(new TextEncoder().encode(`event: done\ndata: {}\n\n`));
                controller.close();
                reader.releaseLock();
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              "X-Lovable-AIG-Run-ID": runId,
            },
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Assistant request failed";
          const status = message.includes("Unauthorized") ? 401 : 500;
          return new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
