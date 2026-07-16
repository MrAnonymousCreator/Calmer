/*
# Create daily_snapshots table

1. Purpose
- Stores one captured snapshot per tracked asset per UTC day.
- The scheduled capture job runs `analyzeCandles` for each asset and writes
  a single row: close price, RSI, trend state, volatility state, and the
  truth-prose reconstruction sentence for that day.
- This is a historical record — once captured it does not change, so users
  can "look back at Tuesday" and see what Tuesday actually looked like.

2. New Tables
- `daily_snapshots`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `asset_id` (text, not null) — CoinGecko coin id, e.g. "bitcoin"
  - `date` (date, not null) — the UTC day this snapshot represents (start-of-day)
  - `symbol` (text, not null) — trading symbol, e.g. "BTC"
  - `close` (numeric, not null) — closing price in USD for that day
  - `rsi` (numeric, not null) — Wilder RSI(14) computed from the trailing 14-day closes
  - `trend_state` (text, not null) — behavioral state: "Consolidating" | "Trending" | "Mean Reversion"
  - `volatility_state` (text, not null) — "elevated" | "stable" (derived from ATR / price ratio)
  - `truth_prose` (text, not null) — the one-sentence reconstruction for that day (marketState body + setup headline)
  - `setup_kind` (text, not null) — setup type: "Breakout" | "Trend Failure" | "Clean Retest" | "Compression"
  - `captured_at` (timestamptz, not null, default now()) — when the snapshot was written

3. Constraints
- UNIQUE (asset_id, date) — one row per asset per day. The capture job upserts on this.
- Index on (asset_id, date DESC) for efficient "last N snapshots" queries.

4. Security
- This is a single-tenant app with no sign-in screen.
- RLS enabled. All CRUD scoped to `anon, authenticated` (public/shared data).
- No user_id column, no auth.uid() checks.
*/

CREATE TABLE IF NOT EXISTS daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL,
  date date NOT NULL,
  symbol text NOT NULL,
  close numeric NOT NULL,
  rsi numeric NOT NULL,
  trend_state text NOT NULL,
  volatility_state text NOT NULL,
  truth_prose text NOT NULL,
  setup_kind text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_snapshots_asset_date_key
  ON daily_snapshots (asset_id, date);

CREATE INDEX IF NOT EXISTS daily_snapshots_asset_date_desc_idx
  ON daily_snapshots (asset_id, date DESC);

ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_snapshots" ON daily_snapshots;
CREATE POLICY "anon_select_snapshots" ON daily_snapshots FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_snapshots" ON daily_snapshots;
CREATE POLICY "anon_insert_snapshots" ON daily_snapshots FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_snapshots" ON daily_snapshots;
CREATE POLICY "anon_update_snapshots" ON daily_snapshots FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_snapshots" ON daily_snapshots;
CREATE POLICY "anon_delete_snapshots" ON daily_snapshots FOR DELETE
  TO anon, authenticated USING (true);
