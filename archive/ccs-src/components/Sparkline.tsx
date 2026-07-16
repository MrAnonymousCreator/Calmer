type Props = {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
  className?: string;
};

export function Sparkline({ data, positive, width = 80, height = 28, className }: Props) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(" ");
  const stroke = positive ? "var(--color-positive)" : "var(--color-negative)";
  return (
    <svg width={width} height={height} className={className}>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
