import type { Candle } from "./analysis";

/**
 * Calm Terminal — Backend State Engine
 *
 * Deterministic state machine. Takes 4 independent cluster readings and
 * outputs a single market interpretation state. State is stable by default —
 * it changes only when persistent structural divergence is observed across
 * evaluations. No forecasting, no weighting, no probabilities.
 */

export type ClusterReading = "Positive" | "Neutral" | "Negative" | "Weakening";
export type ClusterKey = "trend" | "flow" | "risk" | "participation";
export type Clusters = Record<ClusterKey, ClusterReading>;

export type MarketState =
  | "Strong"
  | "Constructive"
  | "Neutral"
  | "Cautious"
  | "Defensive";

export type Status = "Unchanged" | "Strengthening" | "Weakening" | "Changed";

export type Persistence = "Unstable" | "Forming" | "Confirmed";
export type Agreement = "Low" | "Medium" | "High";
export type Tension = "Low" | "Medium" | "High";

export type ClusterDelta = {
  key: ClusterKey;
  from: ClusterReading;
  to: ClusterReading;
  /** "flip" = crossed polarity, "drift" = same polarity but stronger/weaker, "settle" = unchanged */
  kind: "flip" | "drift" | "settle";
};

export type EngineSnapshot = {
  state: MarketState;
  previousState: MarketState | null;
  clusters: Clusters;
  previousClusters: Clusters | null;
  status: Status;
  /** Structural signals — the hidden logic, made visible. */
  signals: {
    flipped: ClusterKey[];
    drifted: ClusterKey[];
    nearlyFlipped: ClusterKey[];
    persistence: Persistence;
    persistenceCount: number;
    persistenceTarget: number;
    agreement: Agreement;
    positiveCount: number;
    negativeCount: number;
  };
  tension: {
    level: Tension;
    /** 0..1 — proximity to next state transition */
    proximity: number;
    reason: string;
  };
  narrative: {
    changed: string[];
    held: string[];
    nearly: string[];
  };
  reason: string[];
  watching: string[];
  last_change: string | null;
};

export type EngineMemory = {
  state: MarketState;
  clusters: Clusters;
  last_change: string | null;
  /** History of recent cluster readings used to validate persistence. */
  history: Clusters[];
};

const STATE_ORDER: MarketState[] = [
  "Defensive",
  "Cautious",
  "Neutral",
  "Constructive",
  "Strong",
];

const POSITIVE: ClusterReading[] = ["Positive"];
const NEGATIVE: ClusterReading[] = ["Negative", "Weakening"];

const CLUSTER_KEYS: ClusterKey[] = ["trend", "flow", "risk", "participation"];

function countWhere(c: Clusters, pred: (r: ClusterReading) => boolean): number {
  return (Object.values(c) as ClusterReading[]).filter(pred).length;
}

function polarity(r: ClusterReading): "pos" | "neg" | "neu" {
  if (POSITIVE.includes(r)) return "pos";
  if (NEGATIVE.includes(r)) return "neg";
  return "neu";
}

function deltaKind(prev: ClusterReading, next: ClusterReading): ClusterDelta["kind"] {
  if (prev === next) return "settle";
  const p = polarity(prev);
  const n = polarity(next);
  // A "flip" is a crossing between pos <-> neg, or any move out of/into neutral when polarity changes.
  if ((p === "pos" && n === "neg") || (p === "neg" && n === "pos")) return "flip";
  if (p !== n) return "flip";
  return "drift";
}

function clustersEqual(a: Clusters, b: Clusters): boolean {
  return CLUSTER_KEYS.every((k) => a[k] === b[k]);
}

function step(state: MarketState, delta: number): MarketState {
  const i = STATE_ORDER.indexOf(state);
  const next = Math.max(0, Math.min(STATE_ORDER.length - 1, i + delta));
  return STATE_ORDER[next];
}

/** Minimum number of consecutive evaluations a new configuration must hold. */
const PERSISTENCE_WINDOW = 2;

const READING_LABEL: Record<ClusterReading, string> = {
  Positive: "Positive",
  Neutral: "Neutral",
  Weakening: "Weakening",
  Negative: "Negative",
};

export function evaluate(
  clusters: Clusters,
  memory: EngineMemory | null,
  now: string = new Date().toISOString(),
): { snapshot: EngineSnapshot; memory: EngineMemory } {
  // First evaluation — seed memory, no transition possible.
  if (!memory) {
    const seed: EngineMemory = {
      state: "Neutral",
      clusters,
      last_change: null,
      history: [clusters],
    };
    const baselineSignals = buildSignals(clusters, null, [clusters]);
    return {
      snapshot: {
        state: seed.state,
        previousState: null,
        clusters,
        previousClusters: null,
        status: "Unchanged",
        signals: baselineSignals,
        tension: computeTension(seed.state, clusters, baselineSignals, false),
        narrative: {
          changed: [],
          held: ["Baseline established — first reading on record."],
          nearly: [],
        },
        reason: [
          describeClusters(clusters),
          "Baseline established — no prior reading to compare against.",
        ],
        watching: [watchingFor(seed.state, clusters)],
        last_change: null,
      },
      memory: seed,
    };
  }

  // Append current reading and keep a short window.
  const history = [...memory.history, clusters].slice(-PERSISTENCE_WINDOW - 1);

  // Persistence: the latest WINDOW evaluations must share the same configuration.
  const recent = history.slice(-PERSISTENCE_WINDOW);
  const persistent =
    recent.length === PERSISTENCE_WINDOW &&
    recent.every((c) => clustersEqual(c, clusters));

  // Compare against last *committed* clusters (the configuration the state was set on).
  const prev = memory.clusters;

  const flipped = CLUSTER_KEYS.filter((k) => deltaKind(prev[k], clusters[k]) === "flip");
  const drifted = CLUSTER_KEYS.filter((k) => deltaKind(prev[k], clusters[k]) === "drift");
  const directionalShift = flipped.length >= 2;

  const erodingCount = countWhere(clusters, (r) => NEGATIVE.includes(r));
  const aligningPos = countWhere(clusters, (r) => POSITIVE.includes(r));
  const prevNeg = countWhere(prev, (r) => NEGATIVE.includes(r));

  const erosion = erodingCount >= 2;
  const strongAlignment = aligningPos >= 3;

  let nextState = memory.state;
  let status: Status = "Unchanged";
  const reason: string[] = [];

  if (persistent && directionalShift) {
    const dir = erodingCount > prevNeg ? -1 : +1;
    nextState = step(memory.state, dir);
    status = "Changed";
    reason.push(
      `Directional flip across ${flipped.length} clusters (${flipped.join(", ")}).`,
      `Configuration held for ${PERSISTENCE_WINDOW} consecutive evaluations — transition committed.`,
    );
  } else if (persistent && erosion && memory.state !== "Defensive") {
    nextState = step(memory.state, -1);
    status = "Changed";
    reason.push(
      `${erodingCount} clusters reading Negative or Weakening.`,
      `Erosion persisted across ${PERSISTENCE_WINDOW} evaluations — state downgraded.`,
    );
  } else if (persistent && strongAlignment && memory.state !== "Strong") {
    nextState = step(memory.state, +1);
    status = "Changed";
    reason.push(
      `${aligningPos} clusters aligned Positive.`,
      `Alignment persisted across ${PERSISTENCE_WINDOW} evaluations — state upgraded.`,
    );
  } else {
    if (!persistent && (directionalShift || erosion)) {
      status = "Weakening";
      reason.push(
        directionalShift
          ? `Directional change in ${flipped.length} clusters but not yet persistent.`
          : `${erodingCount} clusters eroding but configuration not yet persistent.`,
        "Stability override active — single-evaluation noise does not trigger transition.",
      );
    } else if (!persistent && strongAlignment) {
      status = "Strengthening";
      reason.push(
        `${aligningPos} clusters aligned Positive — alignment forming.`,
        "Awaiting confirmation across next evaluation before upgrade.",
      );
    } else {
      status = "Unchanged";
      reason.push(
        describeClusters(clusters),
        "No structural divergence detected — previous state retained.",
      );
    }
  }

  const changed = nextState !== memory.state;
  const previousState = changed ? memory.state : null;

  const nextMemory: EngineMemory = {
    state: nextState,
    clusters: changed ? clusters : memory.clusters,
    last_change: changed ? now : memory.last_change,
    history,
  };

  const signals = buildSignals(clusters, prev, history);
  // A cluster "nearly flipped" if it drifted toward the opposite polarity (e.g., Positive -> Neutral).
  signals.nearlyFlipped = CLUSTER_KEYS.filter((k) => {
    const d = deltaKind(prev[k], clusters[k]);
    if (d !== "drift") return false;
    const p = polarity(prev[k]);
    const n = polarity(clusters[k]);
    return (p === "pos" && n === "neu") || (p === "neg" && n === "neu");
  });

  const tension = computeTension(nextState, clusters, signals, changed);

  const narrative = {
    changed: changed
      ? [`Market state moved from ${memory.state} to ${nextState}.`]
      : flipped.length > 0
        ? flipped.map(
            (k) => `${cap(k)} flipped ${READING_LABEL[prev[k]]} → ${READING_LABEL[clusters[k]]}.`,
          )
        : drifted.length > 0
          ? drifted.map(
              (k) => `${cap(k)} drifted ${READING_LABEL[prev[k]]} → ${READING_LABEL[clusters[k]]}.`,
            )
          : [],
    held: CLUSTER_KEYS.filter((k) => prev[k] === clusters[k]).map(
      (k) => `${cap(k)} held at ${READING_LABEL[clusters[k]]}.`,
    ),
    nearly: signals.nearlyFlipped.map(
      (k) => `${cap(k)} nearly flipped — drifted to Neutral but did not cross.`,
    ),
  };

  return {
    snapshot: {
      state: nextState,
      previousState,
      clusters,
      previousClusters: prev,
      status,
      signals,
      tension,
      narrative,
      reason,
      watching: [watchingFor(nextState, clusters)],
      last_change: nextMemory.last_change,
    },
    memory: nextMemory,
  };
}

function buildSignals(
  clusters: Clusters,
  prev: Clusters | null,
  history: Clusters[],
): EngineSnapshot["signals"] {
  const flipped = prev
    ? CLUSTER_KEYS.filter((k) => deltaKind(prev[k], clusters[k]) === "flip")
    : [];
  const drifted = prev
    ? CLUSTER_KEYS.filter((k) => deltaKind(prev[k], clusters[k]) === "drift")
    : [];

  // Persistence over the rolling window.
  const recent = history.slice(-PERSISTENCE_WINDOW);
  const allMatch =
    recent.length === PERSISTENCE_WINDOW && recent.every((c) => clustersEqual(c, clusters));
  const persistenceCount = recent.filter((c) => clustersEqual(c, clusters)).length;
  let persistence: Persistence;
  if (allMatch) persistence = "Confirmed";
  else if (persistenceCount >= 1 && (flipped.length > 0 || drifted.length > 0))
    persistence = "Forming";
  else if (flipped.length > 0) persistence = "Unstable";
  else persistence = persistenceCount >= 1 ? "Confirmed" : "Forming";

  const positiveCount = countWhere(clusters, (r) => POSITIVE.includes(r));
  const negativeCount = countWhere(clusters, (r) => NEGATIVE.includes(r));
  const dominant = Math.max(positiveCount, negativeCount);
  // 4/4 same polarity = High, 3/4 = Medium, else Low.
  const agreement: Agreement = dominant >= 4 ? "High" : dominant === 3 ? "Medium" : "Low";

  return {
    flipped,
    drifted,
    nearlyFlipped: [],
    persistence,
    persistenceCount,
    persistenceTarget: PERSISTENCE_WINDOW,
    agreement,
    positiveCount,
    negativeCount,
  };
}

function computeTension(
  state: MarketState,
  clusters: Clusters,
  signals: EngineSnapshot["signals"],
  justChanged: boolean,
): EngineSnapshot["tension"] {
  // Distance to a transition trigger.
  // Upgrade trigger: 3 positive clusters. Downgrade trigger: 2 negative clusters.
  const toUpgrade = Math.max(0, 3 - signals.positiveCount);
  const toDowngrade = Math.max(0, 2 - signals.negativeCount);
  const distance = Math.min(toUpgrade, toDowngrade);

  // Proximity 0..1 — closer to a trigger, higher proximity.
  let proximity = 0;
  if (distance === 0) proximity = signals.persistence === "Confirmed" ? 1 : 0.85;
  else if (distance === 1) proximity = 0.55;
  else proximity = 0.2;

  // Boost if flips already observed or persistence forming.
  if (signals.flipped.length >= 1) proximity = Math.min(1, proximity + 0.1);
  if (signals.persistence === "Forming") proximity = Math.min(1, proximity + 0.05);
  if (justChanged) proximity = 0.25; // just transitioned — tension resets

  let level: Tension;
  if (proximity >= 0.8) level = "High";
  else if (proximity >= 0.45) level = "Medium";
  else level = "Low";

  let reason: string;
  if (justChanged) {
    reason = `State just transitioned to ${state} — tension resets.`;
  } else if (toUpgrade === 0) {
    reason = `${signals.positiveCount} clusters Positive — one more persistent reading triggers an upgrade.`;
  } else if (toDowngrade === 0) {
    reason = `${signals.negativeCount} clusters eroding — one more persistent reading triggers a downgrade.`;
  } else if (signals.flipped.length >= 1) {
    reason = `${signals.flipped.length} cluster(s) flipped — proximity to transition rising.`;
  } else {
    reason = "Configuration stable — no near-term transition pressure.";
  }

  return { level, proximity, reason };
}

function describeClusters(c: Clusters): string {
  return `Trend ${c.trend}, Flow ${c.flow}, Risk ${c.risk}, Participation ${c.participation}.`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function watchingFor(state: MarketState, c: Clusters): string {
  const negCount = countWhere(c, (r) => NEGATIVE.includes(r));
  const posCount = countWhere(c, (r) => POSITIVE.includes(r));
  if (state === "Strong" || state === "Constructive") {
    return negCount >= 1
      ? "A second cluster flipping to Negative or Weakening would trigger a downgrade."
      : "Two clusters turning Negative or Weakening across consecutive evaluations would trigger a downgrade.";
  }
  if (state === "Defensive" || state === "Cautious") {
    return posCount >= 1
      ? "A third cluster turning Positive would trigger an upgrade."
      : "Three clusters aligning Positive across consecutive evaluations would trigger an upgrade.";
  }
  return "Two clusters shifting direction in either polarity would trigger a transition.";
}

/* ---------------- Persistence (browser localStorage) ---------------- */

const KEY = "calm-terminal:state-engine:v3";

type Store = Record<string, EngineMemory>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}

function writeStore(s: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function loadMemory(assetId: string): EngineMemory | null {
  return readStore()[assetId] ?? null;
}

export function saveMemory(assetId: string, mem: EngineMemory) {
  const store = readStore();
  store[assetId] = mem;
  writeStore(store);
}

/* ---------------- Cluster derivation from sparkline ---------------- */

function mean(a: number[]): number {
  return a.reduce((x, y) => x + y, 0) / Math.max(a.length, 1);
}

function stdev(a: number[]): number {
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2)));
}

function rsi(arr: number[], period = 14): number {
  if (arr.length < period + 1) return 50;
  let g = 0;
  let l = 0;
  for (let i = arr.length - period; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    if (d >= 0) g += d;
    else l -= d;
  }
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / period / (l / period));
}

function returns(a: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < a.length; i++) out.push((a[i] - a[i - 1]) / a[i - 1]);
  return out;
}

/**
 * Project a sparkline + change24h into four independent cluster readings.
 * Each cluster looks at an orthogonal facet — they are NOT weighted or merged.
 */
export function deriveClusters(input: {
  sparkline: number[];
  change24h: number;
}): Clusters {
  const s = input.sparkline;
  const last = s[s.length - 1] ?? 0;
  const head = s[0] ?? last;
  const trendPct = ((last - head) / head) * 100;
  const recentSlope = s.length > 5 ? last - s[s.length - 5] : 0;

  const r = rsi(s);
  const rets = returns(s);
  const recentVol = stdev(rets.slice(-7));
  const baseVol = stdev(rets.slice(-30, -7)) || recentVol || 0.0001;
  const volDev = (recentVol - baseVol) / baseVol;

  const trend: ClusterReading =
    trendPct > 3 ? "Positive" : trendPct < -3 ? "Negative" : recentSlope < 0 ? "Weakening" : "Neutral";

  const flow: ClusterReading =
    input.change24h > 1.5
      ? "Positive"
      : input.change24h < -1.5
        ? "Negative"
        : input.change24h < 0
          ? "Weakening"
          : "Neutral";

  const risk: ClusterReading =
    volDev > 1.0 ? "Negative" : volDev > 0.3 ? "Weakening" : volDev < -0.3 ? "Positive" : "Neutral";

  const participation: ClusterReading =
    r > 60 ? "Positive" : r < 40 ? "Negative" : r < 48 ? "Weakening" : "Neutral";

  return { trend, flow, risk, participation };
}

export function deriveClusterFromCandles(
  candles: Candle[],
  change24h: number,
): Clusters {
  const closes = candles.map((c) => c.c);
  const last = closes[closes.length - 1] ?? 0;
  const head = closes[0] ?? last;
  const trendPct = ((last - head) / head) * 100;
  const recentSlope = closes.length > 5 ? last - closes[closes.length - 5] : 0;

  const r = rsi(closes);
  const rets = returns(closes);
  const recentVol = stdev(rets.slice(-7));
  const baseVol = stdev(rets.slice(-10, -4)) || recentVol || 0.0001;
  const volDev = (recentVol - baseVol) / baseVol;

  const trend: ClusterReading =
    trendPct > 3 ? "Positive" : trendPct < -3 ? "Negative" : recentSlope < 0 ? "Weakening" : "Neutral";

  const flow: ClusterReading =
    change24h > 1.5 ? "Positive" : change24h < -1.5 ? "Negative" : change24h < 0 ? "Weakening" : "Neutral";

  const risk: ClusterReading =
    volDev > 1.0 ? "Negative" : volDev > 0.3 ? "Weakening" : volDev < -0.3 ? "Positive" : "Neutral";

  const participation: ClusterReading =
    r > 60 ? "Positive" : r < 40 ? "Negative" : r < 48 ? "Weakening" : "Neutral";

  return { trend, flow, risk, participation };
}
