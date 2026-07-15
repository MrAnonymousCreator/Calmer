import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import {
  type Asset,
  type SignalReading,
  deriveSignalsFromAnalysis,
  deriveTruthFromAnalysis,
  formatBig,
  formatPrice,
} from "@/lib/market-data";
import { useAnalysis } from "@/lib/use-analysis";
import { PriceChart } from "./PriceChart";
import { SignalBreakdown } from "./SignalBreakdown";
import { MarketCalendar } from "./MarketCalendar";
import { StoryCards } from "./StoryCards";
import { TruthEngine } from "./TruthEngine";
import { StateEngine } from "./StateEngine";
import { ChangeLog } from "./ChangeLog";
import { WhatItMeans } from "./WhatItMeans";
import { StructuralBoundaries } from "./StructuralBoundaries";
import { cn } from "@/lib/utils";
import type { EngineMemory } from "@/lib/state-engine";

const RANGES = ["1H", "1D", "1W", "1M", "1Y", "ALL"] as const;
const VIEWS = ["Overview", "Calendar"] as const;

const ASSET_META: Record<string, { category: string; launched: string; consensus: string }> = {
  bitcoin:       { category: "Layer 1", launched: "2009", consensus: "Proof of Work" },
  ethereum:      { category: "Layer 1", launched: "2015", consensus: "Proof of Stake" },
  solana:        { category: "Layer 1", launched: "2020", consensus: "Proof of History / PoS" },
  cardano:       { category: "Layer 1", launched: "2017", consensus: "Proof of Stake" },
  "matic-network": { category: "Layer 2 / Scaling", launched: "2019", consensus: "Proof of Stake" },
  polkadot:      { category: "Layer 0", launched: "2020", consensus: "Nominated PoS" },
  "avalanche-2": { category: "Layer 1", launched: "2020", consensus: "Avalanche Consensus" },
  chainlink:     { category: "Oracle Network", launched: "2019", consensus: "Decentralized Oracles" },
  "bitcoin-cash": { category: "Layer 1", launched: "2017", consensus: "Proof of Work" },
  bittensor:     { category: "AI Layer 1", launched: "2021", consensus: "Proof of Intelligence" },
  tether:        { category: "Stablecoin", launched: "2014", consensus: "Multi-chain (issued)" },
  "usd-coin":    { category: "Stablecoin", launched: "2018", consensus: "Multi-chain (issued)" },
  binancecoin:   { category: "Exchange Token", launched: "2017", consensus: "Proof of Stake Authority" },
  ripple:        { category: "Payment Network", launched: "2012", consensus: "XRP Ledger Consensus" },
  "shiba-inu":   { category: "Meme / Layer 2", launched: "2020", consensus: "Proof of Stake" },
};

export function AssetWorkspace({ asset }: { asset: Asset }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M");
  const [view, setView] = useState<(typeof VIEWS)[number]>("Overview");
  const positive = asset.change24h >= 0;

  const { analysis, isLoading: analysisLoading } = useAnalysis(asset.id, asset.symbol);
  const [memory, setMemory] = useState<EngineMemory | null>(null);

  // Derived from daily candles — only computed when analysis is available.
  const signals = useMemo(
    () => (analysis ? deriveSignalsFromAnalysis(analysis) : []),
    [analysis],
  );
  const truth = useMemo(
    () => (analysis ? deriveTruthFromAnalysis(analysis) : ""),
    [analysis],
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-10 py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-8">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {asset.symbol} · USD
          </div>
          <h2 className="font-display text-[3.25rem] leading-[1.05] mt-2 text-foreground">
            {asset.name}
          </h2>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-[3.75rem] leading-none tabular-nums text-foreground">
              ${formatPrice(asset.price)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm tabular-nums",
                positive ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {positive ? "+" : ""}
              {asset.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <div className="inline-flex rounded-full bg-muted p-1">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                  view === v
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">Last updated · just now</span>
        </div>
      </div>

      {view === "Overview" ? (
        <>
          {/*
           * Everything below the header depends on analysis.candles / analysis.boundaries.
           * While analysis is loading, show an explicit skeleton — no silent fallback to
           * the sparkline-derived path, which uses the wrong timeframe.
           */}
          {analysis ? (
            <>
              {/* Multi-day narrative */}
              <div className="mt-10">
                <ChangeLog analysis={analysis} />
              </div>
              <div className="mt-6">
                <WhatItMeans analysis={analysis} />
              </div>
              <div className="mt-6">
                <StructuralBoundaries analysis={analysis} />
              </div>

              {/* Truth Engine — daily-candle reconstruction */}
              <div className="mt-6">
                <TruthEngine analysis={analysis} />
              </div>

              {/* State Engine */}
              <div className="mt-6">
                <StateEngine asset={asset} analysis={analysis} memory={memory} onMemoryChange={setMemory} />
              </div>

              {/* Signal summary */}
              <section className="mt-6 rounded-3xl bg-surface p-6">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Signal summary
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{truth}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {signals.map((s) => (
                    <SignalChip key={s.key} signal={s} />
                  ))}
                </div>
              </section>

              {/* Signal breakdown */}
              <SignalBreakdown signals={signals} />
            </>
          ) : (
            /* Explicit loading/error skeleton — never falls back to sparkline math */
            <AnalysisSkeleton loading={analysisLoading} />
          )}

          {/* Chart card — uses asset.sparkline; shown regardless of analysis state */}
          <section className="mt-6 rounded-3xl bg-surface p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Price chart
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Trailing performance · USD
                </div>
              </div>
              <div className="inline-flex rounded-full bg-muted p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      range === r
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <PriceChart data={asset.sparkline} positive={positive} />
            </div>
          </section>

          {/* Stats grid */}
          <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Market cap", value: formatBig(asset.marketCap) },
              { label: "24h volume", value: formatBig(asset.volume) },
              { label: "Circulating", value: "—" },
              { label: "All-time high", value: "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface p-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-2 text-xl tabular-nums text-foreground">{s.value}</div>
              </div>
            ))}
          </section>

          {/* About */}
          <section className="mt-6 rounded-3xl bg-surface p-8">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              About
            </div>
            <h3 className="font-display text-xl mt-2 text-foreground">{asset.name}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {asset.about}
            </p>
            <div className="mt-6 grid max-w-md gap-3 text-sm">
              <Row label="Category" value={ASSET_META[asset.id]?.category ?? "Digital Asset"} />
              <Row label="Launched" value={ASSET_META[asset.id]?.launched ?? "—"} />
              <Row label="Consensus" value={ASSET_META[asset.id]?.consensus ?? "—"} />
            </div>
          </section>

          <StoryCards />
        </>
      ) : (
        <MarketCalendar />
      )}
    </div>
  );
}

function AnalysisSkeleton({ loading }: { loading: boolean }) {
  return (
    <div className="mt-10 space-y-3">
      {/* Pulsing placeholder cards matching the heights of the analysis sections */}
      {loading ? (
        <>
          <div className="animate-pulse rounded-3xl bg-surface h-40 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Compiling 14-day structural narrative…
          </div>
          <div className="animate-pulse rounded-3xl bg-surface h-28" />
          <div className="animate-pulse rounded-3xl bg-surface h-64" />
          <div className="animate-pulse rounded-3xl bg-surface h-52" />
          <div className="animate-pulse rounded-3xl bg-surface h-36" />
        </>
      ) : (
        <div className="rounded-3xl bg-surface p-8 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          Structural analysis unavailable — data could not be retrieved right now.
        </div>
      )}
    </div>
  );
}

function SignalChip({ signal }: { signal: SignalReading }) {
  const tone =
    signal.tone === "positive"
      ? "bg-positive-soft text-positive"
      : signal.tone === "negative"
        ? "bg-negative-soft text-negative"
        : "bg-muted text-foreground/70";
  const dot =
    signal.tone === "positive"
      ? "bg-positive"
      : signal.tone === "negative"
        ? "bg-negative"
        : "bg-foreground/40";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs",
        tone,
      )}
      title={signal.value}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="text-foreground/60">{signal.label}</span>
      <span className="font-medium">{signal.state}</span>
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
