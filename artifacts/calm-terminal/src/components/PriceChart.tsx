import { useMemo } from "react";

type ChartPoint = { t: number; p: number };

type Props = {
  points: ChartPoint[];
  positive: boolean;
  range: string;
  fallbackData?: number[];
};

const W = 1000;
const H = 320;
const PAD_TOP = 16;
const PAD_BOT = 36;
const PLOT_H = H - PAD_TOP - PAD_BOT;

const RANGE_FORMAT: Record<string, (d: Date) => string> = {
  "1H": (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  "1D": (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  "1W": (d) => d.toLocaleDateString([], { weekday: "short" }),
  "1M": (d) => d.toLocaleDateString([], { month: "short", day: "numeric" }),
  "1Y": (d) => d.toLocaleDateString([], { month: "short", year: "2-digit" }),
  ALL: (d) => d.toLocaleDateString([], { month: "short", year: "2-digit" }),
};

function smoothPoints(pts: readonly [number, number][]): [number, number][] {
  if (pts.length < 4) return pts as [number, number][];
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    if (i === 0 || i === pts.length - 1) {
      out.push(pts[i]);
      continue;
    }
    const prev = pts[i - 1][1];
    const cur = pts[i][1];
    const next = pts[i + 1][1];
    out.push([pts[i][0], prev * 0.2 + cur * 0.6 + next * 0.2]);
  }
  return out;
}

function formatPrice(v: number): string {
  if (v >= 1000) return v.toLocaleString([], { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
}

export function PriceChart({ points, positive, range, fallbackData }: Props) {
  const { path, area, gridLines, xLabels, min, max, hasData } = useMemo(() => {
    const fmt = RANGE_FORMAT[range] ?? RANGE_FORMAT["1M"];

    let ts: number[];
    let vals: number[];

    if (points.length > 0) {
      ts = points.map((p) => p.t);
      vals = points.map((p) => p.p);
    } else if (fallbackData && fallbackData.length > 0) {
      const now = Date.now();
      const span = 7 * 86_400_000;
      const step = span / (fallbackData.length - 1);
      ts = fallbackData.map((_, i) => now - span + i * step);
      vals = fallbackData;
    } else {
      return {
        path: "",
        area: "",
        gridLines: [],
        xLabels: [],
        min: 0,
        max: 0,
        hasData: false,
      };
    }

    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const vr = hi - lo || 1;
    const stepX = W / Math.max(ts.length - 1, 1);

    const raw = vals.map((v, i) => [i * stepX, PAD_TOP + PLOT_H - ((v - lo) / vr) * PLOT_H] as [number, number]);
    const smoothed = smoothPoints(raw);

    const path = smoothed
      .map((p, i) => (i === 0 ? `M${p[0].toFixed(2)},${p[1].toFixed(2)}` : `L${p[0].toFixed(2)},${p[1].toFixed(2)}`))
      .join(" ");
    const area = `${path} L${W},${PAD_TOP + PLOT_H} L0,${PAD_TOP + PLOT_H} Z`;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => PAD_TOP + PLOT_H * f);

    const labelCount = Math.min(6, ts.length);
    const xLabels: { x: number; label: string }[] = [];
    for (let i = 0; i < labelCount; i++) {
      const idx = labelCount === 1 ? 0 : Math.round((i / (labelCount - 1)) * (ts.length - 1));
      xLabels.push({ x: idx * stepX, label: fmt(new Date(ts[idx])) });
    }

    return { path, area, gridLines, xLabels, min: lo, max: hi, hasData: true };
  }, [points, range, fallbackData]);

  const color = positive ? "var(--color-positive)" : "var(--color-negative)";
  const soft = positive ? "var(--color-positive-soft)" : "var(--color-negative-soft)";
  const id = positive ? "grad-pos" : "grad-neg";

  if (!hasData) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        No chart data available for this range.
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[360px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={soft} stopOpacity="0.7" />
            <stop offset="100%" stopColor={soft} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((y, i) => (
          <line
            key={i}
            x1="0"
            x2={W}
            y1={y}
            y2={y}
            stroke="var(--color-border)"
            strokeDasharray="2 8"
            strokeWidth="1"
            opacity={i === 0 || i === gridLines.length - 1 ? 0.6 : 0.35}
          />
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {xLabels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={H - 10}
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            fill="var(--color-muted-foreground)"
            fontSize="11"
            fontFamily="inherit"
          >
            {l.label}
          </text>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1 tabular-nums">
        <span>Low {formatPrice(min)}</span>
        <span>High {formatPrice(max)}</span>
      </div>
    </div>
  );
}
