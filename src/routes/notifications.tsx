import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LifeBuoy } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
import { useAuth } from "@/lib/auth";
import { seoHead } from "@/lib/seo";
import { AccountNotifications } from "@/components/account-notifications";
import { SupportCentre } from "@/components/support-centre";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    ...seoHead({
      path: "/notifications",
      title: "Notification centre | T4P",
      description: "Everything T4P sends you and everything you ask T4P: notifications and the support centre.",
      card: "summary",
      noindex: true,
    }),
  }),
  validateSearch: (search: Record<string, unknown>): { tab?: "notifications" | "support" } =>
    search["tab"] === "support" ? { tab: "support" } : {},
  component: NotificationCentre,
});

function NotificationCentre() {
  const { tab: tabParam } = Route.useSearch();
  const { loading, session, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"notifications" | "support">(tabParam ?? "notifications");

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session || !user) {
    return (
      <MarketingPage>
        <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="eyebrow">Notification centre</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">Notification centre</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything <T4P /> sends you — payments, renewals, alerts and announcements — and everything you ask <T4P />.
          Your subscription, data and account settings live in Manage account at /account.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {([
            ["notifications", "Notifications", Bell],
            ["support", "Support", LifeBuoy],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center justify-center gap-2 rounded-full px-2 py-2 text-xs font-semibold sm:text-sm ${
                tab === k ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "notifications" ? <AccountNotifications userId={user.id} /> : <SupportCentre userId={user.id} />}
        </div>
      </div>
    </MarketingPage>
  );
}
