import type { AmountMode, DateRange, RiskResult, VarLevel } from '~/types/portfolio'

// Sample data for building the result UI before the real engine exists.
//
// Deterministic on purpose: Math.random() would produce different numbers on
// the server and on the client and break hydration. Everything here comes from
// a seeded PRNG, so a given seed always renders the same portfolio.
//
// The numbers are *shaped* like real output — symmetric matrices, unit diagonal
// on the correlation matrix, a market beta of exactly 1 — but they are not
// computed from returns. Phase 1 replaces this with the tested engine.

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

const SAMPLE_NAMES = ['فولاد مبارکه', 'پتروشیمی خلیج فارس', 'بانک ملت', 'ایران خودرو', 'سرمایه‌گذاری غدیر']

/** z-scores for the one-sided normal quantiles the roadmap specifies. */
const Z: ReadonlyArray<{ confidence: number, z: number }> = [
  { confidence: 90, z: 1.282 },
  { confidence: 95, z: 1.645 },
  { confidence: 99, z: 2.326 },
]

/** Default notional capital behind the suggested share counts. */
export const DEFAULT_BUDGET = 1_000_000_000

/**
 * A plausible price series: geometric random walk with the given daily
 * volatility. Used by `sampleStocks()` so the form can be filled with one click.
 */
export function samplePrices(rand: () => number, start: number, days: number, vol: number): number[] {
  const out: number[] = [start]
  for (let d = 1; d < days; d++) {
    // Box–Muller, so the walk has normal rather than uniform steps.
    const u1 = Math.max(rand(), 1e-9)
    const shock = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand())
    out.push(Math.round(out[d - 1]! * (1 + vol * shock)))
  }
  return out
}

/** Sample portfolio for the «پرتفوی نمونه» button — fills the form as a user would. */
export function sampleStocks(seed = 1405) {
  const rand = seeded(seed)
  return SAMPLE_NAMES.slice(0, 4).map((name, i) => ({
    name,
    quantity: [50_000, 24_000, 57_000, 36_000][i]!,
    series: samplePrices(rand, [8400, 12600, 3150, 2480][i]!, 60, 0.018 + i * 0.004).join('\n'),
  }))
}

/** Market index series to go with `sampleStocks()`, same length. */
export function sampleMarketSeries(seed = 1405): string {
  return samplePrices(seeded(seed + 7), 2_140_000, 60, 0.009).join('\n')
}

/** A window roughly matching the 60 trading days of the sample series. */
export function sampleDateRange(): DateRange {
  return { start: '۱۴۰۴/۰۲/۰۱', end: '۱۴۰۴/۰۴/۲۵' }
}

/** What the form knows about the portfolio; the statistics are invented. */
export interface MockOptions {
  /** Real names from the form, so the mock reads like the user's own portfolio. */
  names?: string[]
  /** Share counts from the form. */
  quantities?: number[]
  /** Position values from the form; drives the weights and the VaR amounts. */
  values?: number[]
  dateRange?: DateRange
  amountMode?: AmountMode
  /** Number of return observations to claim. */
  periods?: number
  seed?: number
}

/**
 * A complete, internally consistent `RiskResult` for building the UI.
 *
 * The correlation matrix comes from a one-factor construction — corr[i][j] =
 * f[i]·f[j] off the diagonal — which is symmetric and positive semi-definite by
 * construction, so the heatmap and σₚ never see an impossible matrix.
 */
export function mockRiskResult(options: MockOptions = {}): RiskResult {
  const {
    names: givenNames,
    quantities: givenQuantities,
    values: givenValues,
    dateRange = sampleDateRange(),
    amountMode = 'custom',
    periods = 59,
    seed = 1405,
  } = options

  const rand = seeded(seed)
  const names = givenNames?.length
    ? givenNames.map((n, i) => n.trim() || `سهم ${i + 1}`)
    : SAMPLE_NAMES.slice(0, 4)
  const n = names.length

  const fallbackValues = [420, 310, 180, 90, 60]
  const values = names.map((_, i) =>
    givenValues?.[i] && givenValues[i]! > 0
      ? givenValues[i]!
      : fallbackValues[i % fallbackValues.length]! * 1_000_000)

  const quantities = names.map((_, i) => givenQuantities?.[i] ?? 0)

  const totalValue = values.reduce((a, b) => a + b, 0)
  const weights = values.map(v => v / totalValue)

  // Daily figures in the range Tehran equities actually trade at.
  const means = Array.from({ length: n }, () => (rand() - 0.35) * 0.004)
  const stdDevs = Array.from({ length: n }, () => 0.014 + rand() * 0.022)
  const variances = stdDevs.map(s => s * s)

  // One common market factor drives the co-movement.
  const loadings = Array.from({ length: n }, () => 0.3 + rand() * 0.6)

  const correlation: number[][] = []
  const covariance: number[][] = []
  for (let i = 0; i < n; i++) {
    correlation[i] = []
    covariance[i] = []
    for (let j = 0; j < n; j++) {
      const c = i === j ? 1 : loadings[i]! * loadings[j]!
      correlation[i]![j] = c
      covariance[i]![j] = c * stdDevs[i]! * stdDevs[j]!
    }
  }

  // β tracks the factor loading, so a high-correlation stock is also high-beta.
  const betas = loadings.map(l => Number((l * 1.55 + 0.15).toFixed(3)))

  const portfolioMean = weights.reduce((acc, w, i) => acc + w * means[i]!, 0)

  // σₚ = √(wᵀΣw). Three lines, but it keeps the KPI figure consistent with the
  // heatmap beside it; the tested engine takes this over in phase 1.
  let variance = 0
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      variance += weights[i]! * weights[j]! * covariance[i]![j]!
  const portfolioStdDev = Math.sqrt(variance)

  const varLevels: VarLevel[] = Z.map(({ confidence, z }) => {
    const ratio = z * portfolioStdDev
    return { confidence, z, ratio, amount: ratio * totalValue }
  })

  return {
    names,
    quantities,
    values,
    weights,
    totalValue,
    periods,
    dateRange,
    amountMode,
    means,
    variances,
    stdDevs,
    covariance,
    correlation,
    betas,
    portfolioMean,
    portfolioStdDev,
    varLevels,
  }
}
