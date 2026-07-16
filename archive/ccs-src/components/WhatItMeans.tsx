import { AlertTriangle } from "lucide-react";
import type { AssetAnalysis } from "@/lib/analysis";
import { formatPrice } from "@/lib/market-data";

export function WhatItMeans({ analysis }: { analysis: AssetAnalysis }) {
  const { marketState, boundaries } = analysis;
  const inv = boundaries.invalidation;
  return (
    <section className="rounded-3xl bg-surface p-8">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        What it means
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            Market state
          </div>
          <h3 className="font-display text-lg mt-2 text-foreground">{marketState.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/75">{marketState.body}</p>
        </div>

        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
            Conditional mechanics
          </div>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/80">
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
              <span>
                <span className="text-foreground/60">If </span>
                price holds above <span className="font-mono tabular-nums">{formatPrice(boundaries.sma20)}</span>
                <span className="text-foreground/60"> then </span>
                the current sequence stays intact.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
              <span>
                <span className="text-foreground/60">If </span>
                daily close breaches the 7-day range then behavioral state transitions to
                <span className="text-foreground/60"> a new regime.</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-negative/30 bg-negative-soft/25 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-negative mt-0.5" />
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-negative">
                Invalidation line
              </div>
              <div className="text-sm text-foreground/80">
                Daily close {inv.direction}{" "}
                <span className="font-mono tabular-nums text-foreground">${formatPrice(inv.price)}</span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">{inv.reason}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
