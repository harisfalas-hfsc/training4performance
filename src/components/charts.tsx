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
} from "recharts";

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
