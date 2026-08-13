import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardPen,
  FlaskConical,
  Gauge,
  Lock,
  PlayCircle,
  Radar,
  RotateCcw,
  Users,
} from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { BrandCopy, T4P } from "@/components/brand-text";
import { Button } from "@/components/ui/button";
import { activateDemo, resetDemo } from "@/lib/demo";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/demo")({
  head: () => ({
    ...seoHead({
      path: "/demo",
      title: "Live Demo — Try T4P With A Ready-Made Team | T4P",
      description:
        "Open the T4P demo team: five players, seven tagged trainings with tactics-board and strength examples, GPS data, manual RPE and fitness tests.",
      keywords: [
        "football performance software demo",
        "GPS training load demo",
        "athlete monitoring demo",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/demo",
        name: "T4P Live Demo",
        description:
          "Interactive demo of the T4P football performance platform with a seeded team, training week, GPS reports and fitness tests.",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Live demo", path: "/demo" },
      ]),
    ],
  }),
  component: DemoPage,
});

const INSIDE = [
  {
    icon: Users,
    title: "One team, five players",
    text: "The T4P demo squad — goalkeeper, defender, midfielder, winger and striker, each with a full passport.",
  },
  {
    icon: CalendarDays,
    title: "Seven complete trainings",
    text: "Monday to Sunday, four timed blocks a day: recovery, strength, pitch, tactics-board work, match day and individual recovery.",
  },
  {
    icon: ClipboardPen,
    title: "Tagged drills",
    text: "Rondo 5v2, passing drill, SSG 4v4, back squat, Bulgarian split squat — search how often each one was used.",
  },
  {
    icon: Radar,
    title: "GPS per session and per block",
    text: "Distance, HSR, sprints, accelerations, decelerations and jumps, split across every block of the day.",
  },
  {
    icon: Activity,
    title: "Manual RPE",
    text: "Gym blocks have no GPS, so their load comes from RPE × minutes and adds on top of the GPS load.",
  },
  {
    icon: Gauge,
    title: "Training load & ACWR",
    text: "The load model is already switched on: change the KPI weights and watch every chart recalculate.",
  },
  {
    icon: BarChart3,
    title: "Analytics & reports",
    text: "Ask the same question everywhere: who (team or players) → what (training, tests, GPS) → KPIs and dates.",
  },
  {
    icon: FlaskConical,
    title: "Fitness tests",
    text: "A pre-season battery: CMJ, 10 m and 30 m sprint, max speed, Yo-Yo, squat and split squat.",
  },
];

const ALLOWED = [
  "Edit, duplicate, schedule or un-complete any session",
  "Add and edit drills, blocks, tags, times and strength prescriptions",
  "Enter manual RPE for any block or player",
  "Record fitness tests and wellness answers",
  "Use the tactics board, calculators and Smarty Assistant",
  "Open every chart, table and player passport",
];

const BLOCKED = [
  "Creating extra teams or adding players to the squad",
  "Editing or deleting the GPS report itself",
  "Exporting anything — Excel, CSV, ZIP, PDF or chart images",
];

function DemoPage() {
  const navigate = useNavigate();

  const start = () => {
    activateDemo();
    void navigate({ to: "/dashboard" });
  };

  return (
    <MarketingPage>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center">
          <p className="page-eyebrow">Live demo</p>
          <h1 className="mt-3 font-display text-3xl font-semibold uppercase tracking-wide sm:text-4xl">
            Try <T4P /> with a team that is already set up
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            No sign-up, no card, nothing to import. One click opens the platform with the demo team{" "}
            <T4P className="text-foreground" />: five players, a full week of training
            in blocks, GPS data, manual RPE and a fitness-test battery. Everything is live — change
            the load model, edit a session, add an RPE and see the numbers move.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="gap-2" onClick={start}>
              <PlayCircle className="size-5" /> Open the demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              onClick={() => {
                resetDemo();
                void navigate({ to: "/dashboard" });
              }}
            >
              <RotateCcw className="size-4" /> Start it fresh
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The demo lives in this browser tab only. Your own account and data are never touched.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-center font-display text-xl font-semibold uppercase tracking-wide">
          What is inside
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {INSIDE.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center rounded-xl border border-border bg-surface p-4 text-center"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-4" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground"><BrandCopy>{item.text}</BrandCopy></p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-5xl gap-4 px-5 py-12 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
              You can do all of this
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {ALLOWED.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
              <Lock className="size-4 text-muted-foreground" aria-hidden /> Only these are off
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {BLOCKED.map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              They all work normally on a subscription — €69.90 per month, one team, unlimited
              players.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 text-center">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide">
          Ready when you are
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Open the demo, spend ten minutes inside it, and you will know exactly how your own season
          would look.
        </p>
        <Button size="lg" className="mt-5 gap-2" onClick={start}>
          <PlayCircle className="size-5" /> Open the demo
        </Button>
      </section>
    </MarketingPage>
  );
}
