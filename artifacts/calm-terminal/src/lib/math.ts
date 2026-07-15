/**
 * Shared pure-math primitives used across market-data, TruthEngine, and state-engine.
 * No I/O, no side effects. All inputs are plain number arrays.
 */

/** Simple moving average over the last `n` elements. */
export function sma(arr: number[], n: number): number {
  const s = arr.slice(-n);
  return s.reduce((a, b) => a + b, 0) / s.length;
}

/** Population standard deviation. */
export function stdev(a: number[]): number {
  if (a.length === 0) return 0;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
}

/**
 * Wilder RSI over the last `period` changes in `closes`.
 * Returns 50 when there are fewer than period + 1 values.
 */
export function rsi(closes: number[], period = 14): number {
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
