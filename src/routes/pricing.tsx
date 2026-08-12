import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
import { currentSeason, useAuth } from "@/lib/auth";
import {
  breadcrumbLd,
  jsonLd,
  seoHead,
  webPageLd,
  OG_IMAGE,
  ORGANIZATION_ID,
  SITE_NAME,
  SITE_URL,
  SOFTWARE_ID,
} from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    ...seoHead({
      path: "/pricing",
      title: "Pricing — €999 Per Season | Football S&C Software | T4P",
      description:
        "T4P costs €999 per season (1 June – 31 May) for one football team: unlimited players, unlimited staff users, GPS, ACWR, testing, wellness and reporting included.",
      keywords: [
        "football performance management platform pricing",
        "athlete monitoring system football price",
        "S&C coach software subscription",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/pricing",
        name: "T4P Pricing",
        description:
          "T4P pricing: EUR 999 per season for one football team, unlimited players and unlimited staff users, with every module included.",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ]),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${SITE_URL}/pricing#product`,
        name: "T4P Team Season Subscription",
        mainEntityOfPage: { "@id": `${SITE_URL}/pricing#webpage` },
        category: "Football performance management software",
        description:
          "One season of T4P — Training 4 Performance for one football team: squad management, training design, GPS import, training load and ACWR, wellness, fitness testing, alerts and reports, with unlimited staff users.",
        image: OG_IMAGE,
        brand: { "@type": "Brand", name: SITE_NAME },
        isRelatedTo: { "@id": SOFTWARE_ID },
        url: `${SITE_URL}/pricing`,
        offers: {
          "@type": "Offer",
          price: "999",
          priceCurrency: "EUR",
          url: `${SITE_URL}/pricing`,
          availability: "https://schema.org/InStock",
          category: "Season subscription",
          priceValidUntil: "2027-05-31",
          seller: { "@id": ORGANIZATION_ID },
        },
      }),
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
  {
    t: "One team per account",
    d: "One subscription = one account = one team. The coach who subscribes owns the workspace and every record in it.",
    tone: "border-brand-blue/25",
    label: "text-brand-blue",
  },
  {
    t: "Browse before you buy",
    d: "Any account can sign in and look at every screen of the platform. A subscription unlocks creating and editing your own data.",
    tone: "border-brand-green/25",
    label: "text-brand-green",
  },
  {
    t: "Season-based billing",
    d: "A subscription covers one full season from 1 June to 31 May, regardless of when you join. Prices are in euro and exclude VAT where applicable.",
    tone: "border-brand-amber/25",
    label: "text-brand-amber",
  },
  {
    t: "Export any time",
    d: "Download your team, squad, GPS, calendar, training designs, tests and medical data as Excel files or one ZIP backup — subscribed or not.",
    tone: "border-brand-teal/25",
    label: "text-brand-teal",
  },
];

function Pricing() {
  const { session } = useAuth();
  const season = currentSeason();

  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-indigo/10 via-background to-brand-cyan/10">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center">
          <p className="page-eyebrow">Pricing</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">
            One price, one season, one team
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            The <T4P /> season runs from{" "}
            <strong className="text-foreground">1 June to 31 May</strong>. Current season:{" "}
            {season.label} ({season.start} → {season.end}).
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="panel relative overflow-hidden border-brand-indigo/35 bg-gradient-to-br from-brand-indigo/10 to-brand-pink/10 p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-indigo/15 px-3 py-1 text-xs font-semibold text-brand-indigo">
              <Sparkles className="size-3.5" /> Team subscription
            </span>
            <p className="mt-4 font-display text-6xl font-semibold leading-none">€999</p>
            <p className="mt-2 text-sm text-muted-foreground">
              per season, per team — every module included
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> Unlimited players
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> Unlimited staff users
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-green" /> No add-ons, no
                per-user fees
              </li>
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
              <p
                className={`font-display text-base font-semibold uppercase tracking-wide ${n.label}`}
              >
                {n.t}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{n.d}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingPage>
  );
}
