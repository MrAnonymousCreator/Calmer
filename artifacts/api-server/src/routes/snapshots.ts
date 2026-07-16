import { Router } from "express";
import { getSupabase, type SnapshotRow } from "../lib/supabase.js";
import { captureDailySnapshots } from "../lib/capture.js";

const router = Router();

type DailySnapshot = {
  date: string;
  symbol: string;
  close: number;
  rsi: number;
  trendState: string;
  volatilityState: string;
  truthProse: string;
  setupKind: string;
  capturedAt: string;
};

type WeeklySummary = {
  assetId: string;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  netChange: number;
  netChangePct: number;
  biggestMoveDate: string;
  biggestMovePct: number;
  elevatedDays: number;
  stableDays: number;
  trendDirection: "up" | "down" | "flat";
  days: DailySnapshot[];
};

function toApi(row: SnapshotRow): DailySnapshot {
  return {
    date: row.date,
    symbol: row.symbol,
    close: Number(row.close),
    rsi: Number(row.rsi),
    trendState: row.trend_state,
    volatilityState: row.volatility_state,
    truthProse: row.truth_prose,
    setupKind: row.setup_kind,
    capturedAt: row.captured_at,
  };
}

router.get("/snapshots/:assetId", async (req, res) => {
  const { assetId } = req.params;
  if (!assetId) {
    res.status(400).json({ error: "assetId is required" });
    return;
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 30, 90);

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("daily_snapshots")
      .select("*")
      .eq("asset_id", assetId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const snapshots = (data as SnapshotRow[]).map(toApi);
    res.json({ assetId, snapshots });
  } catch (err) {
    req.log.warn({ err, assetId }, "Failed to fetch snapshots");
    res.status(502).json({ error: "Failed to fetch snapshots" });
  }
});

router.get("/snapshots/:assetId/weekly", async (req, res) => {
  const { assetId } = req.params;
  if (!assetId) {
    res.status(400).json({ error: "assetId is required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("daily_snapshots")
      .select("*")
      .eq("asset_id", assetId)
      .order("date", { ascending: false })
      .limit(7);

    if (error) throw error;

    const rows = (data as SnapshotRow[]).map(toApi).reverse(); // oldest → newest

    if (rows.length === 0) {
      res.json({
        assetId,
        startDate: "",
        endDate: "",
        startPrice: 0,
        endPrice: 0,
        netChange: 0,
        netChangePct: 0,
        biggestMoveDate: "",
        biggestMovePct: 0,
        elevatedDays: 0,
        stableDays: 0,
        trendDirection: "flat",
        days: [],
      } satisfies WeeklySummary);
      return;
    }

    const startPrice = rows[0].close;
    const endPrice = rows[rows.length - 1].close;
    const netChange = endPrice - startPrice;
    const netChangePct = startPrice ? (netChange / startPrice) * 100 : 0;

    let biggestMovePct = 0;
    let biggestMoveDate = rows[0].date;
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].close;
      const cur = rows[i].close;
      const pct = prev ? Math.abs((cur - prev) / prev) * 100 : 0;
      if (pct > biggestMovePct) {
        biggestMovePct = (cur - prev) / prev * 100;
        biggestMoveDate = rows[i].date;
      }
    }

    const elevatedDays = rows.filter((r) => r.volatilityState === "elevated").length;
    const stableDays = rows.filter((r) => r.volatilityState === "stable").length;

    const trendDirection: WeeklySummary["trendDirection"] =
      Math.abs(netChangePct) < 1 ? "flat" : netChangePct > 0 ? "up" : "down";

    const summary: WeeklySummary = {
      assetId,
      startDate: rows[0].date,
      endDate: rows[rows.length - 1].date,
      startPrice,
      endPrice,
      netChange,
      netChangePct,
      biggestMoveDate,
      biggestMovePct,
      elevatedDays,
      stableDays,
      trendDirection,
      days: rows,
    };

    res.json(summary);
  } catch (err) {
    req.log.warn({ err, assetId }, "Failed to fetch weekly summary");
    res.status(502).json({ error: "Failed to fetch weekly summary" });
  }
});

router.post("/snapshots/capture", async (req, res) => {
  try {
    const result = await captureDailySnapshots();
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Manual capture failed");
    res.status(500).json({ error: "Capture failed" });
  }
});

export default router;
