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

// ───────────────────────── Signal types ─────────────────────────

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

// ─────── math helpers (internal) ───────
function _sma(arr: number[], n: number): number {
  const s = arr.slice(-n);
  return s.reduce((a, b) => a + b, 0) / s.length;
}
function _rsi(closes: number[], period = 14): number {
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

// ───── Analysis-based signal derivation ─────────────────────────
import type { AssetAnalysis } from "./analysis";

export function deriveSignalsFromAnalysis(analysis: AssetAnalysis): SignalReading[] {
  const closes = analysis.candles.map((c) => c.c);
  if (closes.length < 2) return [];

  const last = closes[closes.length - 1];
  const { sma20, sma50, support, resistance, atr } = analysis.boundaries;

  // ── Trend ──────────────────────────────────────────────────────
  const s50 = sma50 ?? _sma(closes, Math.min(50, closes.length));
  const above20 = last > sma20;
  const above50 = last > s50;
  const spread = ((last - s50) / s50) * 100;

  const trend: SignalReading =
    above20 && above50 && spread > 1
      ? { key: "trend", label: "Near-term trend", state: "bullish", value: `+${spread.toFixed(2)}% vs 50d`, sentence: "Trend is constructive", meaning: "Price sits above both its short and longer-term averages.", tone: "positive" }
      : !above20 && !above50 && spread < -1
      ? { key: "trend", label: "Near-term trend", state: "bearish", value: `${spread.toFixed(2)}% vs 50d`, sentence: "Trend is weakening", meaning: "Price has slipped below its short and longer-term averages.", tone: "negative" }
      : { key: "trend", label: "Near-term trend", state: "neutral", value: `${spread >= 0 ? "+" : ""}${spread.toFixed(2)}% vs 50d`, sentence: "Trend is range-bound", meaning: "Price is hovering near its averages with no clear direction.", tone: "neutral" };

  // ── Momentum ───────────────────────────────────────────────────
  const r = _rsi(closes);
  const momentum: SignalReading =
    r < 30
      ? { key: "momentum", label: "Momentum", state: "oversold", value: `RSI ${r.toFixed(0)}`, sentence: "Momentum is oversold", meaning: "Selling pressure has stretched — conditions often stabilize from here.", tone: "neutral" }
      : r < 45
      ? { key: "momentum", label: "Momentum", state: "weak", value: `RSI ${r.toFixed(0)}`, sentence: "Momentum is fading", meaning: "Buyers are stepping back; moves lack conviction.", tone: "negative" }
      : r > 70
      ? { key: "momentum", label: "Momentum", state: "overbought", value: `RSI ${r.toFixed(0)}`, sentence: "Momentum is stretched", meaning: "Buying has run hot — short pauses are typical from these levels.", tone: "neutral" }
      : r > 55
      ? { key: "momentum", label: "Momentum", state: "strong", value: `RSI ${r.toFixed(0)}`, sentence: "Momentum is firming", meaning: "Buyers are in control without overheating.", tone: "positive" }
      : { key: "momentum", label: "Momentum", state: "neutral", value: `RSI ${r.toFixed(0)}`, sentence: "Momentum is balanced", meaning: "Neither side is pressing — the tape is at rest.", tone: "neutral" };

  // ── Volume ─────────────────────────────────────────────────────
  const vols = analysis.candles.map((c) => c.v);
  const avgVol = _sma(vols, Math.min(20, vols.length - 1));
  const lastVol = vols[vols.length - 1];
  const volRatio = lastVol / (avgVol || 1);
  const volPct = (volRatio - 1) * 100;
  const volume: SignalReading =
    volRatio > 1.25
      ? { key: "volume", label: "Market activity", state: "strong", value: `+${volPct.toFixed(0)}% vs 20d avg`, sentence: "Participation is strong", meaning: "Trading activity is meaningfully above its recent baseline.", tone: "positive" }
      : volRatio > 1.05
      ? { key: "volume", label: "Market activity", state: "rising", value: `+${volPct.toFixed(0)}% vs 20d avg`, sentence: "Participation is rising", meaning: "Activity is picking up versus the trailing average.", tone: "positive" }
      : volRatio < 0.8
      ? { key: "volume", label: "Market activity", state: "weak", value: `${volPct.toFixed(0)}% vs 20d avg`, sentence: "Participation is thin", meaning: "Few hands are involved — moves carry less weight.", tone: "negative" }
      : { key: "volume", label: "Market activity", state: "steady", value: `${volPct >= 0 ? "+" : ""}${volPct.toFixed(0)}% vs 20d avg`, sentence: "Participation is steady", meaning: "Activity is tracking close to the recent average.", tone: "neutral" };

  // ── Volatility ─────────────────────────────────────────────────
  const atrPct = (atr / last) * 100;
  const recentRanges = analysis.candles.slice(-14).map((c) => c.h - c.l);
  const priorRanges = analysis.candles.slice(-40, -14).map((c) => c.h - c.l);
  const avgRecent = recentRanges.reduce((a, b) => a + b, 0) / (recentRanges.length || 1);
  const avgPrior = priorRanges.reduce((a, b) => a + b, 0) / (priorRanges.length || 1);
  const rangeExpandRatio = avgPrior > 0 ? avgRecent / avgPrior : 1;
  const volatility: SignalReading =
    rangeExpandRatio > 1.25
      ? { key: "volatility", label: "Volatility", state: "expanding", value: `ATR ${atrPct.toFixed(2)}%`, sentence: "Volatility is expanding", meaning: "Daily ranges are widening — expect less predictable moves.", tone: "negative" }
      : atrPct < 1.5
      ? { key: "volatility", label: "Volatility", state: "calm", value: `ATR ${atrPct.toFixed(2)}%`, sentence: "Volatility is calm", meaning: "Price is moving in a tight range — uncertainty is low.", tone: "positive" }
      : atrPct > 4
      ? { key: "volatility", label: "Volatility", state: "high", value: `ATR ${atrPct.toFixed(2)}%`, sentence: "Volatility is high", meaning: "Conditions are unsettled and headlines may move price quickly.", tone: "negative" }
      : { key: "volatility", label: "Volatility", state: "normal", value: `ATR ${atrPct.toFixed(2)}%`, sentence: "Volatility is normal", meaning: "Ranges are in line with the recent regime.", tone: "neutral" };

  // ── Position ───────────────────────────────────────────────────
  const range = resistance - support || 1;
  const pos = (last - support) / range;
  const position: SignalReading =
    pos < 0.15
      ? { key: "position", label: "Position", state: "near support", value: `${(pos * 100).toFixed(0)}% of range`, sentence: "Price sits near support", meaning: "Trading close to the structural support.", tone: "positive" }
      : pos < 0.4
      ? { key: "position", label: "Position", state: "lower range", value: `${(pos * 100).toFixed(0)}% of range`, sentence: "Price is in the lower range", meaning: "Below the midpoint, closer to support.", tone: "neutral" }
      : pos > 0.85
      ? { key: "position", label: "Position", state: "near resistance", value: `${(pos * 100).toFixed(0)}% of range`, sentence: "Price is testing resistance", meaning: "Trading close to structural resistance.", tone: "negative" }
      : pos > 0.6
      ? { key: "position", label: "Position", state: "upper range", value: `${(pos * 100).toFixed(0)}% of range`, sentence: "Price holds the upper range", meaning: "Above the midpoint, with resistance overhead.", tone: "neutral" }
      : { key: "position", label: "Position", state: "mid-range", value: `${(pos * 100).toFixed(0)}% of range`, sentence: "Price is mid-range", meaning: "Sitting in the middle of the recent range — no edge either way.", tone: "neutral" };

  return [trend, momentum, volume, volatility, position];
}

/**
 * Compose the five signals into one calm interpretation paragraph.
 * Built from daily candle data — not the 7-day sparkline.
 */
export function deriveTruthFromAnalysis(analysis: AssetAnalysis): string {
  if (analysis.candles.length < 2) return "";
  const s = deriveSignalsFromAnalysis(analysis);
  if (s.length === 0) return "";
  const by = Object.fromEntries(s.map((x) => [x.key, x])) as Record<SignalKey, SignalReading>;

  let lead: string;
  if (by.trend.state === "bullish" && by.momentum.state === "strong") {
    lead = `${analysis.symbol} is trending higher with firm momentum`;
  } else if (by.trend.state === "bullish" && by.momentum.state === "overbought") {
    lead = `${analysis.symbol} is extended after a constructive run`;
  } else if (by.trend.state === "bearish" && by.momentum.state === "oversold") {
    lead = `${analysis.symbol} is stretched to the downside`;
  } else if (by.trend.state === "bearish" && by.momentum.state === "weak") {
    lead = `${analysis.symbol} is drifting lower without conviction`;
  } else if (by.trend.state === "neutral" && by.momentum.state === "oversold") {
    lead = `${analysis.symbol} is consolidating with mild oversold conditions`;
  } else if (by.trend.state === "neutral" && by.momentum.state === "overbought") {
    lead = `${analysis.symbol} is consolidating after a stretched move`;
  } else if (by.trend.state === "bullish") {
    lead = `${analysis.symbol} is holding a constructive tone`;
  } else if (by.trend.state === "bearish") {
    lead = `${analysis.symbol} is leaning softer`;
  } else {
    lead = `${analysis.symbol} is range-bound`;
  }

  const vol =
    by.volume.state === "strong"
      ? "and participation is meaningfully above its baseline"
      : by.volume.state === "rising"
        ? "with participation picking up"
        : by.volume.state === "weak"
          ? "though participation remains thin"
          : "with steady participation";

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
