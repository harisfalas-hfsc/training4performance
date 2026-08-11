import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { currentSeason, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — T4P Training 4 Performance" },
      {
        name: "description",
        content:
          "T4P costs €999 per season (1 June – 31 May) for one team, with unlimited players, unlimited staff users and every module included.",
      },
      { property: "og:title", content: "T4P Pricing — €999 per season" },
      { property: "og:description", content: "One team, one season, every module included." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const included = [
  "Team setup and unlimited squad size",
  "Full player passports: profile, tests, availability, medical",
  "Fitness testing battery with personal-best tracking",
  "Block-based training designer and drill library",
  "Interactive tactics board with image export",
  "Match-day-cycle calendar with participation tracking",
  "GPS import from any provider or your own template",
  "Your own composite load model, ACWR, monotony, strain",
  "Automated workload, wellness and availability alerts",
  "Logbook, pivot analytics and player comparisons",
  "Report templates and one-click PDF, PNG, Excel, CSV export",
  "Full workspace download — your data stays yours",
];

const notes = [
  { t: "One team per account", d: "One subscription = one account = one team. The coach who subscribes owns the workspace and every record in it.", tone: "border-brand-blue/25", label: "text-brand-blue" },
  { t: "Browse before you buy", d: "Any account can sign in and look at every screen of the platform. A subscription unlocks creating and editing your own data.", tone: "border-brand-green/25", label: "text-brand-green" },
  { t: "Season-based billing", d: "A subscription covers one full season from 1 June to 31 May, regardless of when you join. Prices are in euro and exclude VAT where applicable.", tone: "border-brand-amber/25", label: "text-brand-amber" },
  { t: "Export any time", d: "Download your team, squad, GPS, calendar, training designs, tests and medical data as Excel files or one ZIP backup — subscribed or not.", tone: "border-brand-teal/25", label: "text-brand-teal" },
];

function Pricing() {
  const { session } = useAuth();
  const season = currentSeason();

  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-indigo/10 via-background to-brand-cyan/10">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center">
          <p className="eyebrow text-brand-indigo">Pricing</p>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide">
            One price, one season, one team
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            The T4P season runs from <strong className="text-foreground">1 June to 31 May</strong>. Current season:{" "}
            {season.label} ({season.start} → {season.end}).
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="panel relative overflow-hidden border-brand-indigo/35 bg-gradient-to-br from-brand-indigo/10 to-brand-pink/10 p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo/15 px-3 py-1 text-xs font-semibold text-brand-indigo">
              <Sparkles className="size-3.5" /> Team subscription
            </span>
            <p className="mt-4 font-display text-6xl font-semibold leading-none">€999</p>
            <p className="mt-2 text-sm text-muted-foreground">per season, per team — every module included</p>
            <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> Unlimited players</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> Unlimited staff users</li>
              <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> No add-ons, no per-user fees</li>
            </ul>
            <Link
              to={session ? "/account" : "/auth"}
              {...(session ? {} : { search: { mode: "signup" } as never })}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              {session ? "Activate my subscription" : "Get started"}
            </Link>
            <Link
              to={session ? "/dashboard" : "/auth"}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              {session ? "Open the platform" : "Sign in"}
            </Link>
          </div>

          <div className="panel border-brand-green/25 p-6">
            <p className="eyebrow text-brand-green">Everything included</p>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {included.map((i) => (
                <li key={i} className="flex gap-2 rounded-md bg-surface-2 px-3 py-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {notes.map((n) => (
            <div key={n.t} className={`panel ${n.tone} p-5`}>
              <p className={`font-display text-base font-semibold uppercase tracking-wide ${n.label}`}>{n.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.d}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingPage>
  );
}
