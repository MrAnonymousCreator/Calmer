import { useMemo } from "react";

type Props = {
  data: number[];
  positive: boolean;
};

export function PriceChart({ data, positive }: Props) {
  const { path, area, min, max, w, h } = useMemo(() => {
    const w = 1000;
    const h = 320;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 20) - 10] as const);
    const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
    const area = `${path} L${w},${h} L0,${h} Z`;
    return { path, area, min, max, w, h };
  }, [data]);

  const color = positive ? "var(--color-positive)" : "var(--color-negative)";
  const soft = positive ? "var(--color-positive-soft)" : "var(--color-negative-soft)";
  const id = positive ? "grad-pos" : "grad-neg";

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[320px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={soft} stopOpacity="0.9" />
            <stop offset="100%" stopColor={soft} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f}
            stroke="var(--color-border)" strokeDasharray="4 6" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.25"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1 tabular-nums">
        <span>Low {min.toFixed(2)}</span>
        <span>High {max.toFixed(2)}</span>
      </div>
    </div>
  );
}
