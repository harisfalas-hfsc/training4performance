import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { CheckCircle2, FileWarning, HelpCircle, Radar, Upload, XCircle } from "lucide-react";
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
import { ACCEPTED_EXTENSIONS, detectProvider, isAcceptedFile } from "@/data/gps-upload";
import { useRole } from "@/lib/roles";

export const Route = createFileRoute("/gps")({
  head: () => ({
    meta: [
      { title: "GPS Upload, Provider Detection & Matching — T4P" },
      {
        name: "description",
        content:
          "Upload Excel or CSV GPS files with automatic provider detection, live upload progress and a clear mapping report for unmatched player names.",
      },
      { property: "og:title", content: "GPS Upload & Provider Detection — T4P" },
      { property: "og:description", content: "Automatic name matching with a mapping report — never a duplicate player." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GpsPage,
});

type Detection = ReturnType<typeof detectProvider>;

function GpsPage() {
  const { can } = useRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>(() => buildImportRows());
  const [imported, setImported] = useState(false);
  const [fileName, setFileName] = useState("catapult_export_md2.csv");
  const [detection, setDetection] = useState<Detection>(() => detectProvider("catapult_export_md2.csv"));
  const [progress, setProgress] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const matched = rows.filter((r) => r.matchedId && r.confidence >= 0.95).length;
  const needsConfirm = rows.filter((r) => r.matchedId && r.confidence < 0.95).length;
  const unmatched = rows.filter((r) => !r.matchedId).length;

  const startUpload = (name: string) => {
    if (!isAcceptedFile(name)) {
      setFileError(`Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return;
    }
    setFileError(null);
    setFileName(name);
    setImported(false);
    setUploading(true);
    setProgress(0);
    setRows(buildImportRows());
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 7 + Math.round(Math.random() * 11));
        if (next >= 100) {
          clearInterval(timer);
          setUploading(false);
          setDetection(detectProvider(name));
        }
        return next;
      });
    }, 120);
  };

  const confirm = (i: number, accept: boolean) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? (accept ? { ...r, confidence: 1 } : { ...r, matchedId: null, confidence: 0 }) : r)),
    );

  const assign = (i: number, playerId: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, matchedId: playerId || null, confidence: playerId ? 1 : 0 } : r)));

  const mappingIssues = rows
    .map((r, i) => ({ ...r, index: i }))
    .filter((r) => !r.matchedId || r.confidence < 0.95);

  return (
    <AppShell
      title="GPS Import"
      subtitle={`Session ${today} · MD-2 · file: ${fileName}`}
      actions={
        <button
          onClick={() => setImported(true)}
          disabled={needsConfirm > 0 || uploading || !can("importGps")}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Upload className="size-4" /> Import {matched} rows
        </button>
      }
    >
      <section className="panel p-4">
        <SectionTitle title="Upload GPS file" hint="Excel or CSV export from your provider — the provider is detected automatically" />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) startUpload(f.name);
          }}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-2 px-4 py-8 text-center"
        >
          <Upload className="size-6 text-primary" />
          <p className="mt-2 text-sm font-semibold">Drop a GPS export here or click to browse</p>
          <p className="text-xs text-muted-foreground">Supported: {ACCEPTED_EXTENSIONS.join(" · ")} — Catapult, STATSports, GPEXE, Polar</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) startUpload(f.name);
            }}
          />
        </div>

        {fileError && (
          <p className="mt-3 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
            <FileWarning className="size-4" /> {fileError}
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{uploading ? "Uploading and parsing…" : "Upload complete"}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="eyebrow flex items-center gap-2">
              <Radar className="size-3.5" /> Provider detection
            </p>
            {detection.provider === "Unknown" ? (
              <p className="mt-1 text-sm text-warning">
                Provider not recognised from the file name — metrics will need manual mapping before import.
              </p>
            ) : (
              <p className="mt-1 text-sm">
                <span className="font-semibold text-primary">{detection.provider}</span>{" "}
                <span className="text-muted-foreground">
                  · confidence {(detection.confidence * 100).toFixed(0)}% · delimiter “{detection.signature?.delimiter}” ·{" "}
                  {detection.mappedFields.length} fields mapped
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Rows in file" value={rows.length} />
        <MetricCard label="Matched" value={matched} tone="good" />
        <MetricCard label="Needs confirmation" value={needsConfirm} tone={needsConfirm ? "warn" : "good"} />
        <MetricCard label="Unmatched" value={unmatched} tone={unmatched ? "bad" : "good"} hint="No duplicate player is ever created" />
      </section>

      {imported && (
        <div className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
          Import complete. Player load, weekly load, acute/chronic load, alerts and squad analytics were updated automatically.
        </div>
      )}

      {mappingIssues.length > 0 && (
        <section className="mt-6 panel border-warning/40 p-4">
          <SectionTitle
            title="Mapping report"
            hint={`${unmatched} name(s) could not be matched, ${needsConfirm} need confirmation — resolve before import`}
          />
          <ul className="space-y-1.5 text-sm">
            {mappingIssues.map((r) => (
              <li key={r.raw} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2.5">
                <span className="font-mono text-xs">{r.raw}</span>
                <span className="text-xs text-muted-foreground">
                  {r.matchedId
                    ? `Probable match: ${fullName(getPlayer(r.matchedId)!)} (${Math.round(r.confidence * 100)}% confidence) — confirm below`
                    : "No candidate above the matching threshold — assign manually below"}
                </span>
              </li>
            ))}
          </ul>
        </section>
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
          {detection.mappedFields.length > 0 && (
            <ul className="mb-3 space-y-1.5 text-sm">
              {detection.mappedFields.map((f) => (
                <li key={f.raw} className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 p-2">
                  <span className="truncate">{f.raw}</span>
                  <span className="font-mono text-xs text-primary">{f.internal}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="eyebrow mb-1">All supported provider fields</p>
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
        </div>
      </section>
    </AppShell>
  );
}
