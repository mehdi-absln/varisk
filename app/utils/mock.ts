import type { DateRange } from '~/types/portfolio'

// Sample *input* for the «پرتفوی نمونه» button: prices, share counts and a date
// range, exactly as a user would have typed them. The results are computed from
// this by the engine in `stats.ts` like any other portfolio — nothing here
// fabricates a statistic.
//
// Deterministic on purpose: Math.random() would produce different numbers on
// the server and on the client and break hydration. Everything here comes from
// a seeded PRNG, so a given seed always fills the form with the same portfolio.

/** mulberry32 — small, fast, good enough for sample data. */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Default notional capital behind the suggested share counts. */
export const DEFAULT_BUDGET = 1_000_000_000

/** Trading days in the sample window, matching `sampleDateRange()`. */
const SAMPLE_DAYS = 60

/** Daily volatility of the sample market index (شاخص کل). */
const MARKET_VOL = 0.009

/** Opening price of the sample market index. */
const MARKET_START = 2_140_000

/**
 * The sample portfolio: a target β and a total daily volatility per stock.
 *
 * The βs are spread either side of 1 on purpose — a steel producer and a bank
 * that amplify the index, a petrochemical and a carmaker that lag it — so the
 * bar chart has something to show rather than four near-identical bars.
 *
 * They are *targets*, not the numbers the page will print: 59 observations of
 * a noisy factor estimate β to about ±0.3, so the rendered betas land near
 * these rather than on them. That is the honest behaviour — a sample that
 * reproduced its own parameters exactly would be a sample of nothing.
 */
const SAMPLE_STOCKS = [
  { name: 'فولاد مبارکه', quantity: 50_000, start: 8400, beta: 1.15, vol: 0.018 },
  { name: 'پتروشیمی خلیج فارس', quantity: 24_000, start: 12_600, beta: 0.85, vol: 0.022 },
  { name: 'بانک ملت', quantity: 57_000, start: 3150, beta: 1.35, vol: 0.026 },
  { name: 'ایران خودرو', quantity: 36_000, start: 2480, beta: 0.62, vol: 0.030 },
]

/** One standard normal draw, Box–Muller, so the walks step normally not uniformly. */
function normal(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-9)
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand())
}

/**
 * The market's daily returns — the single factor every sample stock is built
 * on, and what makes the sample betas mean something.
 *
 * A function of the seed alone, deliberately: the page calls `sampleStocks()`
 * and `sampleMarketSeries()` separately, and they have to land on the same
 * market without being called together or sharing a generator.
 */
function marketReturns(seed: number): number[] {
  const rand = seeded(seed + 7)
  return Array.from({ length: SAMPLE_DAYS - 1 }, () => MARKET_VOL * normal(rand))
}

/** Compounds a return series into prices, oldest → newest. */
function pricesFromReturns(start: number, returns: number[]): number[] {
  const out = [start]
  for (const r of returns) out.push(Math.round(out.at(-1)! * (1 + r)))
  return out
}

/** Sample portfolio for the «پرتفوی نمونه» button — fills the form as a user would. */
export function sampleStocks(seed = 1405) {
  const market = marketReturns(seed)
  const rand = seeded(seed)

  return SAMPLE_STOCKS.map(({ name, quantity, start, beta, vol }) => {
    // One-factor model: rᵢ = β·r_market + ε. The idiosyncratic volatility is
    // whatever is left once the market-driven part is accounted for, so each
    // stock keeps its intended total volatility while β decides how much of
    // that is the index's doing. A stock whose β alone would overshoot `vol`
    // simply gets no noise of its own.
    const idiosyncratic = Math.sqrt(Math.max(0, vol ** 2 - (beta * MARKET_VOL) ** 2))
    const returns = market.map(r => beta * r + idiosyncratic * normal(rand))
    return { name, quantity, series: pricesFromReturns(start, returns).join('\n') }
  })
}

/** Market index series to go with `sampleStocks()`, same length and same factor. */
export function sampleMarketSeries(seed = 1405): string {
  return pricesFromReturns(MARKET_START, marketReturns(seed)).join('\n')
}

/** A window roughly matching the 60 trading days of the sample series. */
export function sampleDateRange(): DateRange {
  return { start: '۱۴۰۴/۰۲/۰۱', end: '۱۴۰۴/۰۴/۲۵' }
}
