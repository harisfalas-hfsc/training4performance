import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  assistantCreateThread,
  assistantDeleteThread,
  assistantGetCredits,
  assistantGetContext,
  assistantListMessages,
  assistantListThreads,
  assistantRenameThread,
  assistantSaveMessage,
} from "@/lib/assistant.functions";
import { useServerFn } from "@tanstack/react-start";
import type { AssistantDateRow, AssistantWorkspaceContext } from "@/lib/assistant-data";
import {
  Bot,
  ChevronLeft,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MultiChart, type ChartKind } from "@/components/charts";

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  created_at?: string;
}

interface Thread {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Give me a weekly workload report for the squad",
  "Compare the top 3 highest and lowest distance players this week",
  "Who is at risk of overload based on ACWR?",
  "Summarise the last 5 training sessions",
  "What is the squad average wellness today?",
];

interface ChartSpec {
  kind: ChartKind;
  title: string;
  xKey: string;
  series: Array<{ key: string; name: string; color?: string }>;
  data: Array<Record<string, string | number>>;
}

const CHART_METRIC_LABELS: Record<string, string> = {
  distance: "Distance (m)",
  hsr: "HSR (m)",
  sprint: "Sprint (m)",
  maxSpeed: "Max speed (km/h)",
  avgSpeed: "Avg speed (km/h)",
  accel: "Accelerations",
  decel: "Decelerations",
  rpe: "RPE",
  jumps: "Jumps",
  energy: "Energy (kJ)",
};

function parseChartTag(text: string): { text: string; tag?: { player: string; metric: string; kind: ChartKind } } {
  // Accept [CHART ...] or malformed [ART ...] produced by some models,
  // but only if it contains both player and metric attributes.
  const match = text.match(/\[(?:CHART|ART)\s+([^\]]+)\]/);
  if (!match || !match[1]) return { text };
  const attrs: Record<string, string> = {};
  const pairs = match[1].matchAll(/(\w+)="([^"]*)"/g);
  for (const pair of pairs) {
    const key = pair[1] ?? "";
    const value = pair[2] ?? "";
    if (key) attrs[key] = value;
  }
  if (!attrs["player"] || !attrs["metric"]) return { text };
  return {
    text: text.replace(match[0], "").trim(),
    tag: { player: attrs["player"], metric: attrs["metric"], kind: (attrs["kind"] as ChartKind) || "line" },
  };
}

function findPlayerByName(name: string, ctx: AssistantWorkspaceContext | null) {
  if (!ctx) return undefined;
  const lower = name.toLowerCase();
  // Exact/substring match either direction.
  let player = ctx.playerDateMetrics.find(
    (p) => p.playerName.toLowerCase().includes(lower) || lower.includes(p.playerName.toLowerCase()),
  );
  if (player) return player;
  // Last-name heuristic: match last token.
  const lastToken = lower.split(/\s+/).pop();
  if (lastToken) {
    player = ctx.playerDateMetrics.find((p) => {
      const tokens = p.playerName.toLowerCase().split(/\s+/);
      return tokens.some((t) => t === lastToken || t.startsWith(lastToken));
    });
  }
  return player;
}

function buildChartFromTag(
  tag: { player: string; metric: string; kind: ChartKind },
  ctx: AssistantWorkspaceContext | null,
): ChartSpec | undefined {
  if (!ctx) return undefined;
  const player = findPlayerByName(tag.player, ctx);
  if (!player) return undefined;
  const metric = tag.metric;
  const label = CHART_METRIC_LABELS[metric] ?? metric;
  const data = player.rows
    .filter((r) => r[metric as keyof AssistantDateRow] !== undefined)
    .map((r) => ({
      date: r.date,
      [metric]: Number(r[metric as keyof AssistantDateRow]),
    }));
  if (data.length === 0) return undefined;
  return {
    kind: tag.kind,
    title: `${player.playerName} — ${label}`,
    xKey: "date",
    series: [{ key: metric, name: label }],
    data,
  };
}

function detectChartRequest(text: string): { player: string | undefined; metric: string | undefined; kind: ChartKind } | undefined {
  const lower = text.toLowerCase();
  const isChart = /\b(chart|graph|plot|trend|visual|visualize|visualise)\b/.test(lower);
  if (!isChart) return undefined;

  const playerNames = (window as unknown as { __smartyPlayerNames?: string[] }).__smartyPlayerNames ?? [];
  let player: string | undefined;
  for (const name of playerNames) {
    if (lower.includes(name.toLowerCase())) {
      player = name;
      break;
    }
  }

  const metricMap: Record<string, string> = {
    distance: "distance",
    hsr: "hsr",
    "high speed running": "hsr",
    "high-speed running": "hsr",
    sprint: "sprint",
    "max speed": "maxSpeed",
    "maximum speed": "maxSpeed",
    "top speed": "maxSpeed",
    speed: "maxSpeed",
    "avg speed": "avgSpeed",
    "average speed": "avgSpeed",
    accelerations: "accel",
    acceleration: "accel",
    decelerations: "decel",
    deceleration: "decel",
    rpe: "rpe",
    jumps: "jumps",
    jump: "jumps",
    energy: "energy",
  };
  let metric: string | undefined;
  for (const [phrase, key] of Object.entries(metricMap)) {
    if (lower.includes(phrase)) {
      metric = key;
      break;
    }
  }

  const kind: ChartKind = lower.includes("bar") ? "bar" : lower.includes("area") ? "area" : "line";
  return { player, metric, kind };
}

function buildFallbackChart(
  request: { player: string | undefined; metric: string | undefined; kind: ChartKind },
  ctx: AssistantWorkspaceContext | null,
): ChartSpec | undefined {
  if (!ctx || ctx.playerDateMetrics.length === 0) return undefined;
  const player = request.player
    ? ctx.playerDateMetrics.find((p) => p.playerName.toLowerCase().includes(request.player!.toLowerCase()))
    : ctx.playerDateMetrics[0];
  if (!player) return undefined;
  const metric = request.metric ?? "maxSpeed";
  const label = CHART_METRIC_LABELS[metric] ?? metric;
  const data = player.rows
    .filter((r) => r[metric as keyof AssistantDateRow] !== undefined)
    .map((r) => ({
      date: r.date,
      [metric]: Number(r[metric as keyof AssistantDateRow]),
    }));
  if (data.length === 0) return undefined;
  return {
    kind: request.kind,
    title: `${player.playerName} — ${label}`,
    xKey: "date",
    series: [{ key: metric, name: label }],
    data,
  };
}

function renderInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*|\*|__|_)(.*?)\1/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>);
    }
    const delimiter = match[1] ?? "";
    const content = match[2] ?? "";
    parts.push(
      delimiter.length === 2 ? (
        <strong key={match.index}>{content}</strong>
      ) : (
        <em key={match.index}>{content}</em>
      ),
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
  }
  return parts.length ? parts : text;
}

function formatAnswer(text: string, ctx: AssistantWorkspaceContext | null) {
  const { text: cleanText, tag } = parseChartTag(text);
  const chart = tag ? buildChartFromTag(tag, ctx) : undefined;
  const lines = cleanText.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={key++} className="ml-4 list-disc">
          {renderInlineMarkdown(trimmed.slice(2))}
        </li>,
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={key++} className="ml-4 list-decimal">
          {renderInlineMarkdown(trimmed.replace(/^\d+\.\s/, ""))}
        </li>,
      );
    } else if (trimmed === "") {
      elements.push(<br key={key++} />);
    } else {
      elements.push(<p key={key++}>{renderInlineMarkdown(line)}</p>);
    }
  });

  if (chart) {
    elements.push(
      <div key={key++} className="mt-3 rounded-xl border bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{chart.title}</p>
        <MultiChart
          kind={chart.kind}
          data={chart.data}
          series={chart.series}
          xKey={chart.xKey}
          height={200}
        />
      </div>,
    );
  }

  return elements;
}

export function AssistantChat({ onClose }: { onClose: () => void }) {
  const { session } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [view, setView] = useState<"chat" | "threads">("chat");
  const [workspaceContext, setWorkspaceContext] = useState<AssistantWorkspaceContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const listThreads = useServerFn(assistantListThreads);
  const listMessages = useServerFn(assistantListMessages);
  const createThread = useServerFn(assistantCreateThread);
  const saveMessage = useServerFn(assistantSaveMessage);
  const deleteThread = useServerFn(assistantDeleteThread);
  const renameThread = useServerFn(assistantRenameThread);
  const getCredits = useServerFn(assistantGetCredits);
  const getContext = useServerFn(assistantGetContext);

  useEffect(() => {
    void loadThreads();
    void loadCredits();
    void loadContext();
  }, []);

  async function loadContext() {
    try {
      const { context } = await getContext();
      if (context) setWorkspaceContext(context as AssistantWorkspaceContext);
    } catch {
      // non-fatal: assistant can still answer without charts
    }
  }

  useEffect(() => {
    if (workspaceContext) {
      (window as unknown as { __smartyPlayerNames?: string[] }).__smartyPlayerNames =
        workspaceContext.playerDateMetrics.map((p) => p.playerName);
    }
  }, [workspaceContext]);

  useEffect(() => {
    if (activeThread) {
      void loadMessages(activeThread);
      setView("chat");
    }
  }, [activeThread]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function loadThreads() {
    try {
      const { threads } = await listThreads();
      const typed = (threads ?? []).map((t) => ({ ...t, title: t.title ?? "Chat" }));
      setThreads(typed);
      if (typed.length > 0 && !activeThread) setActiveThread(typed[0]?.id ?? null);

    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load threads");
    }
  }

  async function loadMessages(threadId: string) {
    try {
      const { messages } = await listMessages({ data: { threadId } });
      setMessages(
        (messages ?? []).map((m) => ({
          id: m.id,
          role: (m.role as Message["role"]) ?? "assistant",
          content: m.content ?? "",
          created_at: m.created_at,
        })),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load messages");
    }
  }

  async function loadCredits() {
    try {
      const { balance } = await getCredits();
      setCredits(balance ?? 0);
    } catch {
      setCredits(0);
    }
  }

  async function handleNewThread() {
    try {
      const { thread } = await createThread({ data: { title: "New chat" } });
      const typed = { ...thread, title: thread.title ?? "New chat" };
      setThreads((prev) => [typed, ...prev]);
      setActiveThread(typed.id);
      setMessages([]);
      setView("chat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create thread");
    }
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    let threadId = activeThread;
    if (!threadId) {
      try {
        const { thread } = await createThread({ data: { title: input.trim().slice(0, 40) } });
        threadId = thread.id;
        setThreads((prev) => [{ ...thread, title: thread.title ?? input.trim().slice(0, 40) }, ...prev]);
        setActiveThread(thread.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start chat");
        return;
      }
    }

    const userText = input.trim();
    const chartRequest = detectChartRequest(userText);
    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: userText }]);
    setLoading(true);

    try {
      await saveMessage({ data: { threadId, role: "user", content: userText } });

      const token = session?.access_token;
      if (!token) throw new Error("Not signed in");

      const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: userText }];

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role === "tool" ? "assistant" : m.role, content: m.content })),
          threadId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Assistant unavailable" }));
        throw new Error(err.error ?? "Assistant unavailable");
      }

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const events = chunk.split("\n\n").filter(Boolean);
        for (const event of events) {
          const lines = event.split("\n");
          const ev = lines.find((l) => l.startsWith("event:"))?.slice(7).trim();
          const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            if (ev === "text" && data.text) {
              fullText += data.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m)),
              );
            }
          } catch {
            // ignore
          }
        }
      }

      // If the user asked for a chart but the model did not emit a chart tag,
      // append a generated tag from workspace context so the UI still renders it.
      if (chartRequest && !/\[(?:CHART|ART)/i.test(fullText)) {
        const fallback = buildFallbackChart(chartRequest, workspaceContext);
        if (fallback) {
          const playerName = fallback.title.split(" — ")[0] ?? "Player";
          const metricKey = fallback.series[0]?.key ?? "maxSpeed";
          fullText += `\n\n[CHART player="${playerName}" metric="${metricKey}" kind="${chartRequest.kind}"]`;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m)),
          );
        }
      }

      await saveMessage({ data: { threadId, role: "assistant", content: fullText } });
      await loadCredits();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assistant request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteThread(threadId: string) {
    try {
      await deleteThread({ data: { id: threadId } });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThread === threadId) {
        setActiveThread(null);
        setMessages([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete thread");
    }
  }

  async function handleRenameThread(threadId: string, title: string) {
    const next = window.prompt("Rename chat", title);
    if (!next) return;
    try {
      await renameThread({ data: { id: threadId, title: next } });
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, title: next } : t)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename thread");
    }
  }

  const activeTitle = useMemo(
    () => threads.find((t) => t.id === activeThread)?.title ?? "Smarty Assistant",
    [threads, activeThread],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === "chat" && threads.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView("threads")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-5 w-5 text-[#3B82F6]" />
              {view === "chat" ? activeTitle : "Chat history"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono" data-testid="credit-balance">
              {credits ?? "—"} credits
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <span className="sr-only">Close</span>✕
            </Button>
          </div>
        </div>
        <p className="mt-1 text-left text-sm text-muted-foreground">
          Ask Smarty about reports, player comparisons, workload, or training ideas.
        </p>
      </div>

      {view === "threads" ? (
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewThread}>
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
            {threads.map((t) => (
              <div
                key={t.id}
                className="group flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 cursor-pointer"
                onClick={() => setActiveThread(t.id)}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRenameThread(t.id, t.title)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteThread(t.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {threads.length === 0 && <p className="text-sm text-muted-foreground">No chats yet.</p>}
          </div>
        </ScrollArea>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-medium">Try asking</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="rounded-full border bg-white px-3 py-1.5 text-xs text-left hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    {m.role === "user" ? (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-[#3B82F6] text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-[#3B82F6] text-white" : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.role === "assistant" ? formatAnswer(m.content || (loading ? "Thinking…" : ""), workspaceContext) : m.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-[#3B82F6] text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="border-t p-4">
            <div className="flex items-end gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Smarty Assistant…"
                className="flex-1"
                disabled={loading}
                data-testid="assistant-input"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0 bg-[#3B82F6] hover:bg-[#2563EB]" data-testid="assistant-send">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
