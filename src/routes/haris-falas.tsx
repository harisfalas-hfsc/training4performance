import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/marketing";

export const Route = createFileRoute("/haris-falas")({
  head: () => ({
    meta: [
      { title: "Haris Falas — Sports Scientist & S&C Coach | T4P" },
      {
        name: "description",
        content:
          "Profile of Haris Falas, sports scientist, fitness coach and strength & conditioning coach, creator of T4P — Training 4 Performance.",
      },
      { property: "og:title", content: "Haris Falas — Creator of T4P" },
      {
        property: "og:description",
        content: "Sports scientist, fitness coach and strength & conditioning coach in professional football.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <MarketingPage>
      <div className="mx-auto max-w-4xl px-5 py-14">
        <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
          <div>
            <div className="grid aspect-square place-items-center rounded-lg border border-border bg-surface-2 font-display text-5xl font-semibold uppercase tracking-widest text-primary">
              HF
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p><strong className="text-foreground">Role:</strong> Sports scientist</p>
              <p><strong className="text-foreground">Also:</strong> Fitness coach · S&amp;C coach</p>
              <p><strong className="text-foreground">Field:</strong> Professional football</p>
            </div>
          </div>

          <div>
            <p className="eyebrow">Creator of T4P</p>
            <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">Haris Falas</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Haris Falas is a sports scientist, fitness coach and strength &amp; conditioning coach working in
              professional football. His work sits where physical preparation, data and coaching meet: planning the
              weekly microcycle around the match, prescribing and monitoring load, running the testing calendar,
              managing return-to-play alongside the medical team, and translating all of it into decisions the head
              coach can use on the pitch.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold">Areas of work</h2>
            <ul className="mt-2 ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
              <li>Periodisation and microcycle design around the match-day cycle.</li>
              <li>GPS and external load monitoring: distance, high-speed running, sprints, accelerations, decelerations.</li>
              <li>Internal load: session-RPE, wellness monitoring, acute:chronic workload ratio, monotony and strain.</li>
              <li>Physical testing batteries: jumps, Yo-Yo, MAS, VO2, sprint and change-of-direction, FMS, strength.</li>
              <li>Return-to-play progression and reconditioning in collaboration with the medical department.</li>
              <li>Strength &amp; conditioning programming for team and individual needs.</li>
              <li>Reporting for coaching, performance and medical staff.</li>
            </ul>

            <h2 className="mt-8 font-display text-lg font-semibold">Why T4P was built</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              T4P grew directly out of the training monitor logbook Haris built and used with his squad — daily
              training records, drill-by-drill GPS splits, RPE, test rounds and player descriptions. The
              spreadsheet worked, but it could not scale, could not protect medical data, and could not answer
              questions fast enough on a match-day-minus-one morning. T4P is that logbook rebuilt as a connected,
              role-aware platform for a whole performance department.
            </p>

            <h2 className="mt-8 font-display text-lg font-semibold">Other projects</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Haris is also behind <strong className="text-foreground">Smarty Workout</strong>, a training and
              workout platform for individual athletes and coaches, where his full professional profile and
              background are presented in detail.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/about" className="rounded-md border border-border px-4 py-2 text-sm font-semibold">
                About T4P
              </Link>
              <Link
                to="/pricing"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
