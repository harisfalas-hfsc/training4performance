import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Sigma } from "lucide-react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/perf-ui";
import {
  activeLoadKpis,
  estimateLoadRows,
  getLoadModel,
  importedLoadColumns,
  kpiMean,
  loadFormulaText,
  loadKpiOptions,
  resetLoadModel,
  setLoadModel,
  subscribeLoadModel,
  type LoadMethod,
  type LoadModel,
} from "@/data/load-model";
import { fullName, gpsHistory, players, useDataVersion } from "@/data/performance";
import { T4P } from "@/components/brand-text";

/** Re-render whenever the stored load model changes. */
export function useLoadModel(): LoadModel {
  const [model, setModel] = useState<LoadModel>(() => getLoadModel());
  useEffect(() => subscribeLoadModel(() => setModel({ ...getLoadModel() })), []);
  return model;
}

const GROUPS = ["Aerobic", "Anaerobic", "Power", "Perceived", "Your export"] as const;

/**
 * Lets the coach decide which KPIs of his own GPS export build the training load
 * when the file itself has no load column.
 */
export function LoadModelCard({ compact = false }: { compact?: boolean }) {
  useDataVersion();
  const model = useLoadModel();
  const options = useMemo(() => loadKpiOptions(), [gpsHistory.length]);
  const existing = importedLoadColumns();

  const setWeight = (key: string, weight: number) =>
    setLoadModel({ weights: { ...model.weights, [key]: weight }, configured: true });

  const setMethod = (method: LoadMethod) => setLoadModel({ method, configured: true });

  const preview = useMemo(() => {
    const last = [...new Set(gpsHistory.map((r) => r.date))].sort().at(-1);
    if (!last) return [];
    return estimateLoadRows(gpsHistory.filter((r) => r.date === last), model)
      .sort((a, b) => b.load - a.load)
      .slice(0, 5)
      .map(({ row, load }) => ({
        name: fullName(players.find((p) => p.id === row.playerId) ?? { firstName: "", lastName: row.playerId }) || row.playerId,
        date: row.date,
        load,
      }));
  }, [model, gpsHistory.length]);

  return (
    <section className="panel p-4">
      <SectionTitle
        title="Training load model"
        hint={<>Your GPS file has no load column? <T4P /> calculates it from the KPIs you choose here</>}
      />

      {existing.length > 0 && (
        <p className="mb-3 rounded-md border border-border bg-surface-2 p-2.5 text-xs text-muted-foreground">
          Your export already contains {existing.map((e) => e.label).join(", ")}. You can keep using it as a KPI, and still
          calculate the <T4P /> load next to it for comparison.
        </p>
      )}

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {([
          ["ratio", "Squad-ratio composite (recommended)", "Every KPI is divided by the squad average of that KPI, weighted and scaled to 100 AU. Same method as the Salamina training monitor workbook."],
          ["srpe", "Session RPE (Foster)", "Load = RPE (0-10) x duration in minutes. Needs an RPE value for the session."],
        ] as const).map(([id, label, desc]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className={
              "rounded-md border p-3 text-left text-sm transition-colors " +
              (model.method === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")
            }
          >
            <span className="font-semibold">{label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
          </button>
        ))}
      </div>

      {model.method === "ratio" && !compact && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              KPIs used for the load (weight 0 = not used)
            </p>
            <div className="space-y-3">
              {GROUPS.map((group) => {
                const items = options.filter((o) => o.group === group);
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <p className="text-xs font-semibold text-foreground">{group}</p>
                    {items.map((o) => {
                      const w = model.weights[o.key] ?? 0;
                      const mean = kpiMean(o.key);
                      return (
                        <div key={o.key} className="flex items-center gap-3 py-1">
                          <label className="flex-1 text-sm" htmlFor={`w-${o.key}`}>
                            {o.label}
                            <span className="ml-1 text-xs text-muted-foreground">
                              {o.unit ? `(${o.unit})` : ""} {mean ? `· squad avg ${Math.round(mean).toLocaleString()}` : "· no data yet"}
                            </span>
                          </label>
                          <input
                            id={`w-${o.key}`}
                            type="range"
                            min={0}
                            max={3}
                            step={0.25}
                            value={w}
                            onChange={(e) => setWeight(o.key, Number(e.target.value))}
                            className="w-32 accent-[var(--color-primary)]"
                          />
                          <span className="metric-value w-10 text-right text-sm tabular-nums text-primary">{w.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                resetLoadModel();
                toast.success("Load model reset to the recommended KPIs and weights");
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary/50"
            >
              <RotateCcw className="size-3.5" /> Back to recommended weights
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sigma className="size-3.5" /> Your formula right now
              </p>
              <p className="mt-2 break-words text-sm leading-relaxed">{loadFormulaText(model)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {activeLoadKpis(model).length} KPI(s) selected. 100 AU = an average session for an average player in your
                own squad, so the number is always relative to your team, not to another club.
              </p>
            </div>
            {preview.length > 0 && (
              <div className="rounded-md border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preview — highest load on {preview[0]!.date}
                </p>
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {preview.map((p) => (
                      <tr key={p.name} className="border-b border-border/60 last:border-0">
                        <td className="py-1">{p.name}</td>
                        <td className="py-1 text-right font-semibold tabular-nums text-primary">{p.load} AU</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {model.method === "srpe" && (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm">
          {loadFormulaText(model)} — the RPE comes from the session record or from the RPE column of your file.
        </p>
      )}
    </section>
  );
}
