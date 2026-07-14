export type Asset = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  sparkline: number[];
  about: string;
};

function gen(seed: number, base: number, vol: number, n = 60): number[] {
  let s = seed;
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = v * (1 + r * vol);
    out.push(v);
  }
  return out;
}

export const assets: Asset[] = [
  {
    id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 71248.32, change24h: 2.14,
    marketCap: 1_402_000_000_000, volume: 28_400_000_000,
    sparkline: gen(11, 68000, 0.012),
    about: "The original peer-to-peer digital currency. A scarce, decentralized store of value.",
  },
  {
    id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3812.05, change24h: 1.42,
    marketCap: 458_200_000_000, volume: 14_800_000_000,
    sparkline: gen(23, 3650, 0.014),
    about: "A programmable settlement layer powering smart contracts and decentralized applications.",
  },
  {
    id: "solana", symbol: "SOL", name: "Solana", price: 184.21, change24h: -0.86,
    marketCap: 84_300_000_000, volume: 3_100_000_000,
    sparkline: gen(31, 190, 0.02),
    about: "A high-throughput blockchain optimized for low-latency consumer applications.",
  },
  {
    id: "cardano", symbol: "ADA", name: "Cardano", price: 0.612, change24h: 0.34,
    marketCap: 21_700_000_000, volume: 540_000_000,
    sparkline: gen(47, 0.6, 0.018),
    about: "A research-driven proof-of-stake network focused on sustainability and formal methods.",
  },
  {
    id: "chainlink", symbol: "LINK", name: "Chainlink", price: 18.94, change24h: 3.21,
    marketCap: 11_200_000_000, volume: 480_000_000,
    sparkline: gen(53, 18, 0.022),
    about: "Decentralized oracle infrastructure connecting smart contracts to real-world data.",
  },
  {
    id: "matic-network", symbol: "MATIC", name: "Polygon", price: 0.748, change24h: -1.92,
    marketCap: 7_300_000_000, volume: 320_000_000,
    sparkline: gen(67, 0.78, 0.02),
    about: "An Ethereum scaling ecosystem of zero-knowledge rollups and sidechains.",
  },
  {
    id: "polkadot", symbol: "DOT", name: "Polkadot", price: 7.21, change24h: 0.92,
    marketCap: 9_800_000_000, volume: 210_000_000,
    sparkline: gen(73, 7, 0.018),
    about: "A multi-chain protocol enabling interoperability between specialized blockchains.",
  },
  {
    id: "avalanche-2", symbol: "AVAX", name: "Avalanche", price: 36.58, change24h: 1.78,
    marketCap: 14_100_000_000, volume: 410_000_000,
    sparkline: gen(89, 35, 0.021),
    about: "A platform of customizable subnets with sub-second finality.",
  },
  {
    id: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash", price: 421.10, change24h: 0.42,
    marketCap: 8_300_000_000, volume: 190_000_000,
    sparkline: gen(97, 415, 0.016),
    about: "A Bitcoin fork prioritizing larger blocks and lower transaction fees.",
  },
  {
    id: "bittensor", symbol: "TAO", name: "Bittensor", price: 412.87, change24h: 4.12,
    marketCap: 3_100_000_000, volume: 180_000_000,
    sparkline: gen(101, 400, 0.025),
    about: "A decentralized network coordinating machine intelligence as a market.",
  },
];

export type TickerItem = { tag: string; text: string };

export const news: TickerItem[] = [
  { tag: "Momentum", text: "BTC participation remains stable during the US session" },
  { tag: "Momentum", text: "ETH momentum improving gradually as flows return to L2s" },
  { tag: "Volume", text: "SOL volatility cooling near resistance" },
  { tag: "Risk", text: "Selling pressure weakening across large-cap assets" },
  { tag: "Regulation", text: "EU finalizes MiCA implementation guidance" },
  { tag: "DeFi", text: "Stablecoin supply expands for the seventh straight week" },
  { tag: "Volume", text: "Spot ETF inflows resume at a measured pace" },
  { tag: "Momentum", text: "LINK leads sector breadth without parabolic extension" },
  { tag: "Risk", text: "Treasury yields ease, risk assets steady into the close" },
];

// ───────────────────────── Truth Engine ─────────────────────────

export type SignalKey = "trend" | "momentum" | "volume" | "volatility" | "position";
export type Tone = "positive" | "negative" | "neutral";

export type SignalReading = {
  key: SignalKey;
  label: string;
  state: string;
  /** Short raw value, e.g. "RSI 31" or "+18% vs 20d" */
  value: string;
  /** One-line plain-language phrase */
  sentence: string;
  /** One-line "what this means" note shown on expand */
  meaning: string;
  tone: Tone;
};

function sma(arr: number[], n: number): number {
  const s = arr.slice(-n);
  return s.reduce((a, b) => a + b, 0) / s.length;
}

function rsi(arr: number[], period = 14): number {
  if (arr.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = arr.length - period; i < arr.length; i++) {
    const d = arr[i] - arr[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function stdev(arr: number[]): number {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}

function computeTrend(spark: number[]): SignalReading {
  const last = spark[spark.length - 1];
  const s20 = sma(spark, 20);
  const s50 = sma(spark, Math.min(50, spark.length));
  const above20 = last > s20;
  const above50 = last > s50;
  const spread = ((last - s50) / s50) * 100;
  let state: string;
  let tone: Tone;
  let sentence: string;
  let meaning: string;
  if (above20 && above50 && spread > 1) {
    state = "bullish";
    tone = "positive";
    sentence = "Trend is constructive";
    meaning = "Price sits above both its short and longer-term averages.";
  } else if (!above20 && !above50 && spread < -1) {
    state = "bearish";
    tone = "negative";
    sentence = "Trend is weakening";
    meaning = "Price has slipped below its short and longer-term averages.";
  } else {
    state = "neutral";
    tone = "neutral";
    sentence = "Trend is range-bound";
    meaning = "Price is hovering near its averages with no clear direction.";
  }
  return {
    key: "trend",
    label: "Near-term trend",
    state,
    value: `${spread >= 0 ? "+" : ""}${spread.toFixed(2)}% vs 50d`,
    sentence,
    meaning,
    tone,
  };
}

function computeMomentum(spark: number[]): SignalReading {
  const r = rsi(spark);
  let state: string;
  let tone: Tone;
  let sentence: string;
  let meaning: string;
  if (r < 30) {
    state = "oversold";
    tone = "neutral";
    sentence = "Momentum is oversold";
    meaning = "Selling pressure has stretched — conditions often stabilize from here.";
  } else if (r < 45) {
    state = "weak";
    tone = "negative";
    sentence = "Momentum is fading";
    meaning = "Buyers are stepping back; moves lack conviction.";
  } else if (r > 70) {
    state = "overbought";
    tone = "neutral";
    sentence = "Momentum is stretched";
    meaning = "Buying has run hot — short pauses are typical from these levels.";
  } else if (r > 55) {
    state = "strong";
    tone = "positive";
    sentence = "Momentum is firming";
    meaning = "Buyers are in control without overheating.";
  } else {
    state = "neutral";
    tone = "neutral";
    sentence = "Momentum is balanced";
    meaning = "Neither side is pressing — the tape is at rest.";
  }
  return {
    key: "momentum",
    label: "Momentum",
    state,
    value: `RSI ${r.toFixed(0)}`,
    sentence,
    meaning,
    tone,
  };
}

function computeVolume(asset: Pick<Asset, "volume" | "marketCap">): SignalReading {
  // Synthesize a "20d average" from a stable ratio of market cap.
  const avg = asset.marketCap * 0.018;
  const ratio = asset.volume / avg;
  const pct = (ratio - 1) * 100;
  let state: string;
  let tone: Tone;
  let sentence: string;
  let meaning: string;
  if (ratio > 1.25) {
    state = "strong";
    tone = "positive";
    sentence = "Participation is strong";
    meaning = "Trading activity is meaningfully above its recent baseline.";
  } else if (ratio > 1.05) {
    state = "rising";
    tone = "positive";
    sentence = "Participation is rising";
    meaning = "Activity is picking up versus the trailing average.";
  } else if (ratio < 0.8) {
    state = "weak";
    tone = "negative";
    sentence = "Participation is thin";
    meaning = "Few hands are involved — moves carry less weight.";
  } else {
    state = "steady";
    tone = "neutral";
    sentence = "Participation is steady";
    meaning = "Activity is tracking close to the recent average.";
  }
  return {
    key: "volume",
    label: "Market activity",
    state,
    value: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs 20d avg (vol/mcap)`,
    sentence,
    meaning,
    tone,
  };
}

function computeVolatility(spark: number[]): SignalReading {
  const recent = spark.slice(-20);
  const prior = spark.slice(-40, -20);
  const rNow = stdev(recent) / (recent.reduce((a, b) => a + b, 0) / recent.length);
  const rPrev = stdev(prior) / (prior.reduce((a, b) => a + b, 0) / prior.length);
  const ratio = rNow / rPrev;
  let state: string;
  let tone: Tone;
  let sentence: string;
  let meaning: string;
  if (rNow < 0.012) {
    state = "calm";
    tone = "positive";
    sentence = "Volatility is calm";
    meaning = "Price is moving in a tight range — uncertainty is low.";
  } else if (ratio > 1.25) {
    state = "expanding";
    tone = "negative";
    sentence = "Volatility is expanding";
    meaning = "Daily ranges are widening — expect less predictable moves.";
  } else if (rNow > 0.025) {
    state = "high";
    tone = "negative";
    sentence = "Volatility is high";
    meaning = "Conditions are unsettled and headlines may move price quickly.";
  } else {
    state = "normal";
    tone = "neutral";
    sentence = "Volatility is normal";
    meaning = "Ranges are in line with the recent regime.";
  }
  return {
    key: "volatility",
    label: "Volatility",
    state,
    value: `${(rNow * 100).toFixed(2)}% daily`,
    sentence,
    meaning,
    tone,
  };
}

function computePosition(spark: number[]): SignalReading {
  const last = spark[spark.length - 1];
  const hi = Math.max(...spark);
  const lo = Math.min(...spark);
  const pct = (last - lo) / (hi - lo);
  let state: string;
  let tone: Tone;
  let sentence: string;
  let meaning: string;
  if (pct < 0.15) {
    state = "near support";
    tone = "positive";
    sentence = "Price sits near support";
    meaning = "Trading close to the bottom of the recent range.";
  } else if (pct < 0.4) {
    state = "lower range";
    tone = "neutral";
    sentence = "Price is in the lower range";
    meaning = "Below the midpoint of the recent range, closer to support.";
  } else if (pct > 0.85) {
    state = "near resistance";
    tone = "negative";
    sentence = "Price is testing resistance";
    meaning = "Trading close to the top of the recent range.";
  } else if (pct > 0.6) {
    state = "upper range";
    tone = "neutral";
    sentence = "Price holds the upper range";
    meaning = "Above the midpoint, with resistance overhead.";
  } else {
    state = "mid-range";
    tone = "neutral";
    sentence = "Price is mid-range";
    meaning = "Sitting in the middle of the recent range — no edge either way.";
  }
  return {
    key: "position",
    label: "Position",
    state,
    value: `${(pct * 100).toFixed(0)}% of range`,
    sentence,
    meaning,
    tone,
  };
}

export function readSignals(asset: Asset): SignalReading[] {
  return [
    computeTrend(asset.sparkline),
    computeMomentum(asset.sparkline),
    computeVolume(asset),
    computeVolatility(asset.sparkline),
    computePosition(asset.sparkline),
  ];
}

/**
 * Compose the five signals into one calm interpretation paragraph.
 * Deterministic — priority-ordered clauses, joined with soft connectors.
 */
export function buildTruth(asset: Asset): string {
  const s = readSignals(asset);
  const by = Object.fromEntries(s.map((x) => [x.key, x])) as Record<SignalKey, SignalReading>;

  // Lead clause — trend + momentum read together
  let lead: string;
  if (by.trend.state === "bullish" && by.momentum.state === "strong") {
    lead = `${asset.name} is trending higher with firm momentum`;
  } else if (by.trend.state === "bullish" && by.momentum.state === "overbought") {
    lead = `${asset.name} is extended after a constructive run`;
  } else if (by.trend.state === "bearish" && by.momentum.state === "oversold") {
    lead = `${asset.name} is stretched to the downside`;
  } else if (by.trend.state === "bearish" && by.momentum.state === "weak") {
    lead = `${asset.name} is drifting lower without conviction`;
  } else if (by.trend.state === "neutral" && by.momentum.state === "oversold") {
    lead = `${asset.name} is consolidating with mild oversold conditions`;
  } else if (by.trend.state === "neutral" && by.momentum.state === "overbought") {
    lead = `${asset.name} is consolidating after a stretched move`;
  } else if (by.trend.state === "bullish") {
    lead = `${asset.name} is holding a constructive tone`;
  } else if (by.trend.state === "bearish") {
    lead = `${asset.name} is leaning softer`;
  } else {
    lead = `${asset.name} is range-bound`;
  }

  // Support clause — volume tells us how much to weight the move
  const vol =
    by.volume.state === "strong"
      ? "and participation is meaningfully above its baseline"
      : by.volume.state === "rising"
        ? "with participation picking up"
        : by.volume.state === "weak"
          ? "though participation remains thin"
          : "with steady participation";

  // Closing clause — volatility + position frame the risk
  const close =
    by.volatility.state === "expanding"
      ? `Ranges are widening, and price ${by.position.sentence.replace(/^Price /, "")}.`
      : by.volatility.state === "calm"
        ? `Volatility is calm and price ${by.position.sentence.replace(/^Price /, "")}.`
        : `Conditions are orderly and price ${by.position.sentence.replace(/^Price /, "")}.`;

  return `${lead} ${vol}. ${close}`;
}

export type Story = {
  title: string;
  source: string;
  minutes: number;
  excerpt: string;
  body: string;
};

export const stories: Story[] = [
  {
    title: "ETF flows return at a measured pace",
    source: "Markets Desk",
    minutes: 4,
    excerpt:
      "Spot product inflows resumed this week, though the cadence remains restrained compared to the spring peak.",
    body: "Allocators continue to add exposure incrementally rather than in bursts. The pattern points to portfolio rebalancing rather than speculative positioning, and aligns with the steadier intraday tape observed since late last month.",
  },
  {
    title: "Layer-2 activity quietly hits a new high",
    source: "On-Chain Notes",
    minutes: 6,
    excerpt:
      "Aggregate L2 transactions touched a fresh monthly high, led by consumer-oriented chains.",
    body: "Daily active addresses across major rollups rose without a corresponding fee spike, suggesting organic usage rather than incentive-driven activity. Settlement costs on the base layer remained muted.",
  },
  {
    title: "Stablecoin supply expands for a seventh week",
    source: "Liquidity Watch",
    minutes: 3,
    excerpt:
      "Net stablecoin issuance continued, a quiet but persistent tailwind for risk assets.",
    body: "The expansion has been led by USD-denominated tokens on high-throughput networks. Historically, sustained issuance through low-volatility regimes has coincided with broader market participation rather than concentrated rallies.",
  },
];

export type CalendarDay = { date: number; tone: "positive" | "negative" | "neutral"; change: number };

export function buildCalendar(seed = 7): CalendarDay[] {
  let s = seed;
  const days: CalendarDay[] = [];
  for (let i = 1; i <= 30; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    const change = +(r * 6).toFixed(2);
    const tone: CalendarDay["tone"] =
      change > 0.6 ? "positive" : change < -0.6 ? "negative" : "neutral";
    days.push({ date: i, tone, change });
  }
  return days;
}

export function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

export function formatBig(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}
