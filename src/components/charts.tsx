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
}: {
  data: Row[];
  dataKey: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" {...axis} />
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
}: {
  data: Row[];
  series: Array<{ key: string; color: string; name: string }>;
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} {...axis} />
        <YAxis {...axis} width={46} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
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
