// ============================================================================
// Calm Terminal — swing-trader analysis primitives.
// Pure, deterministic helpers. No I/O, no dates-of-day, no randomness.
// Inputs: daily candles (or hourly bucketed to daily). Outputs: structured
// setups, boundaries, and objective conditional mechanics.
// ============================================================================

export type Candle = {
  t: number;      // ms epoch, start-of-day
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type BehavioralState = "Consolidating" | "Trending" | "Mean Reversion";

export type SetupKind = "Breakout" | "Trend Failure" | "Clean Retest" | "Compression";

export type ChangeLogEvent = {
  dayOffset: number;        // 0 = most recent day, negative = days back
  label: string;            // short verb phrase, e.g. "Range compression"
  detail: string;           // one-line observation
  tone: "positive" | "negative" | "neutral";
};

export type SetupSequence = {
  kind: SetupKind;
  headline: string;         // "Bullish breakout sequence forming"
  progress: number;         // 0..1 how complete the sequence is
  events: ChangeLogEvent[]; // chronological, oldest → newest
};

export type StructuralBoundaries = {
  support: number;
  resistance: number;
  sma20: number;
  sma50: number | null;
  atr: number;              // avg true range, absolute price units
  expectedMove: {
    low: number;
    high: number;
    horizonDays: number;
    method: string;
  };
  invalidation: {
    price: number;
    direction: "above" | "below";
    reason: string;
  };
};

export type AssetAnalysis = {
  id: string;
  symbol: string;
  behavioralState: BehavioralState;
  stateReason: string;
  setup: SetupSequence;
  marketState: {
    title: string;          // "Volatility compression"
    body: string;           // "Volatility compression implies a strong directional move is building."
  };
  boundaries: StructuralBoundaries;
  triggerHeadline: string | null; // for Dashboard Feed, null if nothing crossed
  candles: Candle[];
};

// ────────────────────────── math helpers ──────────────────────────

function last<T>(a: T[]): T { return a[a.length - 1]; }
function sma(xs: number[], n: number): number {
  const s = xs.slice(-n);
  return s.reduce((a, b) => a + b, 0) / s.length;
}

// ──────────── cheap setup spot from a 7d sparkline (no API) ────────────
export function spotSetupFromSparkline(
  sparkline: number[],
): { label: string; tone: "positive" | "negative" | "neutral" } | null {
  if (sparkline.length < 30) return null;
  const recent = sparkline.slice(-6);
  const prior = sparkline.slice(-30, -6);
  const priorHi = Math.max(...prior);
  const priorLo = Math.min(...prior);
  const cur = recent[recent.length - 1];
  const rangePrior = priorHi - priorLo || 1;
  const rangeRecent = Math.max(...recent) - Math.min(...recent);
  const compression = rangeRecent / rangePrior;

  if (cur > priorHi * 1.005) return { label: "Range breakout — up", tone: "positive" };
  if (cur < priorLo * 0.995) return { label: "Range breach — down", tone: "negative" };
  if (compression < 0.5) return { label: "Volatility compression", tone: "neutral" };

  const s20 = sma(sparkline, 20);
  const prev = sparkline[sparkline.length - 6];
  if (prev < s20 && cur > s20 * 1.002) return { label: "20-day reclaim", tone: "positive" };
  if (prev > s20 && cur < s20 * 0.998) return { label: "20-day break", tone: "negative" };
  return null;
}

// ─────────────────── cheap sparkline classifier ───────────────────
// Used for the Setup Watch sidebar categorization; no API call.
export function classifyBehavior(sparkline: number[]): BehavioralState {
  if (sparkline.length < 20) return "Consolidating";
  const recent = sparkline.slice(-20);
  const prior = sparkline.slice(-40, -20);
  const meanR = recent.reduce((a, b) => a + b, 0) / recent.length;
  const meanP = prior.length ? prior.reduce((a, b) => a + b, 0) / prior.length : meanR;
  const drift = Math.abs((meanR - meanP) / meanP);
  const range = (Math.max(...recent) - Math.min(...recent)) / meanR;
  const s20 = sma(sparkline, 20);
  const distance = Math.abs((last(sparkline) - s20) / s20);

  if (range < 0.04 && drift < 0.015) return "Consolidating";
  if (drift > 0.03 && range > 0.05) return "Trending";
  if (distance > 0.025) return "Mean Reversion";
  return "Consolidating";
}
