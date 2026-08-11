import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AssistantChat } from "@/components/assistant-chat";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: SmartyAssistantPage,
  head: () => ({
    meta: [
      { title: "Smarty Assistant · T4P" },
      { name: "description", content: "Ask Smarty Assistant about squad workload, player comparisons, training reports and GPS analytics." },
      { property: "og:title", content: "Smarty Assistant · T4P" },
      { property: "og:description", content: "Ask Smarty Assistant about squad workload, player comparisons, training reports and GPS analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SmartyAssistantPage() {
  return (
    <AppShell title="Smarty Assistant" subtitle="AI analyst for your squad">
      <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-xl border bg-white shadow-sm">
        <AssistantChat onClose={() => {}} />
      </div>
    </AppShell>
  );
}
