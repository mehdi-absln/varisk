import type { PortfolioInput, RiskResult, VarLevel } from '~/types/portfolio'
import { suggestQuantity } from './quantity'

// The quantitative engine: pure functions over price and return series, plus
// the `calculateRisk` orchestrator the result page renders.
//
// Two rules hold everywhere in this file.
//
// 1. Nothing throws. Every degenerate input — an empty series, a flat price
//    history, a portfolio whose values cancel to zero — returns a neutral
//    value instead. This matches the rest of `app/utils/`: `suggestQuantity`
//    returns 0, `parseJalali` returns null, `parsePriceSeries` collects bad
//    tokens. The page computes live, on every keystroke, over half-typed
//    input; a throw would blank the screen and a NaN would print as «NaN».
//
// 2. `sampleVariance(xs)` is `covariance(xs, xs)`, not a separate loop. β of
//    the market against itself must be *exactly* 1, and a ratio of two floats
//    only lands on exactly 1 when numerator and denominator come off the same
//    arithmetic. Sharing one code path guarantees it; two code paths that
//    "compute the same thing" would not.

/** How a price step is turned into a return. */
export type ReturnMethod = 'simple' | 'log'

/**
 * One-sided normal quantiles for the confidence levels the roadmap specifies.
 * Rounded to three decimals on purpose — these are the figures the 1400
 * prototype quoted, and the result panel prints them beside each VaR level.
 */
export const Z_SCORES: ReadonlyArray<{ confidence: number, z: number }> = [
  { confidence: 90, z: 1.282 },
  { confidence: 95, z: 1.645 },
  { confidence: 99, z: 2.326 },
]

/** Default confidence, and the fallback when an unknown level is asked for. */
const DEFAULT_CONFIDENCE = 95

// ── Descriptive statistics ──────────────────────────────────────────────────

/** Arithmetic mean. An empty series has no mean, so it reports 0. */
export function mean(xs: number[]): number {
  if (!xs.length) return 0
  let sum = 0
  for (const x of xs) sum += x
  return sum / xs.length
}

/**
 * Sample covariance, n−1 denominator.
 *
 * Two-pass (means first, then products) rather than the Σxy − ΣxΣy/n
 * shortcut: returns are small numbers around zero, and the shortcut subtracts
 * two nearly equal large sums, which throws away most of the significant
 * digits.
 *
 * Series of unequal length are truncated to the shorter one — the validator
 * already refuses ragged input, so this only ever fires in tests.
 */
export function covariance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return 0

  const meanA = mean(a.slice(0, n))
  const meanB = mean(b.slice(0, n))

  let sum = 0
  for (let i = 0; i < n; i++) sum += (a[i]! - meanA) * (b[i]! - meanB)
  return sum / (n - 1)
}

/**
 * Sample variance, n−1 denominator.
 *
 * Delegates to `covariance` so Var(x) and Cov(x, x) are bit-identical. See the
 * file header: this is what makes β of the market against itself exactly 1.
 */
export function sampleVariance(xs: number[]): number {
  return covariance(xs, xs)
}

/** Sample standard deviation. Clamped, since rounding can leave σ² just below 0. */
export function stdDev(xs: number[]): number {
  return Math.sqrt(Math.max(0, sampleVariance(xs)))
}

// ── Returns ─────────────────────────────────────────────────────────────────

/**
 * Turns a price series (oldest → newest) into a return series.
 *
 * The result always has `prices.length − 1` entries — the `periods` invariant
 * of `RiskResult` depends on it — so a step that cannot be divided (a zero or
 * negative price slipping past the parser) contributes a 0 return rather than
 * being dropped or turned into Infinity.
 */
export function calculateReturns(prices: number[], method: ReturnMethod = 'simple'): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i++) {
    const previous = prices[i - 1]!
    const current = prices[i]!
    if (previous <= 0 || current <= 0) {
      out.push(0)
      continue
    }
    out.push(method === 'log' ? Math.log(current / previous) : current / previous - 1)
  }
  return out
}

// ── Matrices ────────────────────────────────────────────────────────────────

/**
 * Covariance matrix Σ over a list of return series.
 *
 * Only the upper triangle is computed and then mirrored, so symmetry is exact
 * rather than merely approximate — `Σ[i][j] === Σ[j][i]` holds under `toBe`,
 * and the heatmap never shows two different numbers for one pair.
 */
export function covarianceMatrix(series: number[][]): number[][] {
  const n = series.length
  const out: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => 0))

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const c = covariance(series[i]!, series[j]!)
      out[i]![j] = c
      out[j]![i] = c
    }
  }
  return out
}

/**
 * Correlation matrix, Σ[i][j] / (σᵢ σⱼ).
 *
 * The diagonal is the literal 1 rather than a computed σ²/σ², both because a
 * flat series would make that 0/0 and because `RiskResult` promises a diagonal
 * that is exactly 1. Off the diagonal, a zero σ means the pair has no
 * co-movement to measure, which reads as 0 — not as NaN.
 */
export function correlationMatrix(series: number[][]): number[][] {
  const n = series.length
  const cov = covarianceMatrix(series)
  const sigmas = series.map(s => stdDev(s))
  const out: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => 0))

  for (let i = 0; i < n; i++) {
    out[i]![i] = 1
    for (let j = i + 1; j < n; j++) {
      const denominator = sigmas[i]! * sigmas[j]!
      const r = denominator > 0 ? cov[i]![j]! / denominator : 0
      out[i]![j] = r
      out[j]![i] = r
    }
  }
  return out
}

// ── Beta ────────────────────────────────────────────────────────────────────

/**
 * β = Cov(asset, market) / Var(market): how much the position moves for one
 * unit of market move.
 *
 * A market that never moved carries no information about the asset, so β is 0
 * rather than a division by zero.
 */
export function calculateBeta(asset: number[], market: number[]): number {
  const n = Math.min(asset.length, market.length)
  // Both terms must span the same observations, or the ratio mixes two windows.
  const variance = sampleVariance(market.slice(0, n))
  if (variance === 0) return 0
  return covariance(asset, market) / variance
}

// ── Portfolio aggregation ───────────────────────────────────────────────────

/** Weighted mean return, Σ wᵢ μᵢ. */
export function portfolioMean(weights: number[], means: number[]): number {
  const n = Math.min(weights.length, means.length)
  let sum = 0
  for (let i = 0; i < n; i++) sum += weights[i]! * means[i]!
  return sum
}

/**
 * σₚ = √(wᵀΣw) — the number the whole VaR figure rests on.
 *
 * The clamp is not defensive padding. A perfectly hedged pair (σ = 0.001 and
 * 0.01, r = 1, w = [1, −0.1]) is algebraically zero variance but lands on
 * −2.1e−22 in binary floating point, and `Math.sqrt` of that is NaN. Clamping
 * turns the impossible negative into the 0 it means.
 */
export function portfolioStdDev(weights: number[], cov: number[][]): number {
  const n = Math.min(weights.length, cov.length)
  let variance = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) variance += weights[i]! * weights[j]! * (cov[i]![j] ?? 0)
  }
  return Math.sqrt(Math.max(0, variance))
}

/**
 * Position values → weights summing to 1.
 *
 * Negative values (short positions) pass through untouched: the weights still
 * sum to 1, which is what σₚ needs. Only a total of exactly zero is refused,
 * and it yields all-zero weights rather than a row of NaN.
 */
export function weightsFromValues(values: number[]): number[] {
  const totalValue = values.reduce((a, b) => a + b, 0)
  if (totalValue === 0) return values.map(() => 0)
  return values.map(v => v / totalValue)
}

// ── Value at Risk ───────────────────────────────────────────────────────────

/**
 * Parametric (variance–covariance) VaR over one period: the loss that is only
 * exceeded with probability 1 − confidence, assuming normal returns.
 *
 * An unrecognised confidence level falls back to 95 *including its z* — the
 * returned `VarLevel` is what the UI labels itself with, so a mismatched
 * confidence/z pair would print a lie.
 */
export function calculateParametricVaR(
  portfolioStdDev: number,
  totalValue: number,
  confidence: number = DEFAULT_CONFIDENCE,
): VarLevel {
  const level = Z_SCORES.find(l => l.confidence === confidence)
    ?? Z_SCORES.find(l => l.confidence === DEFAULT_CONFIDENCE)!

  const ratio = level.z * Math.max(0, portfolioStdDev)
  return { confidence: level.confidence, z: level.z, ratio, amount: ratio * totalValue }
}

/** All three levels, ordered 90 → 95 → 99 as the result panel reads them. */
export function calculateVarLevels(portfolioStdDev: number, totalValue: number): VarLevel[] {
  return Z_SCORES.map(({ confidence }) =>
    calculateParametricVaR(portfolioStdDev, totalValue, confidence))
}

// ── Orchestrator ────────────────────────────────────────────────────────────

/**
 * The whole engine, from a filled form to the numbers on screen.
 *
 * Never returns null and never returns NaN: an empty portfolio produces a
 * zero-filled `RiskResult`, which the page can render as honestly as a full
 * one. Every documented `RiskResult` invariant holds — `periods` is
 * `prices.length − 1`, the covariance diagonal *is* `variances` (it is read
 * off the matrix rather than recomputed), the correlation diagonal is exactly
 * 1, and the weights sum to 1.
 */
export function calculateRisk(input: PortfolioInput): RiskResult {
  const { marketPrices, dateRange, amountMode, budget } = input

  // A row with fewer than two prices yields no return at all. In practice
  // these are the blank slots the form keeps at the bottom — the validator
  // ignores them for the same reason — and dropping them here keeps every
  // array below indexed by the same stocks.
  const stocks = input.stocks.filter(s => s.prices.length >= 2)
  const count = stocks.length

  const names = stocks.map((s, i) => s.name.trim() || `سهم ${i + 1}`)

  // `Stock.quantity` is nullable precisely so «لیست پیشنهادی سیستم» can leave
  // it unset and let the budget decide.
  const quantities = stocks.map(s =>
    s.quantity ?? (amountMode === 'suggested' ? suggestQuantity(s.prices, count, budget) : 0))

  const values = stocks.map((s, i) => quantities[i]! * (s.prices.at(-1) ?? 0))
  const totalValue = values.reduce((a, b) => a + b, 0)
  const weights = weightsFromValues(values)

  const returns = stocks.map(s => calculateReturns(s.prices))
  const marketReturns = calculateReturns(marketPrices)
  const means = returns.map(r => mean(r))

  const cov = covarianceMatrix(returns)
  // Read off the diagonal rather than recomputed, so the invariant is
  // structural: `covariance[i][i] === variances[i]` cannot drift.
  const variances = cov.map((row, i) => row[i]!)

  const sigma = portfolioStdDev(weights, cov)

  return {
    names,
    quantities,
    values,
    weights,
    totalValue,
    periods: returns[0]?.length ?? 0,
    dateRange,
    amountMode,
    returns,
    means,
    variances,
    stdDevs: variances.map(v => Math.sqrt(Math.max(0, v))),
    covariance: cov,
    correlation: correlationMatrix(returns),
    betas: returns.map(r => calculateBeta(r, marketReturns)),
    portfolioMean: portfolioMean(weights, means),
    portfolioStdDev: sigma,
    varLevels: calculateVarLevels(sigma, totalValue),
  }
}
