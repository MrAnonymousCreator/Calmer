import { Router } from "express";
import {
  analyzeCandles,
  bucketToDaily,
  type AssetAnalysis,
} from "../lib/analysis.js";

const router = Router();

type MarketChart = {
  prices: [number, number][];
  total_volumes: [number, number][];
};

const CACHE_TTL_MS = 5 * 60_000;
type Entry = { ts: number; data: AssetAnalysis };
const cache = new Map<string, Entry>();

async function fetchAnalysis(
  id: string,
  symbol: string,
): Promise<AssetAnalysis> {
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
  const candles = bucketToDaily(raw.prices ?? [], raw.total_volumes ?? []);
  if (candles.length < 5)
    throw new Error("Not enough candle history to analyze");

  return analyzeCandles(id, symbol, candles);
}

router.get("/analysis/:id/:symbol", async (req, res) => {
  const { id, symbol } = req.params;
  if (!id || !symbol) {
    res.status(400).json({ error: "id and symbol are required" });
    return;
  }

  const key = id;
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && now - hit.ts < CACHE_TTL_MS) {
    res.json({ analysis: hit.data, cachedAt: hit.ts });
    return;
  }

  try {
    const analysis = await fetchAnalysis(id, symbol.toUpperCase());
    cache.set(key, { ts: now, data: analysis });
    res.json({ analysis, cachedAt: now });
  } catch (err) {
    req.log.warn({ err, id }, "CoinGecko analysis fetch failed");
    if (hit) {
      res.json({ analysis: hit.data, cachedAt: hit.ts });
    } else {
      res.status(502).json({ error: "Failed to fetch analysis data" });
    }
  }
});

export default router;
