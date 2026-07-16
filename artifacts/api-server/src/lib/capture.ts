import { getSupabase, type SnapshotRow } from "./supabase.js";
import { analyzeCandles, bucketToDaily, type Candle } from "./analysis.js";
import { logger } from "./logger.js";

const TRACKED_ASSETS = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "solana", symbol: "SOL" },
  { id: "cardano", symbol: "ADA" },
  { id: "chainlink", symbol: "LINK" },
  { id: "matic-network", symbol: "MATIC" },
  { id: "polkadot", symbol: "DOT" },
  { id: "avalanche-2", symbol: "AVAX" },
  { id: "bitcoin-cash", symbol: "BCH" },
  { id: "bittensor", symbol: "TAO" },
];

type MarketChart = {
  prices: [number, number][];
  total_volumes: [number, number][];
};

async function fetchCandles(id: string): Promise<Candle[]> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const host = apiKey
    ? "https://pro-api.coingecko.com"
    : "https://api.coingecko.com";
  const url = `${host}/api/v3/coins/${id}/market_chart?vs_currency=usd&days=14`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-cg-pro-api-key"] = apiKey;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`CoinGecko market_chart ${res.status}`);

  const raw = (await res.json()) as MarketChart;
  return bucketToDaily(raw.prices ?? [], raw.total_volumes ?? []);
}

function computeRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  const ag = gains / period;
  const al = losses / period;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

function volatilityState(candles: Candle[]): "elevated" | "stable" {
  if (candles.length < 2) return "stable";
  const last = candles[candles.length - 1];
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    trs.push(Math.max(cur.h - cur.l, Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c)));
  }
  const atr = trs.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, trs.length);
  return atr / last.c > 0.04 ? "elevated" : "stable";
}

export async function captureDailySnapshots(): Promise<{
  captured: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = getSupabase();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  let captured = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const asset of TRACKED_ASSETS) {
    try {
      const candles = await fetchCandles(asset.id);
      if (candles.length < 5) {
        skipped++;
        continue;
      }

      const analysis = analyzeCandles(asset.id, asset.symbol, candles);
      const lastCandle = candles[candles.length - 1];
      const closes = candles.map((c) => c.c);

      const truthProse = `${analysis.marketState.title}: ${analysis.marketState.body} ${analysis.setup.headline}`;

      const row = {
        asset_id: asset.id,
        date: todayStr,
        symbol: asset.symbol,
        close: lastCandle.c,
        rsi: computeRsi(closes),
        trend_state: analysis.behavioralState,
        volatility_state: volatilityState(candles),
        truth_prose: truthProse,
        setup_kind: analysis.setup.kind,
      };

      const { error } = await supabase
        .from("daily_snapshots")
        .upsert(row, { onConflict: "asset_id,date" })
        .eq("asset_id", asset.id)
        .eq("date", todayStr);

      if (error) {
        logger.warn({ err: error, asset: asset.id }, "Snapshot upsert failed");
        errors.push(`${asset.id}: ${error.message}`);
      } else {
        captured++;
      }
    } catch (err) {
      logger.warn({ err, asset: asset.id }, "Snapshot capture failed");
      errors.push(`${asset.id}: ${(err as Error).message}`);
      skipped++;
    }
  }

  logger.info({ captured, skipped, errors: errors.length }, "Daily snapshot capture complete");
  return { captured, skipped, errors };
}

let captureTimer: ReturnType<typeof setInterval> | null = null;
let isCapturing = false;

export function startDailyCaptureJob(intervalMs = 60 * 60 * 1000): void {
  if (captureTimer) return;

  const run = async () => {
    if (isCapturing) return;
    isCapturing = true;
    try {
      const now = new Date();
      const utcHour = now.getUTCHours();
      // Only run the actual capture between 00:00 and 01:00 UTC
      // (after daily market data settles). The hourly interval acts as
      // a safety net so it retries if the first attempt fails.
      if (utcHour !== 0) return;

      logger.info("Starting scheduled daily snapshot capture");
      await captureDailySnapshots();
    } catch (err) {
      logger.error({ err }, "Daily capture job error");
    } finally {
      isCapturing = false;
    }
  };

  captureTimer = setInterval(run, intervalMs);
  logger.info({ intervalMs }, "Daily capture job scheduled");
}

export function stopDailyCaptureJob(): void {
  if (captureTimer) {
    clearInterval(captureTimer);
    captureTimer = null;
  }
}
