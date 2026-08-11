import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AssistantChat } from "@/components/assistant-chat";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "AI Performance Assistant — T4P" },
      {
        name: "description",
        content:
          "Ask Smarty Assistant about squad workload, player comparisons, training reports and GPS analytics.",
      },
      { property: "og:title", content: "AI Performance Assistant — T4P" },
      { property: "og:description", content: "Ask Smarty Assistant about squad workload, player comparisons, training reports and GPS analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  return (
    <AppShell title="AI Performance Assistant" subtitle="Ask Smarty about reports, comparisons and workload">
      <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-xl border bg-white shadow-sm">
        <AssistantChat onClose={() => {}} />
      </div>
    </AppShell>
  );
}
