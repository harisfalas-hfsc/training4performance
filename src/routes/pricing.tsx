import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { currentSeason, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — T4P Training 4 Performance" },
      {
        name: "description",
        content:
          "T4P costs €999 per season (1 June – 31 May) for one team, with unlimited staff users and every module included.",
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
  "Squad management and player passports",
  "Training calendar and drill library",
  "Interactive tactics board with export",
  "GPS import (Catapult, STATSports, GPEXE, Polar, T4P template)",
  "Training monitor logbook and pivot analytics",
  "Configurable composite load model, ACWR, monotony, strain",
  "Automated workload, wellness and availability alerts",
  "Report templates and scheduled one-click exports",
  "Unlimited staff users within your team",
];

function Pricing() {
  const { session } = useAuth();
  const season = currentSeason();

  return (
    <MarketingPage>
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">
          One price, one season, one team
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The T4P season runs from <strong className="text-foreground">1 June to 31 May</strong>. Current season:{" "}
          {season.label} ({season.start} → {season.end}).
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="panel border-primary/50 p-6">
            <p className="eyebrow text-primary">Team subscription</p>
            <p className="mt-2 font-display text-4xl font-semibold">€999</p>
            <p className="text-sm text-muted-foreground">per season, per team</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {included.map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
            <Link
              to={session ? "/account" : "/auth"}
              {...(session ? {} : { search: { mode: "signup" } as never })}
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              {session ? "Activate my subscription" : "Get started"}
            </Link>

          </div>

          <div className="panel p-6">
            <p className="eyebrow">What you get</p>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <p>
                One subscription covers your team for the full season: every module, every staff member, no per-user
                fees and no add-ons.
              </p>
              <p>
                One subscription = one account = one team. The coach who subscribes owns the workspace and all the data
                in it, and can export or delete it at any time.
              </p>
              <p>All prices are in euro and exclude VAT where applicable.</p>
            </div>
            <Link
              to={session ? "/account" : "/auth"}
              className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-border px-5 py-3 text-sm font-semibold"
            >
              {session ? "Go to my account" : "Sign in"}
            </Link>
          </div>
        </div>

        <div className="panel mt-6 p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">How billing works</p>
          <p className="mt-2">
            A subscription covers one full season from 1 June to 31 May, regardless of when you join. Access to the
            platform — dashboard, squad, training, tactics board, GPS, logbook, alerts, analytics and reports — is
            available while the subscription is active.
          </p>
        </div>
      </div>
    </MarketingPage>
  );
}
