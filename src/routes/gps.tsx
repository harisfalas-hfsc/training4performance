import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, HelpCircle, Upload, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import {
  buildImportRows,
  fullName,
  getPlayer,
  players,
  PROVIDER_MAP,
  today,
  type ImportRow,
} from "@/data/performance";

export const Route = createFileRoute("/gps")({
  head: () => ({
    meta: [
      { title: "GPS Import & Player Matching — Football Performance OS" },
      {
        name: "description",
        content:
          "Import Excel or CSV GPS files, match players automatically, normalise provider metrics and update workload instantly.",
      },
      { property: "og:title", content: "GPS Import & Player Matching" },
      { property: "og:description", content: "Automatic name matching with confirmation for uncertain matches — never a duplicate player." },
    ],
  }),
  component: GpsPage,
});

function GpsPage() {
  const [rows, setRows] = useState<ImportRow[]>(() => buildImportRows());
  const [imported, setImported] = useState(false);

  const matched = rows.filter((r) => r.matchedId && r.confidence >= 0.95).length;
  const needsConfirm = rows.filter((r) => r.matchedId && r.confidence < 0.95).length;
  const unmatched = rows.filter((r) => !r.matchedId).length;

  const confirm = (i: number, accept: boolean) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? (accept ? { ...r, confidence: 1 } : { ...r, matchedId: null, confidence: 0 }) : r)),
    );

  const assign = (i: number, playerId: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, matchedId: playerId || null, confidence: playerId ? 1 : 0 } : r)));

  return (
    <AppShell
      title="GPS Import"
      subtitle={`Session ${today} · MD-2 · provider file: catapult_export_md2.csv`}
      actions={
        <button
          onClick={() => setImported(true)}
          disabled={needsConfirm > 0}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Upload className="size-4" /> Import {matched} rows
        </button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Rows in file" value={rows.length} />
        <MetricCard label="Matched" value={matched} tone="good" />
        <MetricCard label="Needs confirmation" value={needsConfirm} tone={needsConfirm ? "warn" : "good"} />
        <MetricCard label="Unmatched" value={unmatched} tone={unmatched ? "bad" : "good"} hint="No duplicate player is ever created" />
      </section>

      {imported && (
        <div className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
          Import complete. Player load, weekly load, acute/chronic load and squad analytics were updated automatically.
        </div>
      )}

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle title="Player matching" hint="Uncertain matches are confirmed once, then remembered" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">File name</th>
                  <th>Match</th>
                  <th className="text-right">Distance</th>
                  <th className="text-right">HSR</th>
                  <th className="text-right">Sprint</th>
                  <th className="text-right">Max spd</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const p = r.matchedId ? getPlayer(r.matchedId) : null;
                  const certain = r.confidence >= 0.95;
                  return (
                    <tr key={r.raw} className="border-b border-border/60">
                      <td className="py-2 font-mono text-xs">{r.raw}</td>
                      <td>
                        {p && certain ? (
                          <span className="inline-flex items-center gap-1.5 text-success">
                            <CheckCircle2 className="size-4" /> {fullName(p)}
                          </span>
                        ) : p ? (
                          <span className="inline-flex items-center gap-1.5 text-warning">
                            <HelpCircle className="size-4" /> {fullName(p)}?
                          </span>
                        ) : (
                          <select
                            onChange={(e) => assign(i, e.target.value)}
                            defaultValue=""
                            className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs"
                          >
                            <option value="">Unmatched — select player</option>
                            {players.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {fullName(pl)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="text-right tabular-nums">{r.distance.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{r.hsr}</td>
                      <td className="text-right tabular-nums">{r.sprint}</td>
                      <td className="text-right tabular-nums">{r.maxSpeed}</td>
                      <td className="py-2 text-right">
                        {p && !certain ? (
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => confirm(i, true)}
                              className="rounded-md bg-success/20 px-2 py-1 text-xs font-semibold text-success"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => confirm(i, false)}
                              className="rounded-md bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive"
                            >
                              No
                            </button>
                          </span>
                        ) : !p ? (
                          <XCircle className="ml-auto size-4 text-destructive" />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle title="Metric normalisation" hint="Provider terminology mapped to internal metrics" />
          <ul className="space-y-1.5 text-sm">
            {PROVIDER_MAP.map((m) => (
              <li key={m.provider + m.raw} className="rounded-md border border-border p-2">
                <p className="text-xs text-muted-foreground">{m.provider}</p>
                <p className="flex items-center justify-between gap-2">
                  <span className="truncate">{m.raw}</span>
                  <span className="font-mono text-xs text-primary">{m.internal}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Supported input: Excel, CSV and future direct provider API integration. Imported rows attach automatically to the
            selected session, the player record and the weekly load calculation.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
