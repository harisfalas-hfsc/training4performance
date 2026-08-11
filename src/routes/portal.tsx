import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Activity, HeartPulse, LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { MultiLine, TrendArea, TrendBars } from "@/components/charts";
import { T4P } from "@/components/brand-text";
import { WELLNESS_FIELDS, type WellnessField } from "@/data/wellness";
import { portalLogin, portalPayload, portalSaveWellness, portalSignIn, type PortalPayload } from "@/lib/portal.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({
    ...seoHead({
      path: "/portal",
      title: "Player Portal | T4P Training 4 Performance",
      description:
        "Players sign in to complete the daily wellness questionnaire and follow their own training response in simple graphs.",
      card: "summary",
      noindex: true,
    }),
  }),
  component: PortalPage,
});

const CODE_KEY = "t4p.portalToken";
const todayIso = () => new Date().toISOString().slice(0, 10);

type Answers = Record<WellnessField, number> & { sleepHours: number | null; note: string };

const blankAnswers = (): Answers => ({
  sleep: 3,
  fatigue: 3,
  soreness: 3,
  stress: 3,
  mood: 3,
  hydration: 3,
  readiness: 3,
  sleepHours: 8,
  note: "",
});

function PortalPage() {
  const [token, setToken] = useState("");
  const [payload, setPayload] = useState<PortalPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = useServerFn(portalSignIn);
  const loginWithCode = useServerFn(portalLogin);
  const fetchPayload = useServerFn(portalPayload);

  const openWithToken = useCallback(
    async (value: string, quiet = false) => {
      setLoading(true);
      try {
        const data = await fetchPayload({ data: { code: value } });
        setPayload(data);
        setToken(value);
        window.localStorage.setItem(CODE_KEY, value);
      } catch {
        window.localStorage.removeItem(CODE_KEY);
        setPayload(null);
        if (!quiet) toast.error("Your access is not active. Ask your coach.");
      } finally {
        setLoading(false);
      }
    },
    [fetchPayload],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(CODE_KEY);
    if (saved) void openWithToken(saved, true);
  }, [openWithToken]);

  const withEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const identity = await signIn({ data: { email, password } });
      await openWithToken(identity.token);
    } catch {
      toast.error("Wrong email or password.");
      setLoading(false);
    }
  };

  const withCode = async (code: string) => {
    setLoading(true);
    try {
      const identity = await loginWithCode({ data: { code: code.trim().toUpperCase() } });
      await openWithToken(identity.token);
    } catch {
      toast.error("That code is not valid. Ask your coach for a new one.");
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!token) return;
    const data = await fetchPayload({ data: { code: token } });
    setPayload(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-t4p.png" alt="Training 4 Performance logo" className="size-10 object-contain" />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Player portal</p>
              <p className="truncate text-xs text-muted-foreground">
                {payload ? payload.identity.playerName : "Sign in with the login your coach gave you"}
              </p>
            </div>
          </div>
          {payload ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
              onClick={() => {
                window.localStorage.removeItem(CODE_KEY);
                setPayload(null);
                setToken("");
              }}
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {!payload ? (
          <LoginCard loading={loading} onEmail={(e, p) => void withEmail(e, p)} onCode={(c) => void withCode(c)} />
        ) : (
          <PortalHome payload={payload} code={token} onSaved={() => void refresh()} />
        )}
      </main>
    </div>
  );
}

function LoginCard({
  loading,
  onEmail,
  onCode,
}: {
  loading: boolean;
  onEmail: (email: string, password: string) => void;
  onCode: (code: string) => void;
}) {
  const [mode, setMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  return (
    <form
      className="panel mx-auto max-w-md space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (mode === "password") onEmail(email, password);
        else onCode(code);
      }}
    >
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="size-5" />
        <h1 className="text-lg font-semibold">Sign in to your portal</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Your coach created your login. It only opens your own wellness questionnaire and the reports he shared with you inside <T4P />.
      </p>

      {mode === "password" ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Email</span>
            <input
              className="control w-full"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">Password</span>
            <input
              className="control w-full"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </>
      ) : (
        <input
          className="control w-full text-center font-mono text-lg tracking-widest"
          placeholder="ABC123DEF"
          autoCapitalize="characters"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Checking…" : "Open my portal"}
      </button>
      <button
        type="button"
        className="w-full text-xs text-muted-foreground hover:underline"
        onClick={() => setMode(mode === "password" ? "code" : "password")}
      >
        {mode === "password" ? "I only have an access code" : "I have an email and password"}
      </button>
    </form>
  );
}

const RANGES = [
  { id: "day", label: "Day", days: 7 },
  { id: "week", label: "Week", days: 42 },
  { id: "month", label: "Month", days: 180 },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

function PortalHome({ payload, code, onSaved }: { payload: PortalPayload; code: string; onSaved: () => void }) {
  const r = payload.identity.reports;
  const canReports = r.gps || r.tests || r.load;
  const [tab, setTab] = useState<"wellness" | "reports">(r.wellness ? "wellness" : "reports");
  const answeredToday = payload.wellness.some((w) => w.date === todayIso());

  if (!r.wellness && !canReports) {
    return (
      <div className="panel p-6 text-center text-sm text-muted-foreground">
        Your coach has not shared anything with you yet. Check back later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid gap-1 ${r.wellness && canReports ? "grid-cols-2" : "grid-cols-1"}`}>
        {r.wellness ? (
        <button
          type="button"
          onClick={() => setTab("wellness")}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold ${
            tab === "wellness" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
          }`}
        >
          <HeartPulse className="size-4" /> Daily wellness{answeredToday ? " ✓" : ""}
        </button>
        ) : null}
        {canReports ? (
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold ${
            tab === "reports" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
          }`}
        >
          <Activity className="size-4" /> My reports
        </button>
        ) : null}
      </div>

      {tab === "wellness" && r.wellness ? (
        <WellnessTab payload={payload} code={code} onSaved={onSaved} />
      ) : (
        <ReportsTab payload={payload} />
      )}
    </div>
  );
}

function WellnessTab({ payload, code, onSaved }: { payload: PortalPayload; code: string; onSaved: () => void }) {
  const existing = payload.wellness.find((w) => w.date === todayIso());
  const [answers, setAnswers] = useState<Answers>(() =>
    existing
      ? {
          sleep: existing.sleep,
          fatigue: existing.fatigue,
          soreness: existing.soreness,
          stress: existing.stress,
          mood: existing.mood,
          hydration: existing.hydration,
          readiness: existing.readiness,
          sleepHours: existing.sleepHours,
          note: existing.note ?? "",
        }
      : blankAnswers(),
  );
  const [saving, setSaving] = useState(false);
  const save = useServerFn(portalSaveWellness);

  const submit = async () => {
    setSaving(true);
    try {
      await save({
        data: {
          code,
          entry: {
            date: todayIso(),
            sleepHours: answers.sleepHours,
            sleep: answers.sleep,
            fatigue: answers.fatigue,
            soreness: answers.soreness,
            stress: answers.stress,
            mood: answers.mood,
            hydration: answers.hydration,
            readiness: answers.readiness,
            note: answers.note || null,
          },
        },
      });
      toast.success("Thanks — your coach can see it now.");
      onSaved();
    } catch {
      toast.error("Could not send your answers. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel space-y-4 p-4">
      <div>
        <h2 className="text-base font-semibold">How do you feel today?</h2>
        <p className="text-sm text-muted-foreground">
          {existing ? "You already answered today — you can update it." : "Slide each question. 1 = worst, 5 = best."}
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="eyebrow">Hours slept last night</span>
        <input
          type="number"
          min={0}
          max={16}
          step={0.5}
          className="control"
          value={answers.sleepHours ?? ""}
          onChange={(e) =>
            setAnswers((a) => ({ ...a, sleepHours: e.target.value === "" ? null : Number(e.target.value) }))
          }
        />
      </label>

      {WELLNESS_FIELDS.map((field) => (
        <div key={field.key} className="rounded-md border border-border bg-surface-2 p-3">
          <p className="text-sm font-medium">{field.label}</p>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={answers[field.key]}
            onChange={(e) => setAnswers((a) => ({ ...a, [field.key]: Number(e.target.value) }))}
            className="mt-2 w-full accent-[var(--color-primary)]"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{field.low}</span>
            <span>{field.high}</span>
          </div>
        </div>
      ))}

      <label className="flex flex-col gap-1">
        <span className="eyebrow">Anything else? (optional)</span>
        <textarea
          className="control min-h-16"
          value={answers.note}
          onChange={(e) => setAnswers((a) => ({ ...a, note: e.target.value }))}
          placeholder="Niggle, illness, travel…"
        />
      </label>

      <button
        type="button"
        disabled={saving}
        onClick={() => void submit()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        <Save className="size-4" /> {saving ? "Sending…" : existing ? "Update my answers" : "Send to my coach"}
      </button>
    </div>
  );
}

/* ---------------- Reports (graphs only, no numbers) ---------------- */

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

function ReportsTab({ payload }: { payload: PortalPayload }) {
  const r = payload.identity.reports;
  const shows = (metric: string) => r.metrics.includes(metric);
  const [range, setRange] = useState<RangeId>("week");
  const days = RANGES.find((r) => r.id === range)!.days;
  const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const gps = payload.gps
    .filter((g) => String(g["playerId"]) === payload.identity.playerId && String(g["date"]) >= from)
    .sort((a, b) => String(a["date"]).localeCompare(String(b["date"])));

  const bucket = range === "day" ? "day" : range === "week" ? "week" : "month";
  const grouped = groupRows(gps, bucket);

  const wellness = payload.wellness
    .filter((w) => w.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({
      date: w.date.slice(5),
      wellness: Math.round(
        ((w.sleep + w.fatigue + w.soreness + w.stress + w.mood + w.hydration + w.readiness) / 35) * 100,
      ),
    }));

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${
              range === r.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {r.gps && shows("distance") ? (
      <ChartPanel title="Running volume" hint="Total distance covered">
        {grouped.length ? <TrendArea data={grouped} dataKey="distance" height={200} hideAxisValues /> : <Empty />}
      </ChartPanel>
      ) : null}

      {r.gps && (shows("hsr") || shows("sprint")) ? (
      <ChartPanel title="High-speed running & sprinting" hint="How much fast running you did">
        {grouped.length ? (
          <MultiLine
            data={grouped}
            dualAxis={false}
            hideAxisValues
            series={[
              { key: "hsr", color: "var(--color-chart-2)", name: "High-speed running" },
              { key: "sprint", color: "var(--color-chart-3)", name: "Sprinting" },
            ]}
            height={200}
          />
        ) : (
          <Empty />
        )}
      </ChartPanel>
      ) : null}

      {r.gps && (shows("accel") || shows("decel")) ? (
      <ChartPanel title="Accelerations & decelerations" hint="Explosive efforts">
        {grouped.length ? (
          <MultiLine
            data={grouped}
            dualAxis={false}
            hideAxisValues
            series={[
              { key: "accel", color: "var(--color-chart-1)", name: "Accelerations" },
              { key: "decel", color: "var(--color-chart-4)", name: "Decelerations" },
            ]}
            height={200}
          />
        ) : (
          <Empty />
        )}
      </ChartPanel>
      ) : null}

      {r.load ? (
      <ChartPanel title="Training effort" hint="How hard the sessions felt">
        {grouped.length ? <TrendBars data={grouped} dataKey="load" height={200} hideAxisValues /> : <Empty />}
      </ChartPanel>
      ) : null}

      {r.tests ? <TestsPanel payload={payload} /> : null}

      {r.wellness ? (
      <ChartPanel title="How you have been feeling" hint="Your own daily answers">
        {wellness.length ? <TrendArea data={wellness} dataKey="wellness" height={200} hideAxisValues /> : <Empty />}
      </ChartPanel>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Graphs only — the exact numbers stay with your performance staff.
      </p>
    </div>
  );
}

function groupRows(rows: Array<Record<string, unknown>>, bucket: "day" | "week" | "month") {
  const keyOf = (date: string) => {
    if (bucket === "day") return date.slice(5);
    if (bucket === "month") return date.slice(0, 7);
    const d = new Date(date);
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
    return monday.toISOString().slice(5, 10);
  };
  const map = new Map<string, { date: string; distance: number; hsr: number; sprint: number; accel: number; decel: number; load: number }>();
  for (const r of rows) {
    const key = keyOf(String(r["date"]));
    const cur =
      map.get(key) ?? { date: key, distance: 0, hsr: 0, sprint: 0, accel: 0, decel: 0, load: 0 };
    cur.distance += num(r["distance"]);
    cur.hsr += num(r["hsr"]);
    cur.sprint += num(r["sprint"]);
    cur.accel += num(r["accel"]);
    cur.decel += num(r["decel"]);
    cur.load += num(r["rpe"]) * num(r["minutes"]);
    map.set(key, cur);
  }
  return [...map.values()];
}

function TestsPanel({ payload }: { payload: PortalPayload }) {
  const tests = payload.tests
    .map((t) => ({
      date: String(t["date"] ?? ""),
      name: String(t["testName"] ?? t["testId"] ?? "Test"),
      value: num(t["value"]),
    }))
    .filter((t) => t.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const names = [...new Set(tests.map((t) => t.name))];

  return (
    <section className="panel p-4">
      <p className="text-sm font-semibold">My fitness tests</p>
      <p className="mb-2 text-xs text-muted-foreground">How your results moved over the season</p>
      {names.length ? (
        <div className="space-y-4">
          {names.map((name) => (
            <div key={name}>
              <p className="eyebrow mb-1">{name}</p>
              <TrendArea
                data={tests.filter((t) => t.name === name).map((t) => ({ date: t.date.slice(5), value: t.value }))}
                dataKey="value"
                height={140}
                hideAxisValues
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </section>
  );
}

function ChartPanel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="panel p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Nothing recorded in this period yet.</p>;
}
