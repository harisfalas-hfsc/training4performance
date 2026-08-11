import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";

export const Route = createFileRoute("/haris-falas")({
  head: () => ({
    meta: [
      { title: "Haris Falas — Sports Scientist & S&C Coach | T4P" },
      {
        name: "description",
        content:
          "Haris Falas is a sports scientist and strength & conditioning coach who has worked with professional football teams in Cyprus, and the creator of T4P — Training 4 Performance.",
      },
      { property: "og:title", content: "Haris Falas — Creator of T4P" },
      {
        property: "og:description",
        content:
          "Sports scientist and strength & conditioning coach in professional football, creator of Training 4 Performance.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <MarketingPage>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <p className="eyebrow">Creator of <T4P /></p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">Haris Falas</h1>

        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <p><strong className="text-foreground">Sports scientist</strong></p>
          <p><strong className="text-foreground">Strength &amp; conditioning coach</strong></p>
          <p>Professional football · Cyprus</p>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Haris Falas is a sports scientist and strength &amp; conditioning coach. He has worked with several
          professional football teams in Cyprus, inside the daily reality of a club season: the weekly cycle
          around the match, the physical preparation of the squad, and the constant flow of data that comes
          with it.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Football today runs on data. Every session, every player, every day produces numbers — and someone
          has to collect them, keep them clean, understand them and turn them into decisions. In most clubs
          that someone is one person. In many teams the strength &amp; conditioning department is a single
          scientist covering the whole squad, and the work of organising the data takes more time than the
          work of coaching it.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          That is where <T4P /> comes from. Haris spent years managing that work by hand and looking for one
          platform that could hold all of it together — planning and periodisation, the data of every
          session, the reporting to the head coach and to the club, player development, return to play, GPS
          and testing — instead of a folder of spreadsheets, exports and separate tools that never talk to
          each other.
        </p>

        <h2 className="mt-8 font-display text-lg font-semibold">Why <T4P /> was built</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <T4P /> grew directly out of the training monitor logbook Haris built and used with his own squad —
          daily training records, session data, RPE, tests and player notes. The spreadsheet worked, but it
          could not scale, could not protect sensitive data, and could not answer a question fast enough on a
          match-day-minus-one morning. <T4P /> is that logbook rebuilt as one connected platform, so the work is
          done faster and the answers are there when the coach asks for them.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/about" className="rounded-full border-2 border-primary px-5 py-2 text-sm font-semibold text-primary">
            About <T4P />
          </Link>
          <Link
            to="/pricing"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Pricing
          </Link>
        </div>
      </div>
    </MarketingPage>
  );
}
