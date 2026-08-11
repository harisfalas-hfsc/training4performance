import { useRef, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { ACWR_BANDS, AcwrLegend } from "@/components/perf-ui";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "12px",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

type Row = Record<string, string | number>;

export function TrendArea({
  data,
  dataKey,
  color = "var(--color-chart-1)",
  height = 200,
}: {
  data: Row[];
  dataKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" {...axis} />
        <YAxis {...axis} width={46} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendBars({
  data,
  dataKey,
  color = "var(--color-chart-2)",
  height = 200,
  xKey = "date",
}: {
  data: Row[];
  dataKey: string;
  color?: string;
  height?: number;
  xKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} width={46} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}


export function MultiLine({
  data,
  series,
  xKey = "date",
  height = 220,
  dualAxis = true,
}: {
  data: Row[];
  series: Array<{ key: string; color: string; name: string }>;
  xKey?: string;
  height?: number;
  dualAxis?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis yAxisId="left" {...axis} width={46} />
        {dualAxis ? <YAxis yAxisId="right" orientation="right" {...axis} width={46} /> : null}
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            yAxisId={dualAxis && i > 0 ? "right" : "left"}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * ACWR over time with the injury-risk colour bands behind the line
 * (Science for Sport: <0.80 under-training, 0.80-1.30 sweet spot,
 * 1.30-1.50 caution, >1.50 danger zone).
 */
export function AcwrChart({
  data,
  height = 240,
  xKey = "date",
  dataKey = "acwr",
  legend = true,
}: {
  data: Row[];
  height?: number;
  xKey?: string;
  dataKey?: string;
  legend?: boolean;
}) {
  const max = Math.max(1.8, ...data.map((d) => Number(d[dataKey] ?? 0) + 0.2));
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          {ACWR_BANDS.map((band) => (
            <ReferenceArea
              key={band.id}
              y1={band.from}
              y2={band.id === "danger" ? max : band.to}
              fill={band.color}
              fillOpacity={0.12}
              stroke="none"
              ifOverflow="hidden"
            />
          ))}
          <ReferenceLine y={0.8} stroke="var(--color-border)" strokeDasharray="4 4" />
          <ReferenceLine y={1.3} stroke="var(--color-border)" strokeDasharray="4 4" />
          <ReferenceLine y={1.5} stroke="var(--color-border)" strokeDasharray="4 4" />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} width={46} domain={[0, max]} />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey={dataKey} name="ACWR" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {legend ? <AcwrLegend className="mt-2" /> : null}
    </div>
  );
}

export function HBar({
  data,
  dataKey,
  labelKey,
  color = "var(--color-chart-1)",
  height = 420,
}: {
  data: Row[];
  dataKey: string;
  labelKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" {...axis} />
        <YAxis type="category" dataKey={labelKey} {...axis} width={120} />
        <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-secondary)", opacity: 0.4 }} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Configurable multi-series chart — pick the KPIs and the chart style  */
/* ------------------------------------------------------------------ */

export type ChartKind = "line" | "bar" | "stacked" | "area" | "pie" | "radar";

export const CHART_KINDS: Array<{ id: ChartKind; label: string }> = [
  { id: "line", label: "Lines" },
  { id: "bar", label: "Bars" },
  { id: "stacked", label: "Stacked" },
  { id: "area", label: "Area" },
  { id: "pie", label: "Pie" },
  { id: "radar", label: "Radar" },
];

export const SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-primary)",
];

export function MultiChart({
  data,
  series,
  kind = "line",
  xKey = "date",
  height = 260,
  dualAxis = false,
}: {
  data: Row[];
  series: Array<{ key: string; name: string; color?: string }>;
  kind?: ChartKind;
  xKey?: string;
  height?: number;
  dualAxis?: boolean;
}) {
  const colored = series.map((s, i) => ({ ...s, color: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }));
  if (!colored.length || !data.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Select at least one KPI to draw the chart.</p>;
  }

  if (kind === "pie") {
    const first = colored[0]!;
    const rows = data.map((d, i) => ({
      name: String(d[xKey] ?? i),
      value: Number(d[first.key] ?? 0),
    }));
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie data={rows} dataKey="value" nameKey="name" outerRadius={height / 3} label={false}>
            {rows.map((_, i) => (
              <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "radar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis dataKey={xKey} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {colored.map((s) => (
            <Radar key={s.key} dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.25} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} width={46} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {colored.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.18}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "bar" || kind === "stacked") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} width={46} />
          <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-secondary)", opacity: 0.35 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {colored.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              {...(kind === "stacked" ? { stackId: "a" } : {})}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis yAxisId="left" {...axis} width={46} />
        {dualAxis ? <YAxis yAxisId="right" orientation="right" {...axis} width={46} /> : null}
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {colored.map((s, i) => (
          <Line
            key={s.key}
            yAxisId={dualAxis && i > 0 ? "right" : "left"}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Chart frame — export any chart as PNG or PDF                        */
/* ------------------------------------------------------------------ */

function inlineStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const src = source.querySelectorAll<SVGElement>("*");
  const dst = clone.querySelectorAll<SVGElement>("*");
  const props = ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "font-size", "font-family", "font-weight"];
  for (let i = 0; i < src.length; i++) {
    const s = src[i];
    const d = dst[i];
    if (!s || !d) continue;
    const cs = window.getComputedStyle(s);
    for (const p of props) {
      const v = cs.getPropertyValue(p);
      if (v && v !== "none" && v !== "normal") d.setAttribute(p, v);
    }
  }
}

async function chartToPng(container: HTMLElement, scale = 2): Promise<string | null> {
  const svg = container.querySelector("svg");
  if (!svg) return null;
  const source = svg as SVGSVGElement;
  const rect = source.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const clone = source.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  inlineStyles(source, clone);

  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("render failed"));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/** Wraps a chart and adds PNG / PDF export buttons. */
export function ChartFrame({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const file = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chart";

  async function exportPng() {
    if (!ref.current) return;
    const data = await chartToPng(ref.current);
    if (!data) return;
    const a = document.createElement("a");
    a.href = data;
    a.download = `${file}.png`;
    a.click();
  }

  async function exportPdf() {
    if (!ref.current) return;
    const data = await chartToPng(ref.current, 2);
    if (!data) return;
    const w = window.open("", "_blank", "width=1000,height=700");
    if (!w) return;
    w.document.write(
      `<!doctype html><title>${title}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:system-ui,sans-serif;margin:0}h1{font-size:16px;margin:0 0 8px}img{width:100%}</style><h1>${title}</h1><img src="${data}" onload="window.focus();window.print()">`,
    );
    w.document.close();
  }

  return (
    <div className={className}>
      <div ref={ref}>{children}</div>
      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
        <button
          type="button"
          onClick={exportPng}
          className="rounded-md border border-border px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground hover:text-foreground"
        >
          Export PNG
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="rounded-md border border-border px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground hover:text-foreground"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
