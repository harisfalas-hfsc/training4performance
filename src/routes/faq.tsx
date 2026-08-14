import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ArrowRight, HelpCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { MarketingPage } from "@/components/marketing";
import { BrandCopy, T4P } from "@/components/brand-text";
import { breadcrumbLd, jsonLd, seoHead, webPageLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/faq")({
  head: () => ({
    ...seoHead({
      path: "/faq",
      title: "Frequently Asked Questions — T4P Training 4 Performance",
      description:
        "Answers to the most common questions about T4P: GPS import, training load, ACWR, pricing, data ownership, wellness, fitness testing and the player portal.",
      keywords: [
        "T4P FAQ",
        "football performance platform questions",
        "GPS training load FAQ",
        "ACWR football software",
        "football S&C coaching platform pricing",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/faq",
        name: "Frequently Asked Questions — T4P",
        description:
          "Answers to common questions about T4P: GPS import, training load, ACWR, pricing, data ownership, wellness, fitness testing and the player portal.",
        type: "FAQPage",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqSchema.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }),
    ],
  }),
  component: FAQ,
});

type FAQItem = {
  q: ReactNode;
  a: ReactNode;
  tone?: string;
};

const toneMap: Record<string, { border: string; text: string; chip: string }> = {
  blue: { border: "border-brand-blue/25", text: "text-brand-blue", chip: "bg-brand-blue/10" },
  green: { border: "border-brand-green/25", text: "text-brand-green", chip: "bg-brand-green/10" },
  violet: { border: "border-brand-violet/25", text: "text-brand-violet", chip: "bg-brand-violet/10" },
  pink: { border: "border-brand-pink/25", text: "text-brand-pink", chip: "bg-brand-pink/10" },
  amber: { border: "border-brand-amber/25", text: "text-brand-amber", chip: "bg-brand-amber/10" },
  indigo: { border: "border-brand-indigo/25", text: "text-brand-indigo", chip: "bg-brand-indigo/10" },
  cyan: { border: "border-brand-cyan/25", text: "text-brand-cyan", chip: "bg-brand-cyan/10" },
  teal: { border: "border-brand-teal/25", text: "text-brand-teal", chip: "bg-brand-teal/10" },
  red: { border: "border-brand-red/25", text: "text-brand-red", chip: "bg-brand-red/10" },
};

const toneKeys = ["blue", "green", "violet", "cyan", "amber", "indigo", "pink", "teal", "red"];

const faqText = [
  {
    q: "What is the drills & exercise library?",
    a: "A ready-made set of training blocks written by T4P, sorted by category — strength, power, speed, ESD, coordination, mobility & stability, reaction, technical/tactical and recovery. Open Library, or the Blocks tab inside the Training Designer, and one tap adds the whole block to the session with its drills, sets, reps, rest and tactics board drawing. Your own saved blocks live in the same place under My library.",
  },
  {
    q: "Do I keep my own blocks if my subscription ends?",
    a: "Yes. Everything you created — sessions, players, GPS, tests and the blocks in My library — stays with your account in read-only mode, and you can download all of it at any time. Only the ready-made T4P templates need an active subscription.",
  },
  {
    q: "Do I have to add the players before I upload GPS?",
    a: "No. The two orders are equally valid. Upload the file first and T4P creates every detected player for you; or build the squad first and the file matches the names it finds. Anything the GPS export does not contain — position, birth date, height, weight, RPE, medical status, test results — you add manually whenever you want, and only for the fields you actually care about.",
  },
  {
    q: "How much typing does this really save?",
    a: "One entry, everywhere. A name, a duration, a rating or a test result is typed once and the squad list, calendar, player record, load model, ACWR, alerts, charts and PDF reports all update themselves. There is no second spreadsheet to keep in sync and nothing to copy across after training.",
  },
  {
    q: "What does the subscription cost and what does it cover?",
    a: "€699 per season for one team, cancel any time. Every module is included and there is no per-user fee.",
  },
  {
    q: "Do I need a GPS system to use T4P?",
    a: "No — and this is not a limitation. Record the session, its duration and a 0-10 RPE after training and T4P produces session load (RPE x minutes), acute and chronic load, ACWR, monotony and strain, plus the same wellness, testing, alerts and PDF reports. GPS simply adds resolution to a system that already works without it.",
  },
  {
    q: "Which GPS providers are supported?",
    a: "Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system can be mapped column by column with the T4P template — including your own club KPIs.",
  },
  {
    q: "Can I change the ACWR formula?",
    a: "Yes. You pick the KPIs and their weights, so the composite load — and therefore ACWR — reflects your own methodology rather than a fixed formula.",
  },
  {
    q: "Can I edit or delete data after saving?",
    a: "Yes. Players, training days, plan parts, GPS rows, RPE values and test results can all be edited or removed, and you can wipe or delete the team and start again.",
  },
  {
    q: "Can I browse before I subscribe?",
    a: "Yes. Any account can sign in and look at every screen of the platform. A subscription unlocks creating and editing your own data.",
  },
  {
    q: "Is there a manual?",
    a: "Yes — a full illustrated user manual lives inside the platform, with numbered chapters, a search box, troubleshooting and a one-click PDF download of the whole document.",
  },
  {
    q: "Is my data protected?",
    a: "Each account is fully isolated — you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
  },
];

const stopDoingText = [
  { q: "Do I have to re-type player names?", a: "No. The squad is built from your GPS file, or once by hand. Every screen reuses the same player record." },
  { q: "Do I have to copy data between files?", a: "No. Import once, or rate the session once. Charts, tables, ACWR and reports update themselves." },
  { q: "Do I need manual formulas for load or ACWR?", a: "No. Load, acute vs chronic, ACWR, monotony and strain are calculated per player as the data arrives." },
  { q: "Do I have to scan every player manually?", a: "No. Thresholds watch workload, wellness and availability and tell you who needs attention." },
  { q: "Do I have to build the head coach's report myself?", a: "No. Pick the template, pick the dates, press export. PDF, PNG, Excel or CSV." },
  { q: "Do I need printed drill cards?", a: "No. The library holds the blocks and their board drawings. Pick one and it is already inside the session." },
  { q: "Do I have to chase wellness by message?", a: "No. Players check in from their own portal before the cut-off time, and you see who is missing." },
  { q: "Can I lose the season history?", a: "No. Every session, file, test, injury and rating stays in one place until you delete it." },
];

const faq: FAQItem[] = faqText.map((item) => ({
  q: <BrandCopy>{item.q}</BrandCopy>,
  a: <BrandCopy>{item.a}</BrandCopy>,
}));

const stopDoing: FAQItem[] = stopDoingText.map((item) => ({
  q: <BrandCopy>{item.q}</BrandCopy>,
  a: <BrandCopy>{item.a}</BrandCopy>,
}));

const allFaq = [...faq, ...stopDoing].map((item, i) => ({
  ...item,
  tone: toneKeys[i % toneKeys.length]!,
}));

const faqSchema = [...faqText, ...stopDoingText];

function FAQItem({
  item,
  open,
  onToggle,
}: {
  item: FAQItem & { tone: string };
  open: boolean;
  onToggle: () => void;
}) {
  const t = toneMap[item.tone]!;

  return (
    <div className={cn("panel overflow-hidden", t.border)}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl text-foreground transition-colors",
            t.chip,
          )}
        >
          <HelpCircle className={cn("size-4", t.text)} />
        </span>
        <span className="flex-1 font-display text-base font-semibold uppercase tracking-wide">
          {item.q}
        </span>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface-2 transition-transform duration-200",
            open && "rotate-180",
          )}
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </span>
      </button>
      {open ? (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </div>
      ) : null}
    </div>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-green/8">
        <div className="mx-auto max-w-7xl px-5 py-14 text-center">
          <p className="page-eyebrow">Frequently asked questions</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">
            Everything you want to know about <T4P />
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Straight answers about the workflow, pricing, GPS, training load, ACWR, data ownership and
            what changes on day one.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="space-y-3">
          {allFaq.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        <div className="panel mt-12 border-brand-indigo/30 bg-gradient-to-r from-brand-indigo/10 to-brand-cyan/10 p-6 text-center">
          <p className="font-display text-xl font-semibold uppercase tracking-wide">
            Still have questions?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account, browse the platform, and ask your question from inside the
            Communication Centre.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              Create your account <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/pricing"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}

export default FAQ;
