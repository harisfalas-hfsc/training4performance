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

type Section = {
  id: string;
  label: string;
  title: string;
  intro: string;
  tone: string;
  items: { q: string; a: string }[];
};

const SECTIONS: Section[] = [
  {
    id: "plans",
    label: "01",
    title: "Subscription, pricing & access",
    intro: "What it costs, what is included and what happens to your work if you stop.",
    tone: "blue",
    items: [
      {
        q: "What does the subscription cost and what does it cover?",
        a: "€699 per season for one team, cancel any time. Every module is included and there is no per-user fee.",
      },
      {
        q: "Can I browse before I subscribe?",
        a: "Yes. Any account can sign in and look at every screen of the platform. A subscription unlocks creating and editing your own data.",
      },
      {
        q: "Do I keep my own work if my subscription ends?",
        a: "Yes. Everything you created — sessions, players, GPS, tests and the blocks in My library — stays with your account in read-only mode, and you can download all of it at any time. Only the ready-made T4P templates need an active subscription.",
      },
      {
        q: "Do I need a GPS system to subscribe?",
        a: "No — and this is not a limitation. Record the session, its duration and a 0-10 RPE after training and T4P produces session load (RPE x minutes), acute and chronic load, ACWR, monotony and strain, plus the same wellness, testing, alerts and PDF reports. GPS simply adds resolution to a system that already works without it.",
      },
    ],
  },
  {
    id: "setup",
    label: "02",
    title: "Getting started — squad, GPS & data entry",
    intro: "The first week: building the squad, importing files and what you have to type.",
    tone: "green",
    items: [
      {
        q: "Do I have to add the players before I upload GPS?",
        a: "No. The two orders are equally valid. Upload the file first and T4P creates every detected player for you; or build the squad first and the file matches the names it finds. Anything the GPS export does not contain — position, birth date, height, weight, RPE, medical status, test results — you add manually whenever you want, and only for the fields you actually care about.",
      },
      {
        q: "Which GPS providers are supported?",
        a: "Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system can be mapped column by column with the T4P template — including your own club KPIs.",
      },
      {
        q: "Do I have to re-type player names?",
        a: "No. The squad is built from your GPS file, or once by hand. Every screen reuses the same player record.",
      },
      {
        q: "Do I have to copy data between files?",
        a: "No. Import once, or rate the session once. Charts, tables, ACWR and reports update themselves.",
      },
      {
        q: "How much typing does this really save?",
        a: "One entry, everywhere. A name, a duration, a rating or a test result is typed once and the squad list, calendar, player record, load model, ACWR, alerts, charts and PDF reports all update themselves. There is no second spreadsheet to keep in sync and nothing to copy across after training.",
      },
    ],
  },
  {
    id: "daily",
    label: "03",
    title: "Daily use — training, load & monitoring",
    intro: "How the platform is used week to week once the squad is in.",
    tone: "violet",
    items: [
      {
        q: "What is the drills & exercise library?",
        a: "A ready-made set of training blocks written by T4P, sorted by category — strength, power, speed, ESD, coordination, mobility & stability, reaction, technical/tactical and recovery. Open Library, or the Blocks tab inside the Training Designer, and one tap adds the whole block to the session with its drills, sets, reps, rest and tactics board drawing. Your own saved blocks live in the same place under My library.",
      },
      {
        q: "Do I need printed drill cards?",
        a: "No. The library holds the blocks and their board drawings. Pick one and it is already inside the session.",
      },
      {
        q: "Can I change the ACWR formula?",
        a: "Yes. You pick the KPIs and their weights, so the composite load — and therefore ACWR — reflects your own methodology rather than a fixed formula.",
      },
      {
        q: "Do I need manual formulas for load or ACWR?",
        a: "No. Load, acute vs chronic, ACWR, monotony and strain are calculated per player as the data arrives.",
      },
      {
        q: "Do I have to scan every player manually?",
        a: "No. Thresholds watch workload, wellness and availability and tell you who needs attention.",
      },
      {
        q: "Do I have to chase wellness by message?",
        a: "No. Players check in from their own portal before the cut-off time, and you see who is missing.",
      },
      {
        q: "Do I have to build the head coach's report myself?",
        a: "No. Pick the template, pick the dates, press export. PDF, PNG, Excel or CSV.",
      },
    ],
  },
  {
    id: "apps",
    label: "04",
    title: "Apps, offline use & the manual",
    intro: "Installing T4P on your machine and using it with no connection.",
    tone: "cyan",
    items: [
      {
        q: "Is there a desktop version I can install?",
        a: "Yes. T4P installs like any normal program: a setup wizard on Windows (T4P-Setup-Windows.exe) and a drag-to-Applications disk image on macOS (T4P-Installer-macOS.dmg). Both are on the Download page, linked from the footer, with step-by-step instructions. The app carries the T4P icon and appears in the Start Menu, taskbar or Dock.",
      },
      {
        q: "Does T4P work without an internet connection?",
        a: "Yes — the desktop app and the website both keep working offline. Everything already in your workspace stays readable and editable with no connection, and anything you change offline is stored on the machine and pushed to the cloud automatically the moment you are back online. You only need a connection for the very first sign-in.",
      },
      {
        q: "Is there a manual?",
        a: "Yes — a full illustrated user manual lives inside the platform, with numbered chapters, a search box, troubleshooting and a one-click PDF download of the whole document.",
      },
    ],
  },
  {
    id: "data",
    label: "05",
    title: "Your data, privacy & control",
    intro: "Who owns the data, what can be changed and what is never lost.",
    tone: "amber",
    items: [
      {
        q: "Is my data protected?",
        a: "Each account is fully isolated — you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
      },
      {
        q: "Can I edit or delete data after saving?",
        a: "Yes. Players, training days, plan parts, GPS rows, RPE values and test results can all be edited or removed, and you can wipe or delete the team and start again.",
      },
      {
        q: "Can I lose the season history?",
        a: "No. Every session, file, test, injury and rating stays in one place until you delete it.",
      },
    ],
  },
];

const faqSchema = SECTIONS.flatMap((s) => s.items);

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
        <nav className="mb-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {SECTIONS.map((s) => {
            const t = toneMap[s.tone]!;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-panel",
                  t.border,
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold",
                    t.chip,
                    t.text,
                  )}
                >
                  {s.label}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{s.title}</span>
              </a>
            );
          })}
        </nav>

        <div className="space-y-12">
          {SECTIONS.map((s) => {
            const t = toneMap[s.tone]!;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <div className="mb-4 flex items-start gap-4">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-bold",
                      t.chip,
                      t.text,
                    )}
                  >
                    {s.label}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
                      <BrandCopy>{s.title}</BrandCopy>
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      <BrandCopy>{s.intro}</BrandCopy>
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {s.items.map((item, i) => {
                    const key = `${s.id}-${i}`;
                    return (
                      <FAQItem
                        key={key}
                        item={{
                          q: <BrandCopy>{item.q}</BrandCopy>,
                          a: <BrandCopy>{item.a}</BrandCopy>,
                          tone: s.tone,
                        }}
                        open={openId === key}
                        onToggle={() => setOpenId(openId === key ? null : key)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
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
