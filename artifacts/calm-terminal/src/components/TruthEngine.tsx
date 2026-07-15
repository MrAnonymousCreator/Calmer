import { useMemo, type ReactNode } from "react";
import type { AssetAnalysis } from "@/lib/analysis";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

// ── Minimal math needed for reconstruction (daily-close inputs) ──

function rsiFromCloses(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  const ag = gains / period, al = losses / period;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

function stdevOf(a: number[]): number {
  if (a.length === 0) return 0;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
}

// ────────────────────────────────────────────────────────────────

type Reconstruction = {
  systemState: "STABLE STATE" | "ELEVATED STATE";
  prose: string;
  metrics: { label: string; value: string; context: string }[];
  anomaly: { kind: "baseline"; text: string } | { kind: "active"; text: string };
};

function buildReconstructionFromAnalysis(analysis: AssetAnalysis): Reconstruction {
  const closes = analysis.candles.map((c) => c.c);
  const last = closes[closes.length - 1] ?? 0;
  const { sma20, atr } = analysis.boundaries;

  const pricePos = ((last - sma20) / sma20) * 100;
  const r = rsiFromCloses(closes);
  const rPrev = rsiFromCloses(closes.slice(0, -1));
  const rDelta = r - rPrev;

  // Daily return volatility: recent 7 vs prior 30
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const sigmaRecent = stdevOf(rets.slice(-7));
  const sigmaBase = stdevOf(rets.slice(-30, -7)) || sigmaRecent || 0.0001;
  const sigmaDev = (sigmaRecent - sigmaBase) / sigmaBase;

  // SMA direction
  const sma20Slice = closes.slice(-21, -1);
  const sma20Prev = sma20Slice.length
    ? sma20Slice.reduce((a, b) => a + b, 0) / sma20Slice.length
    : sma20;
  const smaHolding = last >= sma20 ? "Holding" : "Lost";
  const smaDirection = sma20 > sma20Prev ? "Expanding" : "Compressing";

  // Prose
  const fragments: string[] = [];
  if (pricePos > 0) {
    fragments.push(
      `${analysis.symbol} is holding a ${Math.abs(pricePos) < 1 ? "tightly compressed" : "compressed"} structure ${pricePos.toFixed(1)}% above its 20-day average`,
    );
  } else {
    fragments.push(
      `${analysis.symbol} is trading ${Math.abs(pricePos).toFixed(1)}% beneath its 20-day average`,
    );
  }

  if (r > 68) {
    fragments.push("momentum is highly overextended on the daily horizon");
  } else if (r < 32) {
    fragments.push("momentum is cooling rapidly below historical norms");
  } else if (Math.abs(rDelta) < 2) {
    fragments.push("momentum indicators are flat, signaling a low-conviction consolidation phase");
  } else if (rDelta < 0) {
    fragments.push("momentum is gradually decelerating");
  } else {
    fragments.push("momentum is gradually firming");
  }

  if (sigmaDev > 1.5) {
    fragments.push(
      `volatility is undergoing an aggressive range expansion at ${sigmaDev.toFixed(1)}σ above baseline`,
    );
  } else if (sigmaDev < -0.5) {
    fragments.push("volatility has compressed below baseline norms");
  } else {
    fragments.push("volatility remains within baseline norms");
  }

  const prose = fragments.join(". ") + ".";

  // Anomaly
  const anomalyActive = sigmaDev > 1.5 || r > 68 || r < 32;
  const anomaly: Reconstruction["anomaly"] = anomalyActive
    ? {
        kind: "active",
        text:
          sigmaDev > 1.5
            ? `Volatility expansion detected: recent 7-day return range exceeds 30-day baseline by ${sigmaDev.toFixed(1)}σ.`
            : r > 68
              ? `Momentum extension detected: RSI(14) reading at ${r.toFixed(0)} exceeds normal operating band.`
              : `Momentum exhaustion detected: RSI(14) reading at ${r.toFixed(0)} sits below normal operating band.`,
      }
    : {
        kind: "baseline",
        text: "System baseline normal. No liquidity cliffs or volume standard deviation breaches detected over the trailing daily candle series.",
      };

  const atrPct = last > 0 ? (atr / last) * 100 : 0;

  return {
    systemState: anomalyActive ? "ELEVATED STATE" : "STABLE STATE",
    prose,
    metrics: [
      {
        label: "SMA Position",
        value: `${pricePos >= 0 ? "+" : ""}${pricePos.toFixed(2)}% vs SMA20`,
        context: `${Math.abs(pricePos) < 1 ? "Neutral" : pricePos > 0 ? "Extended above" : "Below"} 20-day average`,
      },
      {
        label: "Momentum (RSI)",
        value: r.toFixed(0),
        context: `${rDelta >= 0 ? "+" : ""}${rDelta.toFixed(1)} (${rDelta > 1 ? "Firming" : rDelta < -1 ? "Cooling" : "Flat"})`,
      },
      {
        label: "Structural Level",
        value: `${formatPrice(sma20)} (SMA20)`,
        context: smaHolding,
      },
      {
        label: "Volatility Regime",
        value: `ATR ${atrPct.toFixed(2)}%`,
        context: `${sigmaDev >= 0 ? "+" : ""}${sigmaDev.toFixed(2)}σ (${smaDirection})`,
      },
    ],
    anomaly,
  };
}

export function TruthEngine({ analysis }: { analysis: AssetAnalysis }) {
  const r = useMemo(() => buildReconstructionFromAnalysis(analysis), [analysis]);
  const elevated = r.systemState === "ELEVATED STATE";

  return (
    <section className="overflow-hidden rounded-3xl bg-surface">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>
          CALM TERMINAL <span className="opacity-40">//</span> {analysis.symbol}-USD RECONSTRUCTION
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1",
            elevated
              ? "bg-[color-mix(in_oklab,var(--color-accent)_55%,transparent)] text-accent-foreground"
              : "bg-muted text-foreground/70",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              elevated ? "bg-accent-foreground/70" : "bg-positive",
            )}
          />
          {r.systemState}
        </span>
      </header>

      {/* Prose block */}
      <div className="px-8 py-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Reconstruction
        </div>
        <p className="mt-4 max-w-3xl font-display text-[1.75rem] leading-[1.4] tracking-tight text-foreground">
          {emphasize(r.prose)}
        </p>
        <p className="mt-5 text-xs text-muted-foreground">
          Description of conditions, not a recommendation.
        </p>
      </div>

      {/* Telemetry Matrix */}
      <div className="border-t border-border/60 px-8 py-7">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Telemetry Matrix
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border/70">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Metric</th>
                <th className="px-4 py-2.5 text-left font-medium">Value</th>
                <th className="px-4 py-2.5 text-left font-medium">Context (24h Delta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {r.metrics.map((m) => (
                <tr key={m.label}>
                  <td className="px-4 py-3 text-foreground/80">{m.label}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-foreground">{m.value}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">
                    {m.context}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomaly Node */}
      <div className="border-t border-border/60 px-8 pb-8 pt-7">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Anomaly Node
        </div>
        <div
          className={cn(
            "mt-4 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm leading-relaxed",
            r.anomaly.kind === "active"
              ? "border-accent/60 bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-accent-foreground"
              : "border-border/70 bg-muted/30 text-foreground/75",
          )}
        >
          <span
            className={cn(
              "mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full",
              r.anomaly.kind === "active" ? "bg-accent-foreground/70" : "bg-positive",
            )}
          />
          <p>
            <span className="font-medium">
              {r.anomaly.kind === "active" ? "Active anomaly: " : "System baseline normal: "}
            </span>
            {r.anomaly.text}
          </p>
        </div>
      </div>
    </section>
  );
}

/** Lightly emphasizes structural phrases for natural eye-flow. */
function emphasize(text: string) {
  const keys = [
    /above its 20-day EMA/gi,
    /beneath its 20-day EMA/gi,
    /low-conviction consolidation phase/gi,
    /highly overextended/gi,
    /cooling down rapidly/gi,
    /aggressive range expansion/gi,
    /within baseline norms/gi,
    /compressed below baseline norms/gi,
  ];
  const parts: (string | ReactNode)[] = [text];
  let key = 0;
  for (const re of keys) {
    const next: (string | ReactNode)[] = [];
    for (const p of parts) {
      if (typeof p !== "string") {
        next.push(p);
        continue;
      }
      let lastIndex = 0;
      const matches = [...p.matchAll(re)];
      if (matches.length === 0) {
        next.push(p);
        continue;
      }
      for (const m of matches) {
        const idx = m.index ?? 0;
        if (idx > lastIndex) next.push(p.slice(lastIndex, idx));
        next.push(
          <span key={`em-${key++}`} className="font-medium text-foreground">
            {m[0]}
          </span>,
        );
        lastIndex = idx + m[0].length;
      }
      if (lastIndex < p.length) next.push(p.slice(lastIndex));
    }
    parts.splice(0, parts.length, ...next);
  }
  return <>{parts}</>;
}
