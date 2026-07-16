import { Router } from "express";

const router = Router();

type ChartPoint = { t: number; p: number };

type ChartResponse = {
  id: string;
  range: string;
  points: ChartPoint[];
  low: number;
  high: number;
};

const RANGE_DAYS: Record<string, number> = {
  "1H": 1,
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "1Y": 365,
  ALL: 365 * 5,
};

const RANGE_INTERVAL: Record<string, string> = {
  "1H": "",
  "1D": "",
  "1W": "",
  "1M": "daily",
  "1Y": "daily",
  ALL: "daily",
};

const CACHE_TTL_MS = 5 * 60_000;
type Entry = { ts: number; data: ChartResponse };
const cache = new Map<string, Entry>();

async function fetchChart(id: string, range: string): Promise<ChartResponse> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const host = apiKey
    ? "https://pro-api.coingecko.com"
    : "https://api.coingecko.com";

  const days = RANGE_DAYS[range] ?? 30;
  const interval = RANGE_INTERVAL[range];
  const intervalParam = interval ? `&interval=${interval}` : "";

  const url = `${host}/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}${intervalParam}`;

  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-cg-pro-api-key"] = apiKey;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`CoinGecko market_chart ${res.status}`);

  const raw = (await res.json()) as { prices: [number, number][] };
  const points: ChartPoint[] = (raw.prices ?? []).map(([t, p]) => ({ t, p }));

  let low = Infinity;
  let high = -Infinity;
  for (const pt of points) {
    if (pt.p < low) low = pt.p;
    if (pt.p > high) high = pt.p;
  }
  if (!points.length) {
    low = 0;
    high = 0;
  }

  return { id, range, points, low, high };
}

router.get("/chart/:id/:range", async (req, res) => {
  const { id, range } = req.params;
  if (!id || !range) {
    res.status(400).json({ error: "id and range are required" });
    return;
  }
  if (!(range in RANGE_DAYS)) {
    res.status(400).json({ error: `unsupported range: ${range}` });
    return;
  }

  const key = `${id}:${range}`;
  const now = Date.now();
  const hit = cache.get(key);

  if (hit && now - hit.ts < CACHE_TTL_MS) {
    res.json(hit.data);
    return;
  }

  try {
    const data = await fetchChart(id, range);
    cache.set(key, { ts: now, data });
    res.json(data);
  } catch (err) {
    req.log.warn({ err, id, range }, "CoinGecko chart fetch failed");
    if (hit) {
      res.json(hit.data);
    } else {
      res.status(502).json({ error: "Failed to fetch chart data" });
    }
  }
});

export default router;
