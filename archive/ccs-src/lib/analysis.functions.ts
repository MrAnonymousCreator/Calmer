import { createServerFn } from "@tanstack/react-start";
import { analyzeCandles, bucketToDaily, type AssetAnalysis } from "./analysis";

type MarketChart = {
  prices: [number, number][];
  total_volumes: [number, number][];
};

const CACHE_TTL_MS = 5 * 60_000;
type Entry = { ts: number; data: AssetAnalysis };
const cache = new Map<string, Entry>();

async function fetchAnalysis(id: string, symbol: string): Promise<AssetAnalysis> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const host = apiKey ? "https://pro-api.coingecko.com" : "https://api.coingecko.com";
  const url = `${host}/api/v3/coins/${id}/market_chart?vs_currency=usd&days=14`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-cg-pro-api-key"] = apiKey;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`CoinGecko market_chart ${res.status}`);
  const raw = (await res.json()) as MarketChart;
  const candles = bucketToDaily(raw.prices ?? [], raw.total_volumes ?? []);
  if (candles.length < 5) throw new Error("Not enough candle history to analyze");
  return analyzeCandles(id, symbol, candles);
}

export const getAssetAnalysis = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; symbol: string }) => data)
  .handler(async ({ data }) => {
    const key = data.id;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && now - hit.ts < CACHE_TTL_MS) return { analysis: hit.data, cachedAt: hit.ts };
    try {
      const analysis = await fetchAnalysis(data.id, data.symbol);
      cache.set(key, { ts: now, data: analysis });
      return { analysis, cachedAt: now };
    } catch (err) {
      if (hit) return { analysis: hit.data, cachedAt: hit.ts };
      throw err;
    }
  });
