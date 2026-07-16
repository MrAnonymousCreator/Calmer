import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { Asset } from "@/lib/market-data";
import {
  type Agreement,
  type ClusterKey,
  type ClusterReading,
  type EngineSnapshot,
  type MarketState,
  type Persistence,
  type Status,
  type Tension,
  deriveClusters,
  evaluate,
  loadMemory,
  saveMemory,
} from "@/lib/state-engine";
import { cn } from "@/lib/utils";

const STATE_TONE: Record<MarketState, string> = {
  Strong: "bg-positive-soft text-positive",
  Constructive: "bg-positive-soft/60 text-positive",
  Neutral: "bg-muted text-foreground/70",
  Cautious: "bg-negative-soft/60 text-negative",
  Defensive: "bg-negative-soft text-negative",
};

const READING_TONE: Record<ClusterReading, string> = {
  Positive: "text-positive",
  Neutral: "text-foreground/60",
  Weakening: "text-accent-foreground/80",
  Negative: "text-negative",
};

const READING_DOT: Record<ClusterReading, string> = {
  Positive: "bg-positive",
  Neutral: "bg-foreground/30",
  Weakening: "bg-accent-foreground/60",
  Negative: "bg-negative",
};

const STATUS_LABEL: Record<Status, string> = {
  Unchanged: "Holding",
  Strengthening: "Strengthening",
  Weakening: "Weakening",
  Changed: "Transitioned",
};

const STATUS_TONE: Record<Status, string> = {
  Unchanged: "bg-muted text-foreground/70",
  Strengthening: "bg-positive-soft text-positive",
  Weakening: "bg-negative-soft/60 text-negative",
  Changed: "bg-foreground text-background",
};

const PERSISTENCE_TONE: Record<Persistence, string> = {
  Confirmed: "text-positive",
  Forming: "text-accent-foreground/80",
  Unstable: "text-negative",
};

const AGREEMENT_TONE: Record<Agreement, string> = {
  High: "text-positive",
  Medium: "text-foreground/70",
  Low: "text-negative",
};

const TENSION_TONE: Record<Tension, string> = {
  Low: "bg-muted text-foreground/70",
  Medium: "bg-accent-foreground/15 text-accent-foreground",
  High: "bg-negative-soft text-negative",
};

const CLUSTER_LABEL: Record<ClusterKey, string> = {
  trend: "Trend",
  flow: "Flow",
  risk: "Risk",
  participation: "Participation",
};

export function StateEngine({ asset }: { asset: Asset }) {
  const clusters = useMemo(
    () => deriveClusters({ sparkline: asset.sparkline, change24h: asset.change24h }),
    [asset.sparkline, asset.change24h],
  );

  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);

  useEffect(() => {
    const prior = loadMemory(asset.id);
    const { snapshot, memory } = evaluate(clusters, prior);
    saveMemory(asset.id, memory);
    setSnapshot(snapshot);
  }, [asset.id, clusters]);

  if (!snapshot) return null;

  const { signals, tension, narrative, previousState, previousClusters } = snapshot;
  const flippedSet = new Set<ClusterKey>(signals.flipped);
  const driftedSet = new Set<ClusterKey>(signals.drifted);
  const nearlySet = new Set<ClusterKey>(signals.nearlyFlipped);

  return (
    <section className="overflow-hidden rounded-3xl bg-surface">
      {/* ============ A. CURRENT STATE ============ */}
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>
          State Engine <span className="opacity-40">//</span> {asset.symbol}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1",
            STATUS_TONE[snapshot.status],
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {STATUS_LABEL[snapshot.status]}
        </span>
      </header>

      <div className="px-8 py-8">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Market State
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-4">
          {previousState && (
            <>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 font-display text-base leading-none opacity-60",
                  STATE_TONE[previousState],
                )}
              >
                {previousState}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-4 py-1.5 font-display text-[1.75rem] leading-none",
              STATE_TONE[snapshot.state],
            )}
          >
            {snapshot.state}
          </span>
          <span className="text-xs text-muted-foreground">
            {snapshot.last_change
              ? `Last change · ${new Date(snapshot.last_change).toLocaleString()}`
              : "No prior transition on record"}
          </span>
        </div>
      </div>

      {/* ============ B. WHAT CHANGED ============ */}
      <div className="border-t border-border/60 px-8 py-6">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            What changed
          </div>
          <span className="text-[11px] text-muted-foreground">
            vs. {previousClusters ? "previous reading" : "baseline"}
          </span>
        </div>

        {narrative.changed.length === 0 &&
          narrative.nearly.length === 0 &&
          previousClusters && (
            <p className="mt-3 text-sm text-foreground/70">
              No structural changes since the previous reading — configuration held intact.
            </p>
          )}

        {narrative.changed.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground/85">
            {narrative.changed.map((n, i) => (
              <li key={i} className="flex gap-2.5">
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}

        {narrative.nearly.length > 0 && (
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-accent-foreground/85">
            {narrative.nearly.map((n, i) => (
              <li key={i} className="flex gap-2.5">
                <Minus className="mt-1 h-3.5 w-3.5 shrink-0 opacity-60" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
        )}

        {narrative.held.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/60">Held: </span>
            {narrative.held.join(" ")}
          </p>
        )}
      </div>

      {/* ============ C. SYSTEM SIGNALS (hidden logic) ============ */}
      <div className="border-t border-border/60 px-8 py-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          System Signals
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <SignalStat
            label="Clusters flipped"
            value={`${signals.flipped.length} / 4`}
            sub={signals.flipped.length ? signals.flipped.map((k) => CLUSTER_LABEL[k]).join(", ") : "none"}
            tone={signals.flipped.length >= 2 ? "text-negative" : "text-foreground/80"}
          />
          <SignalStat
            label="Persistence"
            value={signals.persistence}
            sub={`${signals.persistenceCount} / ${signals.persistenceTarget} confirmations`}
            tone={PERSISTENCE_TONE[signals.persistence]}
          />
          <SignalStat
            label="Agreement"
            value={signals.agreement}
            sub={`${signals.positiveCount}+ · ${signals.negativeCount}−`}
            tone={AGREEMENT_TONE[signals.agreement]}
          />
        </div>

        {/* Cluster delta matrix */}
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {(Object.keys(snapshot.clusters) as ClusterKey[]).map((k) => {
            const r = snapshot.clusters[k];
            const prev = previousClusters?.[k];
            const flipped = flippedSet.has(k);
            const drifted = driftedSet.has(k);
            const nearly = nearlySet.has(k);
            return (
              <div
                key={k}
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  flipped
                    ? "border-negative/50 bg-negative-soft/30"
                    : nearly
                      ? "border-accent-foreground/30 bg-accent-foreground/5"
                      : "border-border/70",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {CLUSTER_LABEL[k]}
                  </div>
                  {flipped && (
                    <span className="rounded-full bg-negative/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-negative">
                      Flip
                    </span>
                  )}
                  {!flipped && nearly && (
                    <span className="rounded-full bg-accent-foreground/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-accent-foreground">
                      Near
                    </span>
                  )}
                  {!flipped && !nearly && drifted && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-foreground/60">
                      Drift
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {prev && prev !== r && (
                    <>
                      <span className="text-xs text-muted-foreground line-through">{prev}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", READING_TONE[r])}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", READING_DOT[r])} />
                    {r}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ D. TENSION ============ */}
      <div className="border-t border-border/60 px-8 py-6">
        <div className="flex items-baseline justify-between">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
            Tension
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              TENSION_TONE[tension.level],
            )}
          >
            {tension.level === "High" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : tension.level === "Low" ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {tension.level}
          </span>
        </div>

        {/* Proximity meter */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span>Holding</span>
            <span>Proximity to flip</span>
            <span>Transition</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                tension.level === "High"
                  ? "bg-negative"
                  : tension.level === "Medium"
                    ? "bg-accent-foreground/70"
                    : "bg-foreground/40",
              )}
              style={{ width: `${Math.round(tension.proximity * 100)}%` }}
            />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/75">{tension.reason}</p>
      </div>

      {/* ============ E. REASONING + WATCHING ============ */}
      <div className="border-t border-border/60 px-8 py-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          Reasoning
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/80">
          {snapshot.reason.map((r, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border/60 px-8 pb-8 pt-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-muted-foreground">
          What would change the state
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
          {snapshot.watching.map((w, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SignalStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 px-4 py-3">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1.5 text-base font-medium", tone)}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
