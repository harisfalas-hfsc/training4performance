/**
 * GPS training-load bridge.
 *
 * Wires the persisted load model (src/data/load-model.ts) into the performance
 * data layer (src/data/performance.ts) via `registerGpsLoadProvider`, so the
 * coach's chosen formula + KPI weights becomes the single source of truth for
 * every load number in the platform — GPS reports, analytics, the player
 * profile, the dashboard and the report engine.
 *
 * The squad reference (mean of each KPI) is computed once and cached; the cache
 * key combines the model signature and the GPS row count, so it rebuilds both
 * when the coach edits the model and when new GPS days are imported.
 *
 * Imported as a side effect from src/routes/__root.tsx.
 */
import {
  estimateLoad,
  getLoadModel,
  kpiMeans,
  activeLoadKpis,
  subscribeLoadModel,
} from "@/data/load-model";
import {
  gpsHistory,
  notifyDataChange,
  registerGpsLoadProvider,
  type GpsDay,
} from "@/data/performance";

let cachedSig = "";
let cachedMeans: Record<string, number> = {};

/** Squad reference for the active KPIs, cached by model + dataset size. */
function meansFor(): Record<string, number> {
  const m = getLoadModel();
  const sig = `${m.method}|${JSON.stringify(m.weights)}|${gpsHistory.length}`;
  if (sig !== cachedSig) {
    cachedSig = sig;
    cachedMeans = kpiMeans(activeLoadKpis(m).map((k) => k.key));
  }
  return cachedMeans;
}

/** Per-row training load using the configured model (ratio or s-RPE). */
function rowLoad(row: GpsDay): number {
  return estimateLoad(row, getLoadModel(), meansFor());
}

registerGpsLoadProvider(rowLoad);

/**
 * Push model edits out to every performance subscriber (charts, tables) without
 * looping back into the load model. `notifyDataChange` re-emits performance; we
 * guard against re-entrancy in case a subscriber reads the model synchronously.
 */
let notifying = false;
if (typeof window !== "undefined") {
  subscribeLoadModel(() => {
    if (notifying) return;
    notifying = true;
    try {
      notifyDataChange();
    } finally {
      notifying = false;
    }
  });
}
