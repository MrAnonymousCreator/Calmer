import { Router } from "express";

const router = Router();

type CGCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  market_cap: number;
  total_volume: number;
  circulating_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  sparkline_in_7d?: { price: number[] };
};

const ABOUT: Record<string, string> = {
  bitcoin: "The original peer-to-peer digital currency. A scarce, decentralized store of value.",
  ethereum: "A programmable settlement layer powering smart contracts and decentralized applications.",
  solana: "A high-throughput blockchain optimized for low-latency consumer applications.",
  cardano: "A research-driven proof-of-stake network focused on sustainability and formal methods.",
  chainlink: "Decentralized oracle infrastructure connecting smart contracts to real-world data.",
  "matic-network": "An Ethereum scaling ecosystem of zero-knowledge rollups and sidechains.",
  polkadot: "A multi-chain protocol enabling interoperability between specialized blockchains.",
  "avalanche-2": "A platform of customizable subnets with sub-second finality.",
  "bitcoin-cash": "A Bitcoin fork prioritizing larger blocks and lower transaction fees.",
  bittensor: "A decentralized network coordinating machine intelligence as a market.",
};

type AssetShape = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  circulatingSupply: number | null;
  ath: number | null;
  athChangePercentage: number | null;
  sparkline: number[];
  about: string;
};

type Cache = { ts: number; data: AssetShape[] };
let cache: Cache | null = null;
const CACHE_TTL_MS = 60_000;

async function fetchFromCoinGecko(): Promise<AssetShape[]> {
  const apiKey = process.env.COINGECKO_API_KEY;
  const host = apiKey
    ? "https://pro-api.coingecko.com"
    : "https://api.coingecko.com";
  const url =
    `${host}/api/v3/coins/markets` +
    `?vs_currency=usd&order=market_cap_desc&per_page=15&page=1` +
    `&sparkline=true&price_change_percentage=24h` +
    `&precision=full`;

  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-cg-pro-api-key"] = apiKey;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`CoinGecko upstream ${res.status}`);

  const data = (await res.json()) as CGCoin[];
  return data.map((c) => ({
    id: c.id,
    symbol: (c.symbol ?? "").toUpperCase(),
    name: c.name,
    price: c.current_price ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap ?? 0,
    volume: c.total_volume ?? 0,
    circulatingSupply: c.circulating_supply ?? null,
    ath: c.ath ?? null,
    athChangePercentage: c.ath_change_percentage ?? null,
    sparkline:
      c.sparkline_in_7d?.price && c.sparkline_in_7d.price.length > 0
        ? c.sparkline_in_7d.price
        : [c.current_price ?? 1],
    about:
      ABOUT[c.id] ??
      `${c.name} is a digital asset tracked across major venues.`,
  }));
}

router.get("/markets", async (req, res) => {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    res.json({ assets: cache.data, cachedAt: cache.ts });
    return;
  }
  try {
    const assets = await fetchFromCoinGecko();
    cache = { ts: now, data: assets };
    res.json({ assets, cachedAt: now });
  } catch (err) {
    req.log.warn({ err }, "CoinGecko markets fetch failed");
    if (cache) {
      res.json({ assets: cache.data, cachedAt: cache.ts });
    } else {
      res.status(502).json({ error: "Failed to fetch market data" });
    }
  }
});

export default router;
