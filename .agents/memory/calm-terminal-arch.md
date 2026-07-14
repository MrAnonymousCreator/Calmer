---
name: Calm Terminal architecture
description: Key decisions and quirks for the Calm Terminal crypto analysis app
---

## Stack
- Frontend: `artifacts/calm-terminal` — React + Vite SPA, wouter routing, React Query, Tailwind 4 oklch theme, Fraunces + Inter fonts
- Backend: `artifacts/api-server` — Express; `GET /api/markets` (60s cache) and `GET /api/analysis/:id/:symbol` (5min cache); pure CoinGecko proxy; no DB
- Types: OpenAPI spec at `lib/api-spec/openapi.yaml` → codegen (`pnpm --filter @workspace/api-spec run codegen`) → hooks in `lib/api-client-react`, zod in `lib/api-zod`

## OpenAPI codegen quirks
- Operations with query params generate `<OperationId>Params` in BOTH `api.ts` (zod) and `types/` (TS type), causing barrel export collision. Fix: make params path segments instead of query params. `/analysis/{id}/{symbol}` not `/analysis/{id}?symbol=...`.

## Scope fixes applied
- `deriveClusters` in state-engine.ts computed RSI on hourly sparkline (~168 pts ≈ 14 hours, not 14 days). Added `deriveClusterFromCandles(candles, change24h)` that uses daily closes. StateEngine uses daily version when analysis is loaded, sparkline fallback when not.
- localStorage key bumped v2→v3 to clear stale hourly-based EngineMemory on first load.

## Analysis lib split
- `artifacts/calm-terminal/src/lib/analysis.ts` — types + client pure math only (`classifyBehavior`, `spotSetupFromSparkline`). No `bucketToDaily` or `analyzeCandles`.
- `artifacts/api-server/src/lib/analysis.ts` — full file including `bucketToDaily` and `analyzeCandles` (server-side only).

## Source files
Original source is archived at `attached_assets/ccs-src/` (copied from the zip).
