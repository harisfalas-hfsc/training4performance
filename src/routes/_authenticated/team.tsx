import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPen,
  Circle,
  Download,
  FileSpreadsheet,
  Radar,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { Button } from "@/components/ui/button";
import {
  MAX_PLAYERS_PER_SQUAD,
  MAX_TEAMS_PER_ACCOUNT,
  clearWorkspaceRecords,
  deleteTeamAndData,
  gpsHistory,
  isTeamConfigured,
  players,
  saveTeam,
  sessionCalendar,
  team,
  useDataVersion,
} from "@/data/performance";
import { testRecords, useTestVersion } from "@/data/testing";
import { downloadSheetXlsx, downloadWorkspaceZip, workspaceSheets } from "@/lib/workspace-export";
import { clearRemoteWorkspace } from "@/lib/usage";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team & Data — T4P Training 4 Performance" },
      {
        name: "description",
        content:
          "Create your team, follow the setup steps, see your squad limits, export every record as a ZIP or delete the team and start again.",
      },
      { property: "og:title", content: "Team & Data — T4P" },
      { property: "og:description", content: "One workspace, one team: setup, limits, full data export and deletion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  useDataVersion();
  useTestVersion();
  const { user } = useAuth();
  const navigate = useNavigate();
  const configured = isTeamConfigured();

  const [form, setForm] = useState({
    club: team.club === "Your club" ? "" : team.club,
    name: team.name,
    season: team.season,
    competition: team.competition,
    ageGroup: team.ageGroup,
    gender: team.gender,
    headCoach: team.headCoach,
    fitnessCoach: team.fitnessCoach,
  });
  const [confirm, setConfirm] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.club.trim() || !form.name.trim()) {
      toast.error("Club and team name are required");
      return;
    }
    if (saveTeam(form)) toast.success(configured ? "Team updated" : "Team created — now build your squad");
  };

  const steps = [
    {
      label: "1. Create the team",
      done: configured,
      hint: "Club, team name, season and competition — the form on this page.",
      to: null,
    },
    {
      label: "2. Build the squad",
      done: players.length > 0,
      hint: `Add your players one by one (up to ${MAX_PLAYERS_PER_SQUAD}).`,
      to: "/squad" as const,
      icon: Users,
    },
    {
      label: "3. Import GPS data",
      done: gpsHistory.length > 0,
      hint: "Upload your own provider export and map the columns once.",
      to: "/gps" as const,
      icon: Radar,
    },
    {
      label: "4. Design & schedule training",
      done: sessionCalendar.length > 0,
      hint: "Build blocks, schedule the session, mark it completed, attach the GPS file.",
      to: "/training" as const,
      icon: ClipboardPen,
    },
    {
      label: "5. Record fitness tests",
      done: testRecords.length > 0,
      hint: "Anthropometrics, FMS, jumps, speed and Yo-Yo results per player.",
      to: "/logbook" as const,
      icon: CheckCircle2,
    },
  ];

  return (
    <AppShell title="Team & data" subtitle="Create your team, follow the setup, export or delete everything">
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-surface p-4">
          <SectionTitle title="Getting started" hint="Five steps from an empty account to a running season" />
          <ol className="mt-3 space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-2 p-3">
                {s.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.hint}</p>
                </div>
                {s.to ? (
                  <Link
                    to={s.to}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-secondary"
                  >
                    Open <ArrowRight className="size-3" />
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <SectionTitle
            title={configured ? "Your team" : "Create your team"}
            hint={`One account holds ${MAX_TEAMS_PER_ACCOUNT} team. A second team needs a second account and subscription.`}
          />
          <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Club *">
              <input className="inp" value={form.club} onChange={set("club")} placeholder="e.g. Salamina FC" />
            </Field>
            <Field label="Team *">
              <input className="inp" value={form.name} onChange={set("name")} placeholder="e.g. First Team" />
            </Field>
            <Field label="Season">
              <input className="inp" value={form.season} onChange={set("season")} placeholder="2025/26" />
            </Field>
            <Field label="Competition">
              <input className="inp" value={form.competition} onChange={set("competition")} placeholder="Cyprus League" />
            </Field>
            <Field label="Age group">
              <select className="inp" value={form.ageGroup} onChange={set("ageGroup")}>
                {["Senior", "U21", "U19", "U17", "U15", "Academy"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Gender">
              <select className="inp" value={form.gender} onChange={set("gender")}>
                {["Male", "Female", "Mixed"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Head coach">
              <input className="inp" value={form.headCoach} onChange={set("headCoach")} />
            </Field>
            <Field label="Fitness / S&C coach">
              <input className="inp" value={form.fitnessCoach} onChange={set("fitnessCoach")} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" className="gap-2">
                <Save className="size-4" /> {configured ? "Save team" : "Create team"}
              </Button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <SectionTitle title="Limits" hint="What one subscription covers" />
            <ul className="mt-3 space-y-2 text-sm">
              <Limit label="Teams per account" value={`${MAX_TEAMS_PER_ACCOUNT}`} note="One team per subscription." />
              <Limit label="Squads per team" value="1" note="The squad of that team." />
              <Limit
                label="Players in the squad"
                value={`${players.length} / ${MAX_PLAYERS_PER_SQUAD}`}
                note="Remove a player to free a slot."
              />
              <Limit label="Sessions, GPS rows, tests" value="Unlimited" note="For the whole season." />
            </ul>
            <p className="mt-3 flex gap-2 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
              <Shield className="size-4 shrink-0 text-sky-600" />
              Running a second team (e.g. U19 as well as the first team) means a second account with its own
              subscription — data of two teams is never mixed inside one workspace.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <SectionTitle title="Export your data" hint="Your records are your property — download them anytime" />
            <p className="mt-2 text-sm text-muted-foreground">
              Download any dataset as its own Excel file, or take everything at once: a ZIP with{" "}
              <strong>workspace.json</strong> (complete backup), one Excel per dataset and the same data as CSV. Works
              even if you stop your subscription.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {workspaceSheets().map((sheet) => (
                <button
                  key={sheet.key}
                  type="button"
                  onClick={() => {
                    downloadSheetXlsx(sheet.key);
                    toast.success(`${sheet.label} exported`, { description: `${sheet.rows.length} rows — Excel file downloading.` });
                  }}
                  className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary/50"
                >
                  <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>
                    <span className="block text-sm font-semibold">{sheet.label}</span>
                    <span className="block text-xs text-muted-foreground">{sheet.description}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{sheet.rows.length} rows · .xlsx</span>
                  </span>
                </button>
              ))}
            </div>
            <Button
              className="mt-3 gap-2"
              onClick={() => {
                downloadWorkspaceZip();
                toast.success("Export ready", { description: "Your ZIP is downloading." });
              }}
            >
              <Download className="size-4" /> Download everything (.zip)
            </Button>
          </div>

        </section>

        <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <SectionTitle title="Danger zone" hint="These actions cannot be undone — export first" />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm font-semibold">Delete all records, keep the team</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Removes players, GPS, sessions, tests and medical events. The team details stay.
              </p>
              <Button
                variant="outline"
                className="mt-3 gap-2"
                onClick={() => {
                  if (!window.confirm("Delete every record of this team? This cannot be undone.")) return;
                  if (clearWorkspaceRecords()) {
                    if (user?.id) void clearRemoteWorkspace(user.id);
                    toast.success("All records deleted");
                  }
                }}
              >
                <Trash2 className="size-4" /> Delete records
              </Button>
            </div>

            <div className="rounded-lg border border-destructive/50 bg-surface p-3">
              <p className="text-sm font-semibold text-destructive">Delete the team and start a new one</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Wipes the team and everything inside it, then lets you create a new team in this same account. Type
                <strong> DELETE </strong> to confirm.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="inp max-w-[140px]"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="DELETE"
                />
                <Button
                  variant="destructive"
                  className="gap-2"
                  disabled={confirm !== "DELETE"}
                  onClick={() => {
                    if (deleteTeamAndData()) {
                      if (user?.id) void clearRemoteWorkspace(user.id);
                      setForm({
                        club: "",
                        name: "",
                        season: "",
                        competition: "",
                        ageGroup: "Senior",
                        gender: "Male",
                        headCoach: "",
                        fitnessCoach: "",
                      });
                      setConfirm("");
                      toast.success("Team deleted — create your new team above");
                      void navigate({ to: "/team" });
                    }
                  }}
                >
                  <AlertTriangle className="size-4" /> Delete team
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Limit({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-surface-2 p-2">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{note}</span>
      </span>
      <span className="shrink-0 text-sm font-bold tabular-nums">{value}</span>
    </li>
  );
}
