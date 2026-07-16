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
function stdev(xs: number[]): number {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
  return Math.sqrt(v);
}
function pctReturns(cs: Candle[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < cs.length; i++) r.push((cs[i].c - cs[i - 1].c) / cs[i - 1].c);
  return r;
}
function trueRange(prev: Candle, cur: Candle): number {
  return Math.max(cur.h - cur.l, Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c));
}
function atr(cs: Candle[], n = 7): number {
  if (cs.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < cs.length; i++) trs.push(trueRange(cs[i - 1], cs[i]));
  return sma(trs, Math.min(n, trs.length));
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

// ────────────────────── bucket hourly → daily ─────────────────────

export function bucketToDaily(
  prices: [number, number][], // [ms, price]
  volumes: [number, number][],
): Candle[] {
  if (!prices.length) return [];
  const byDay = new Map<number, { pts: number[]; vol: number; first: number }>();
  const volMap = new Map<number, number>();
  for (const [t, v] of volumes) {
    const day = Math.floor(t / 86_400_000) * 86_400_000;
    volMap.set(day, (volMap.get(day) ?? 0) + v);
  }
  for (const [t, p] of prices) {
    const day = Math.floor(t / 86_400_000) * 86_400_000;
    const b = byDay.get(day);
    if (!b) byDay.set(day, { pts: [p], vol: 0, first: p });
    else b.pts.push(p);
  }
  const out: Candle[] = [];
  const keys = [...byDay.keys()].sort((a, b) => a - b);
  for (const day of keys) {
    const b = byDay.get(day)!;
    out.push({
      t: day,
      o: b.first,
      h: Math.max(...b.pts),
      l: Math.min(...b.pts),
      c: b.pts[b.pts.length - 1],
      v: volMap.get(day) ?? 0,
    });
  }
  return out;
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

// ────────────────────── deep candle analysis ──────────────────────

export function analyzeCandles(id: string, symbol: string, cs: Candle[]): AssetAnalysis {
  const n = cs.length;
  const cur = last(cs);
  const closes = cs.map((c) => c.c);
  const highs = cs.map((c) => c.h);
  const lows = cs.map((c) => c.l);
  const vols = cs.map((c) => c.v);

  const s5 = sma(closes, Math.min(5, n));
  const s10 = sma(closes, Math.min(10, n));
  const s20 = sma(closes, Math.min(20, n));
  const s50 = n >= 30 ? sma(closes, Math.min(50, n)) : null;
  const a = atr(cs, 7);

  // Rolling range compression check (last 5 vs prior 5)
  const recentHi = Math.max(...highs.slice(-5));
  const recentLo = Math.min(...lows.slice(-5));
  const priorHi = Math.max(...highs.slice(-10, -5));
  const priorLo = Math.min(...lows.slice(-10, -5));
  const recentRange = recentHi - recentLo;
  const priorRange = priorHi - priorLo || recentRange;
  const compression = recentRange / priorRange; // <1 = compressed

  // Volume spike (last day vs prior 7d avg)
  const priorVol = vols.slice(-8, -1);
  const avgVol = priorVol.length ? priorVol.reduce((a, b) => a + b, 0) / priorVol.length : cur.v;
  const volRatio = avgVol ? cur.v / avgVol : 1;

  // Breach detection
  const above = cur.c > priorHi;
  const below = cur.c < priorLo;

  // Support / resistance = 7-day local extrema
  const support = Math.min(...lows.slice(-7));
  const resistance = Math.max(...highs.slice(-7));

  // Expected 3-day move = 1σ daily return × √3 × price
  const rets = pctReturns(cs.slice(-14));
  const sigma = rets.length ? stdev(rets) : 0.02;
  const horizon = 3;
  const move = sigma * Math.sqrt(horizon) * cur.c;

  // Behavioral state
  const state = classifyBehavior(closes);
  const stateReason =
    state === "Consolidating"
      ? "Daily ranges are narrow and closes cluster within one ATR of each other."
      : state === "Trending"
        ? "Closes are drifting persistently in one direction with widening range."
        : "Price has stretched away from its 20-day average and is often reverting.";

  // ── setup detection: build a small chronological event log ──
  const events: ChangeLogEvent[] = [];
  const pushEvent = (dayOffset: number, label: string, detail: string, tone: ChangeLogEvent["tone"]) =>
    events.push({ dayOffset, label, detail, tone });

  if (compression < 0.7) pushEvent(-3, "Range compression", "Daily range narrowed by ~30% versus the prior week.", "neutral");
  if (volRatio > 1.4) pushEvent(-1, "Volume expansion", `Latest session volume is ~${((volRatio - 1) * 100).toFixed(0)}% above the 7-day average.`, "positive");
  else if (volRatio < 0.7) pushEvent(-1, "Volume drying up", `Latest session volume is ~${((1 - volRatio) * 100).toFixed(0)}% below the 7-day average.`, "neutral");

  if (above) pushEvent(0, "Range breach — up", `Close cleared the 7-day high at ${priorHi.toFixed(2)}.`, "positive");
  if (below) pushEvent(0, "Range breach — down", `Close fell through the 7-day low at ${priorLo.toFixed(2)}.`, "negative");

  // Momentum divergence check: higher high but weakening RSI-like slope
  const midHigh = highs.slice(-10, -5).reduce((a, b) => Math.max(a, b), -Infinity);
  const lateHigh = Math.max(...highs.slice(-5));
  const midSlope = closes[n - 5] - closes[n - 10] || 0;
  const lateSlope = cur.c - closes[n - 5] || 0;
  if (lateHigh > midHigh && lateSlope < midSlope * 0.5) {
    pushEvent(-1, "Momentum divergence", "Higher high on price without a matching push in short-term momentum.", "negative");
  }

  // Moving average break
  if (closes[n - 2] > s20 && cur.c < s20) pushEvent(0, "20-day break", "Close slipped below the 20-day average for the first time this week.", "negative");
  if (closes[n - 2] < s20 && cur.c > s20) pushEvent(0, "20-day reclaim", "Close reclaimed the 20-day average.", "positive");

  // Retest quality: prior breakout day + low-volume pullback back to prior high
  const breakoutDay = highs.slice(-7, -2).findIndex((h, i, arr) => i > 0 && h > arr[i - 1] * 1.02);
  if (breakoutDay >= 0 && volRatio < 0.9 && Math.abs(cur.c - priorHi) / priorHi < 0.015) {
    pushEvent(0, "Clean retest", "Pullback landed on the prior breakout level with reduced participation.", "positive");
  }

  events.sort((a, b) => a.dayOffset - b.dayOffset);

  // Setup selection
  let setup: SetupSequence;
  if (above && volRatio > 1.2) {
    setup = {
      kind: "Breakout",
      headline: `Bullish breakout sequence — ${symbol} cleared its 7-day range on rising participation`,
      progress: 0.85,
      events,
    };
  } else if (below && lateSlope < 0) {
    setup = {
      kind: "Trend Failure",
      headline: `Trend failure forming — ${symbol} lost the 20-day and its 7-day floor`,
      progress: 0.75,
      events,
    };
  } else if (compression < 0.7 && volRatio < 1.1) {
    setup = {
      kind: "Compression",
      headline: `Volatility compression — ${symbol} is coiling inside a tightening range`,
      progress: 0.5,
      events,
    };
  } else if (Math.abs(cur.c - priorHi) / priorHi < 0.02 && volRatio < 1) {
    setup = {
      kind: "Clean Retest",
      headline: `Clean retest — ${symbol} is holding the prior breakout on lighter volume`,
      progress: 0.6,
      events,
    };
  } else {
    setup = {
      kind: "Compression",
      headline: `${symbol} is drifting inside its recent range — no completed setup`,
      progress: 0.25,
      events,
    };
  }

  // Invalidation line
  let invalidation: StructuralBoundaries["invalidation"];
  if (setup.kind === "Breakout") {
    invalidation = {
      price: priorHi,
      direction: "below",
      reason: `A daily close back below ${priorHi.toFixed(2)} would return price into the prior range and negate the breakout structure.`,
    };
  } else if (setup.kind === "Trend Failure") {
    invalidation = {
      price: s20,
      direction: "above",
      reason: `A daily close back above the 20-day average at ${s20.toFixed(2)} would neutralize the failure sequence.`,
    };
  } else if (setup.kind === "Clean Retest") {
    invalidation = {
      price: support,
      direction: "below",
      reason: `A close below the 7-day low at ${support.toFixed(2)} would invalidate the retest and re-open downside range.`,
    };
  } else {
    invalidation = {
      price: cur.c > s20 ? support : resistance,
      direction: cur.c > s20 ? "below" : "above",
      reason: `A daily close beyond the 7-day ${cur.c > s20 ? "low" : "high"} would break the current range.`,
    };
  }

  // Market state narrative — objective mechanics only
  let marketState: AssetAnalysis["marketState"];
  if (setup.kind === "Compression") {
    marketState = {
      title: "Volatility compression",
      body: "Ranges have contracted for several sessions. Compression phases historically resolve with above-average directional moves once the range breaks.",
    };
  } else if (setup.kind === "Breakout") {
    marketState = {
      title: "Range expansion",
      body: "Price has cleared the prior range on higher volume. Expansion phases tend to persist until price reaches the next objective level or momentum stalls.",
    };
  } else if (setup.kind === "Trend Failure") {
    marketState = {
      title: "Structural break",
      body: "Price has lost the moving-average envelope that supported the prior trend. The market is transitioning from trending to range or reversal behavior.",
    };
  } else {
    marketState = {
      title: "Retest phase",
      body: "Price is testing a prior structural level. Retests hold or fail within a few sessions and set the tone for the next leg.",
    };
  }

  const trigger =
    setup.kind === "Breakout"
      ? `${symbol} completed a Bullish Breakout sequence`
      : setup.kind === "Trend Failure"
        ? `${symbol} triggered a Trend Failure sequence`
        : setup.kind === "Clean Retest"
          ? `${symbol} completed a Clean Retest sequence`
          : null;

  return {
    id,
    symbol,
    behavioralState: state,
    stateReason,
    setup,
    marketState,
    boundaries: {
      support,
      resistance,
      sma20: s20,
      sma50: s50,
      atr: a,
      expectedMove: {
        low: cur.c - move,
        high: cur.c + move,
        horizonDays: horizon,
        method: "1σ of trailing 14-day daily returns × √3",
      },
      invalidation,
    },
    triggerHeadline: trigger,
    candles: cs,
  };
}
