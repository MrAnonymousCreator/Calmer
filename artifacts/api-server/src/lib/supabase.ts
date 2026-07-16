import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars not configured (SUPABASE_URL / SUPABASE_ANON_KEY)");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export type SnapshotRow = {
  id: string;
  asset_id: string;
  date: string;
  symbol: string;
  close: number;
  rsi: number;
  trend_state: string;
  volatility_state: string;
  truth_prose: string;
  setup_kind: string;
  captured_at: string;
};
