import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  MessageSquare,
  Shield,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { T4P, SmartyAssistant } from "@/components/brand-text";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/smarty-assistant")({
  head: () => ({
    ...seoHead({
      path: "/smarty-assistant",
      title: "Smarty Assistant — AI Football Performance Analyst | T4P",
      description:
        "Smarty Assistant is the AI analyst inside T4P. Ask about squad workload, GPS metrics, player comparisons and ACWR trends in plain language and get instant football performance reports.",
      keywords: [
        "soccer analytics dashboard",
        "football training load report",
        "football team performance comparison tool",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/smarty-assistant",
        name: "Smarty Assistant — AI football performance analyst",
        description:
          "Smarty Assistant answers plain-language questions about squad workload, GPS metrics, player comparisons and training reports inside T4P.",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Smarty Assistant", path: "/smarty-assistant" },
      ]),
    ],
  }),
  component: SmartyAssistantPage,
});

const examples = [
  { q: "Who ran the most distance this week?", icon: BarChart3, tone: "blue" },
  { q: "Compare Player A and Player B workload", icon: Table2, tone: "green" },
  { q: "Give me a weekly load report for the squad", icon: MessageSquare, tone: "violet" },
  { q: "Which players are in the red zone?", icon: Zap, tone: "red" },
  { q: "Suggest a session for tomorrow based on load", icon: BrainCircuit, tone: "amber" },
  { q: "Explain my ACWR trend for the last 28 days", icon: Sparkles, tone: "cyan" },
];

function SmartyAssistantPage() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-cyan/8">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center">
          <p className="page-eyebrow">
            <SmartyAssistant />
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">
            Ask your Assistant anything
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <SmartyAssistant /> is the AI analyst inside <T4P />. It reads your team, sessions, GPS
            and wellness data and answers in plain language — reports, comparisons, workload trends
            and session ideas.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              Try it free <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel border-brand-blue/25 p-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-blue/12 text-brand-blue">
              <MessageSquare className="size-6" />
            </div>
            <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide">
              Natural questions
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              No query builder. Type the way you speak to a colleague and get a clear answer.
            </p>
          </div>
          <div className="panel border-brand-green/25 p-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-green/12 text-brand-green">
              <BarChart3 className="size-6" />
            </div>
            <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide">
              Charts & tables
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The assistant returns numbers, comparisons and visual summaries you can export or
              share.
            </p>
          </div>
          <div className="panel border-brand-violet/25 p-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-violet/12 text-brand-violet">
              <Shield className="size-6" />
            </div>
            <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide">
              Your data only
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              It only reads the workspace you are signed into. Other accounts are never visible.
            </p>
          </div>
        </div>

        <h2 className="mt-14 text-center font-display text-2xl font-semibold uppercase tracking-wide">
          Questions it can answer
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((ex) => {
            const Icon = ex.icon;
            return (
              <div
                key={ex.q}
                className={`panel flex items-center gap-3 border-brand-${ex.tone}/25 p-4`}
              >
                <div
                  className={`grid size-9 place-items-center rounded-lg bg-brand-${ex.tone}/12 text-brand-${ex.tone}`}
                >
                  <Icon className="size-4" />
                </div>
                <p className="text-sm font-medium text-foreground">“{ex.q}”</p>
              </div>
            );
          })}
        </div>

        <div className="panel mt-14 border-brand-blue/25 bg-gradient-to-r from-brand-blue/10 to-brand-cyan/10 p-6 text-center">
          <p className="font-display text-xl font-semibold uppercase tracking-wide">
            Part of every <T4P /> subscription
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <SmartyAssistant /> is included in the team plan. Usage is tracked per account and can
            be topped up from the owner panel.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              View pricing <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/about"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              About <T4P />
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
