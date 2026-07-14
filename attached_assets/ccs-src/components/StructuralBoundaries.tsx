import type { AssetAnalysis } from "@/lib/analysis";
import { formatPrice } from "@/lib/market-data";

function Level({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-xl tabular-nums text-foreground">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function StructuralBoundaries({ analysis }: { analysis: AssetAnalysis }) {
  const { boundaries: b, candles } = analysis;
  const cur = candles[candles.length - 1].c;
  const em = b.expectedMove;
  const emSpread = ((em.high - em.low) / cur) * 100;
  const distToRes = ((b.resistance - cur) / cur) * 100;
  const distToSup = ((cur - b.support) / cur) * 100;

  return (
    <section className="rounded-3xl bg-surface p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Structural boundaries
          </div>
          <h3 className="font-display text-lg mt-2 text-foreground">
            Objective levels derived from the last 14 daily closes
          </h3>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
          USD
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Level
          label="Support (7d)"
          value={`$${formatPrice(b.support)}`}
          hint={`${distToSup.toFixed(1)}% below spot`}
        />
        <Level
          label="Resistance (7d)"
          value={`$${formatPrice(b.resistance)}`}
          hint={`${distToRes.toFixed(1)}% above spot`}
        />
        <Level label="20-day avg" value={`$${formatPrice(b.sma20)}`} />
        <Level
          label={b.sma50 ? "50-day avg" : "ATR (7d)"}
          value={b.sma50 ? `$${formatPrice(b.sma50)}` : `$${formatPrice(b.atr)}`}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/70 bg-muted/40 p-5">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              Expected move · next {em.horizonDays} sessions
            </div>
            <div className="mt-2 font-mono text-lg tabular-nums text-foreground">
              ${formatPrice(em.low)}
              <span className="text-muted-foreground mx-2">→</span>
              ${formatPrice(em.high)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Volatility pocket</div>
            <div className="mt-1 text-sm tabular-nums text-foreground/80">±{(emSpread / 2).toFixed(2)}%</div>
          </div>
        </div>

        <div className="relative mt-5 h-2 w-full rounded-full bg-surface overflow-hidden">
          <div
            className="absolute top-0 h-full bg-accent/60"
            style={{
              left: `${Math.max(0, Math.min(100, ((em.low - b.support) / (b.resistance - b.support)) * 100))}%`,
              width: `${Math.max(4, Math.min(100, ((em.high - em.low) / (b.resistance - b.support)) * 100))}%`,
            }}
          />
          <div
            className="absolute top-[-3px] h-3 w-[2px] bg-foreground"
            style={{
              left: `${Math.max(0, Math.min(100, ((cur - b.support) / (b.resistance - b.support)) * 100))}%`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>Support</span>
          <span>Spot ${formatPrice(cur)}</span>
          <span>Resistance</span>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          {em.method}. Range represents where price is statistically likely to trade — not a target.
        </p>
      </div>
    </section>
  );
}
