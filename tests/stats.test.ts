import { describe, expect, it } from 'vitest'
import {
  calculateBeta,
  calculateParametricVaR,
  calculateReturns,
  calculateRisk,
  calculateVarLevels,
  correlationMatrix,
  covariance,
  covarianceMatrix,
  mean,
  normalQuantile,
  portfolioMean,
  portfolioStdDev,
  sampleVariance,
  stdDev,
  weightsFromValues,
  Z_SCORES,
} from '../app/utils/stats'

// ── Descriptive statistics ──────────────────────────────────────────────────

describe('mean', () => {
  it('averages a series', () => {
    // (2+4+4+4+5+5+7+9) / 8 = 40 / 8
    expect(mean([2, 4, 4, 4, 5, 5, 7, 9])).toBe(5)
  })

  it('handles negatives', () => {
    expect(mean([-2, 2])).toBe(0)
  })

  it('returns zero for an empty series', () => {
    expect(mean([])).toBe(0)
  })
})

describe('sampleVariance', () => {
  it('uses the n−1 denominator', () => {
    // squared deviations from 5 sum to 32; 32 / 7 = 4.5714…
    expect(sampleVariance([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(32 / 7, 12)
  })

  it('is zero for a constant series', () => {
    expect(sampleVariance([3, 3, 3, 3])).toBe(0)
  })

  it('agrees with covariance against itself, bit for bit', () => {
    const xs = [0.013, -0.004, 0.021, -0.017, 0.008]
    expect(sampleVariance(xs)).toBe(covariance(xs, xs))
  })

  it('returns zero for fewer than two observations', () => {
    expect(sampleVariance([])).toBe(0)
    expect(sampleVariance([7])).toBe(0)
  })
})

describe('stdDev', () => {
  it('is the square root of the sample variance', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(Math.sqrt(32 / 7), 12)
  })

  it('is zero for a constant series', () => {
    expect(stdDev([3, 3, 3])).toBe(0)
  })
})

// ── Returns ─────────────────────────────────────────────────────────────────

describe('calculateReturns', () => {
  const prices = [100, 110, 105, 120]

  it('computes simple returns', () => {
    const r = calculateReturns(prices)
    expect(r).toHaveLength(3)
    expect(r[0]!).toBeCloseTo(0.1, 12) //   110/100 − 1
    expect(r[1]!).toBeCloseTo(-0.045_454_545_454_545, 12) // 105/110 − 1
    expect(r[2]!).toBeCloseTo(0.142_857_142_857_143, 12) // 120/105 − 1
  })

  it('computes log returns', () => {
    const r = calculateReturns(prices, 'log')
    expect(r[0]!).toBeCloseTo(0.095_310_179_804_325, 12)
    expect(r[1]!).toBeCloseTo(-0.046_520_015_634_893, 12)
    expect(r[2]!).toBeCloseTo(0.133_531_392_624_523, 12)
  })

  it('defaults to the simple method', () => {
    expect(calculateReturns(prices)).toEqual(calculateReturns(prices, 'simple'))
  })

  it('always yields one fewer observation than prices', () => {
    expect(calculateReturns([1, 2, 3, 4, 5])).toHaveLength(4)
    expect(calculateReturns([100])).toHaveLength(0)
    expect(calculateReturns([])).toHaveLength(0)
  })

  it('yields a zero step for a non-positive price rather than Infinity', () => {
    // Length must stay prices.length − 1, or the `periods` invariant breaks.
    const r = calculateReturns([100, 0, 120])
    expect(r).toEqual([0, 0])
    expect(r.every(Number.isFinite)).toBe(true)
  })
})

// ── Covariance and correlation ──────────────────────────────────────────────

// One fixture, two specs: a textbook covariance and a perfectly correlated pair.
const x = [1, 2, 3, 4]
const y = [2, 4, 6, 8]

describe('covariance', () => {
  it('computes the sample covariance of two series', () => {
    // deviations (−1.5,−0.5,0.5,1.5)·(−3,−1,1,3) = 4.5+0.5+0.5+4.5 = 10; /3
    expect(covariance(x, y)).toBeCloseTo(10 / 3, 12)
  })

  it('is symmetric in its arguments', () => {
    expect(covariance(x, y)).toBe(covariance(y, x))
  })

  it('is negative when the series move against each other', () => {
    expect(covariance(x, [8, 6, 4, 2])).toBeCloseTo(-10 / 3, 12)
  })

  it('is zero against a constant series', () => {
    expect(covariance(x, [5, 5, 5, 5])).toBe(0)
  })

  it('truncates to the shorter series', () => {
    expect(covariance([1, 2, 3, 4], [2, 4])).toBe(covariance([1, 2], [2, 4]))
  })

  it('returns zero for fewer than two paired observations', () => {
    expect(covariance([1], [2])).toBe(0)
    expect(covariance([], [])).toBe(0)
  })
})

describe('covarianceMatrix', () => {
  const m = covarianceMatrix([x, y])

  it('carries the sample variances on its diagonal', () => {
    expect(m[0]![0]!).toBe(sampleVariance(x)) // 5/3
    expect(m[1]![1]!).toBe(sampleVariance(y)) // 20/3
  })

  it('is exactly symmetric, not approximately', () => {
    expect(m[0]![1]!).toBe(m[1]![0]!)
  })

  it('returns an empty matrix for no series', () => {
    expect(covarianceMatrix([])).toEqual([])
  })
})

describe('correlationMatrix', () => {
  it('has an exactly unit diagonal', () => {
    const m = correlationMatrix([x, y])
    expect(m[0]![0]!).toBe(1)
    expect(m[1]![1]!).toBe(1)
  })

  it('reports 1 for a perfectly correlated pair', () => {
    // y = 2x, so r = 1 up to floating-point rounding (1.0000000000000002).
    expect(correlationMatrix([x, y])[0]![1]!).toBeCloseTo(1, 12)
  })

  it('reports −1 for a perfectly inverted pair', () => {
    expect(correlationMatrix([x, [8, 6, 4, 2]])[0]![1]!).toBeCloseTo(-1, 12)
  })

  it('is exactly symmetric', () => {
    const m = correlationMatrix([x, y, [3, 1, 4, 1]])
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) expect(m[i]![j]!).toBe(m[j]![i]!)
    }
  })

  it('reports 0 rather than NaN when a series never moves', () => {
    const m = correlationMatrix([x, [5, 5, 5, 5]])
    expect(m[0]![1]!).toBe(0)
    expect(m[1]![1]!).toBe(1)
  })
})

// ── Beta ────────────────────────────────────────────────────────────────────

describe('calculateBeta', () => {
  const market = [0.01, -0.005, 0.012, 0.003, -0.008]

  it('is exactly 1 for the market against itself', () => {
    // The whole reason sampleVariance delegates to covariance.
    expect(calculateBeta(market, market)).toBe(1)
  })

  it('is 2 for a series that moves twice as hard', () => {
    expect(calculateBeta(market.map(r => r * 2), market)).toBeCloseTo(2, 12)
  })

  it('is negative for a series that moves against the market', () => {
    expect(calculateBeta(market.map(r => -r), market)).toBeCloseTo(-1, 12)
  })

  it('is zero for a stock uncorrelated with the market', () => {
    expect(calculateBeta([1, 1, 1, 1, 1], market)).toBe(0)
  })

  it('is zero when the market never moved', () => {
    expect(calculateBeta(market, [0, 0, 0, 0, 0])).toBe(0)
  })
})

// ── Portfolio aggregation ───────────────────────────────────────────────────

describe('portfolioMean', () => {
  it('weights the per-stock means', () => {
    // 0.6(0.01) + 0.4(−0.005) = 0.006 − 0.002
    expect(portfolioMean([0.6, 0.4], [0.01, -0.005])).toBeCloseTo(0.004, 12)
  })

  it('truncates to the shorter input', () => {
    expect(portfolioMean([1, 1], [0.02])).toBeCloseTo(0.02, 12)
  })

  it('returns zero for empty input', () => {
    expect(portfolioMean([], [])).toBe(0)
  })
})

describe('portfolioStdDev', () => {
  // σ = 0.2 / 0.1 with r = 1, so Σ is the perfectly correlated case.
  const correlated = [[0.04, 0.02], [0.02, 0.01]]
  const independent = [[0.04, 0], [0, 0.01]]

  it('reduces to the weighted sum of σ when the pair is perfectly correlated', () => {
    // 0.5(0.2) + 0.5(0.1) — no diversification at all
    expect(portfolioStdDev([0.5, 0.5], correlated)).toBeCloseTo(0.15, 12)
  })

  it('falls below that sum once the pair is uncorrelated', () => {
    const diversified = portfolioStdDev([0.5, 0.5], independent)
    expect(diversified).toBeCloseTo(0.111_803_398_874_989, 12)
    // The relation is the point, not the two magic numbers.
    expect(diversified).toBeLessThan(portfolioStdDev([0.5, 0.5], correlated))
  })

  it('returns a single σ for a one-stock portfolio', () => {
    expect(portfolioStdDev([1], [[0.04]])).toBeCloseTo(0.2, 12)
  })

  it('returns zero for empty input', () => {
    expect(portfolioStdDev([], [])).toBe(0)
  })
})

describe('weightsFromValues', () => {
  it('normalises to a sum of 1', () => {
    const w = weightsFromValues([300, 100])
    expect(w).toEqual([0.75, 0.25])
  })

  it('passes short positions through, still summing to 1', () => {
    const w = weightsFromValues([200, -100])
    expect(w).toEqual([2, -1])
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
  })

  it('returns zeros rather than NaN when the values cancel out', () => {
    expect(weightsFromValues([0, 0])).toEqual([0, 0])
    expect(weightsFromValues([100, -100])).toEqual([0, 0])
  })

  it('returns an empty array for no values', () => {
    expect(weightsFromValues([])).toEqual([])
  })
})

// ── Value at Risk ───────────────────────────────────────────────────────────

describe('normalQuantile (Acklam probit algorithm)', () => {
  it('matches known mathematical quantiles within 1e-8', () => {
    expect(normalQuantile(0.5)).toBe(0)
    expect(normalQuantile(0.9)).toBeCloseTo(1.2815515655, 8)
    expect(normalQuantile(0.95)).toBeCloseTo(1.64485362695, 8)
    expect(normalQuantile(0.975)).toBeCloseTo(1.9599639845, 8)
    expect(normalQuantile(0.99)).toBeCloseTo(2.3263478740, 8)
  })

  it('handles lower tails symmetrically', () => {
    expect(normalQuantile(0.05)).toBeCloseTo(-1.64485362695, 8)
    expect(normalQuantile(0.01)).toBeCloseTo(-2.3263478740, 8)
  })
})

describe('calculateParametricVaR', () => {
  it('scales σ by the exact z-score and the portfolio value', () => {
    // 1.6448536... × 0.02 = 0.032897... of 1,000,000,000
    const v = calculateParametricVaR(0.02, 1_000_000_000, 95)
    expect(v.confidence).toBe(95)
    expect(v.z).toBeCloseTo(1.6448536, 6)
    expect(v.ratio).toBeCloseTo(1.64485362695 * 0.02, 6)
    expect(v.amount).toBeCloseTo(1.64485362695 * 0.02 * 1_000_000_000, 1)
  })

  it('grows with confidence', () => {
    const at90 = calculateParametricVaR(0.02, 1_000_000_000, 90)
    const at99 = calculateParametricVaR(0.02, 1_000_000_000, 99)
    expect(at90.amount).toBeLessThan(at99.amount)
  })

  it('defaults to 95', () => {
    expect(calculateParametricVaR(0.02, 1_000_000_000).confidence).toBe(95)
  })

  it('calculates exact quantiles for arbitrary confidence levels (e.g. 97.5%)', () => {
    const v = calculateParametricVaR(0.02, 1_000_000_000, 97.5)
    expect(v.confidence).toBe(97.5)
    expect(v.z).toBeCloseTo(1.959964, 5)
  })

  it('scales with horizon via square-root-of-time rule (e.g. Basel 10-day)', () => {
    const v1 = calculateParametricVaR(0.02, 1_000_000_000, 99, 1)
    const v10 = calculateParametricVaR(0.02, 1_000_000_000, 99, 10)
    expect(v10.amount).toBeCloseTo(v1.amount * Math.sqrt(10), 4)
  })

  it('is zero for a riskless portfolio', () => {
    expect(calculateParametricVaR(0, 1_000_000_000, 95).amount).toBe(0)
  })
})

describe('calculateVarLevels', () => {
  it('is ordered 90 → 95 → 99', () => {
    const levels = calculateVarLevels(0.02, 1_000_000_000)
    expect(levels.map(l => l.confidence)).toEqual([90, 95, 99])
    expect(levels.map(l => l.z)).toEqual(Z_SCORES.map(l => l.z))
  })

  it('increases monotonically in amount', () => {
    const amounts = calculateVarLevels(0.02, 1_000_000_000).map(l => l.amount)
    expect(amounts[0]!).toBeLessThan(amounts[1]!)
    expect(amounts[1]!).toBeLessThan(amounts[2]!)
  })
})

// ── Edge cases: nothing may produce NaN ─────────────────────────────────────

describe('edge cases', () => {
  const flat = [50, 50, 50, 50]
  const single = [100]

  it('survives empty input everywhere', () => {
    expect(mean([])).toBe(0)
    expect(covariance([], [])).toBe(0)
    expect(sampleVariance([])).toBe(0)
    expect(stdDev([])).toBe(0)
    expect(calculateReturns([])).toEqual([])
    expect(covarianceMatrix([])).toEqual([])
    expect(correlationMatrix([])).toEqual([])
    expect(calculateBeta([], [])).toBe(0)
    expect(portfolioMean([], [])).toBe(0)
    expect(portfolioStdDev([], [])).toBe(0)
    expect(weightsFromValues([])).toEqual([])
  })

  it('survives a single observation everywhere', () => {
    const r = calculateReturns(single)
    expect(mean(single)).toBe(100)
    expect(sampleVariance(single)).toBe(0)
    expect(stdDev(single)).toBe(0)
    expect(r).toEqual([])
    expect(calculateBeta(r, r)).toBe(0)
    expect(covarianceMatrix([r])).toEqual([[0]])
    expect(correlationMatrix([r])).toEqual([[1]])
  })

  it('survives a constant series, where every σ is zero', () => {
    const r = calculateReturns(flat)
    expect(r).toEqual([0, 0, 0])
    expect(stdDev(r)).toBe(0)
    // Would be 0/0 without the guard.
    expect(correlationMatrix([r, r])[0]![1]!).toBe(0)
    expect(calculateBeta(r, r)).toBe(0)
    expect(calculateVarLevels(stdDev(r), 0).every(l => Number.isFinite(l.amount))).toBe(true)
  })

  it('clamps a hedged short position instead of rooting a negative variance', () => {
    // σ = 0.001 / 0.01, r = 1, w = [1, −0.1]: algebraically zero variance, but
    // −2.1e−22 in binary floating point. Math.sqrt of that is NaN.
    const perfectlyCorrelated = [[1e-6, 1e-5], [1e-5, 1e-4]]
    const sigma = portfolioStdDev([1, -0.1], perfectlyCorrelated)
    expect(sigma).not.toBeNaN()
    expect(sigma).toBe(0)
  })

  it('holds up under negative weights generally', () => {
    const cov = [[0.04, 0.02], [0.02, 0.01]]
    expect(portfolioStdDev([1.5, -0.5], cov)).not.toBeNaN()
    expect(portfolioMean([2, -1], [0.01, 0.02])).toBeCloseTo(0, 12)
    expect(calculateVarLevels(portfolioStdDev([1.5, -0.5], cov), -1000)
      .every(l => Number.isFinite(l.amount))).toBe(true)
  })
})

// ── The orchestrator ────────────────────────────────────────────────────────

/** Every non-finite number in a result, by path — empty means the result is clean. */
function nonFinite(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => nonFinite(v, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => nonFinite(v, `${path}.${k}`))
  }
  return typeof value === 'number' && !Number.isFinite(value) ? [`${path} = ${value}`] : []
}

describe('calculateRisk', () => {
  const dateRange = { start: '۱۴۰۴/۰۲/۰۱', end: '۱۴۰۴/۰۴/۲۵' }

  const input = {
    stocks: [
      { name: 'فولاد مبارکه', quantity: 1000, prices: [100, 110, 105, 120, 118] },
      { name: 'بانک ملت', quantity: 500, prices: [200, 204, 199, 210, 214] },
      { name: 'ایران خودرو', quantity: 2000, prices: [50, 49, 51, 52, 50] },
    ],
    marketPrices: [1000, 1020, 1010, 1050, 1045],
    dateRange,
    amountMode: 'custom' as const,
    budget: 1_000_000_000,
  }

  const result = calculateRisk(input)

  it('carries the names, quantities and derived values', () => {
    expect(result.names).toEqual(['فولاد مبارکه', 'بانک ملت', 'ایران خودرو'])
    expect(result.quantities).toEqual([1000, 500, 2000])
    // value = quantity × latest price
    expect(result.values).toEqual([118_000, 107_000, 100_000])
    expect(result.totalValue).toBe(325_000)
  })

  it('produces weights that sum to 1', () => {
    expect(result.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
  })

  it('reports one fewer period than there are prices', () => {
    expect(result.periods).toBe(input.stocks[0]!.prices.length - 1)
    expect(result.returns![0]!).toHaveLength(result.periods)
  })

  it('fills the per-stock return series', () => {
    expect(result.returns).toHaveLength(3)
    expect(result.returns![0]![0]!).toBeCloseTo(0.1, 12)
  })

  it('keeps the covariance diagonal identical to the variances', () => {
    for (let i = 0; i < 3; i++) expect(result.covariance[i]![i]!).toBe(result.variances[i]!)
  })

  it('returns symmetric matrices', () => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(result.covariance[i]![j]!).toBe(result.covariance[j]![i]!)
        expect(result.correlation[i]![j]!).toBe(result.correlation[j]![i]!)
      }
    }
  })

  it('returns an exactly unit correlation diagonal', () => {
    for (let i = 0; i < 3; i++) expect(result.correlation[i]![i]!).toBe(1)
  })

  it('keeps σ consistent with the variances', () => {
    for (let i = 0; i < 3; i++) {
      expect(result.stdDevs[i]!).toBeCloseTo(Math.sqrt(result.variances[i]!), 12)
    }
  })

  it('orders the VaR levels 90 → 95 → 99 and ties them to σₚ', () => {
    expect(result.varLevels.map(l => l.confidence)).toEqual([90, 95, 99])
    expect(result.varLevels[1]!.ratio).toBeCloseTo(result.varLevels[1]!.z * result.portfolioStdDev, 12)
    expect(result.varLevels[1]!.amount).toBeCloseTo(result.varLevels[1]!.ratio * result.totalValue, 6)
  })

  it('passes the date range and amount mode through untouched', () => {
    expect(result.dateRange).toEqual(dateRange)
    expect(result.amountMode).toBe('custom')
  })

  it('ties VaR to z·σₚ·V on a single-asset portfolio', () => {
    // One stock, so w = [1] and σₚ collapses to that stock's own σ — the
    // cleanest end-to-end check that VaR = z × σₚ × V.
    // Prices 100 → 110 → 99 → 108.9 → 98.01 give returns ±0.1 exactly:
    // mean 0, variance 4(0.01)/3, σ = √(0.04/3) = 0.11547…
    const solo = calculateRisk({
      ...input,
      stocks: [{ name: 'تک‌سهم', quantity: 1000, prices: [100, 110, 99, 108.9, 98.01] }],
    })

    expect(solo.returns![0]!.map(r => Number(r.toFixed(12))))
      .toEqual([0.1, -0.1, 0.1, -0.1])
    expect(solo.weights).toEqual([1])
    expect(solo.variances[0]!).toBeCloseTo(0.04 / 3, 12)
    expect(solo.portfolioStdDev).toBeCloseTo(Math.sqrt(0.04 / 3), 12)
    // V = 1000 × 98.01
    expect(solo.totalValue).toBeCloseTo(98_010, 6)

    for (const level of solo.varLevels) {
      expect(level.ratio).toBeCloseTo(level.z * solo.portfolioStdDev, 12)
      expect(level.amount).toBeCloseTo(level.z * solo.portfolioStdDev * solo.totalValue, 6)
    }
    // 1.6448536... × 0.1154700538 × 98,010
    expect(solo.varLevels[1]!.amount).toBeCloseTo(18_615.17, 1)
  })

  it('stays finite across adversarial but well-formed portfolios', () => {
    // The parser only ever hands the engine finite positive prices — it rejects
    // NaN/Infinity outright and strips the `e`, so `1e308` arrives as `1308`.
    // These are the nastiest inputs that can actually reach it.
    const range = { start: '', end: '' }
    const cases: Array<[string, Parameters<typeof calculateRisk>[0]]> = [
      ['flat prices', { stocks: [{ name: 'a', quantity: 1, prices: [5, 5, 5] }, { name: 'b', quantity: 1, prices: [5, 5, 5] }], marketPrices: [5, 5, 5], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['zero prices', { stocks: [{ name: 'a', quantity: 1, prices: [0, 0, 0] }], marketPrices: [0, 0, 0], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['negative prices', { stocks: [{ name: 'a', quantity: 1, prices: [-5, -10, -5] }], marketPrices: [1, 2, 3], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['short position', { stocks: [{ name: 'a', quantity: -100, prices: [10, 11, 12] }, { name: 'b', quantity: 50, prices: [10, 9, 11] }], marketPrices: [1, 2, 3], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['values cancelling to zero', { stocks: [{ name: 'a', quantity: 10, prices: [10, 11, 12] }, { name: 'b', quantity: -10, prices: [10, 11, 12] }], marketPrices: [1, 2, 3], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['two-point series', { stocks: [{ name: 'a', quantity: 1, prices: [5, 6] }], marketPrices: [5, 6], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['ragged series', { stocks: [{ name: 'a', quantity: 1, prices: [5, 6, 7, 8, 9] }, { name: 'b', quantity: 1, prices: [5, 6] }], marketPrices: [5], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['no market series', { stocks: [{ name: 'a', quantity: 1, prices: [5, 6, 7] }], marketPrices: [], dateRange: range, amountMode: 'custom', budget: 0 }],
      ['suggested with zero budget', { stocks: [{ name: 'a', quantity: null, prices: [5, 6, 7] }], marketPrices: [5, 6, 7], dateRange: range, amountMode: 'suggested', budget: 0 }],
      ['suggested with negative budget', { stocks: [{ name: 'a', quantity: null, prices: [5, 6, 7] }], marketPrices: [5, 6, 7], dateRange: range, amountMode: 'suggested', budget: -1e9 }],
      ['prices spanning 12 orders of magnitude', { stocks: [{ name: 'a', quantity: 1, prices: [1, 1e12, 1] }], marketPrices: [1, 1e12, 1], dateRange: range, amountMode: 'custom', budget: 0 }],
    ]

    for (const [label, portfolio] of cases) {
      // Reported as an object so a failure names the offending case and path.
      expect({ label, offenders: nonFinite(calculateRisk(portfolio)) })
        .toEqual({ label, offenders: [] })
    }
  })

  it('produces no NaN and no Infinity anywhere', () => {
    expect(nonFinite(result)).toEqual([])
    const numbers = [
      ...result.values,
      ...result.weights,
      ...result.means,
      ...result.variances,
      ...result.stdDevs,
      ...result.betas,
      ...result.covariance.flat(),
      ...result.correlation.flat(),
      ...result.returns!.flat(),
      ...result.varLevels.flatMap(l => [l.ratio, l.amount]),
      result.totalValue,
      result.portfolioMean,
      result.portfolioStdDev,
    ]
    expect(numbers.every(Number.isFinite)).toBe(true)
  })

  it('resolves null quantities from the budget in suggested mode', () => {
    const suggested = calculateRisk({
      ...input,
      stocks: input.stocks.map(s => ({ ...s, quantity: null })),
      amountMode: 'suggested',
      budget: 300_000,
    })
    // 300,000 / 3 stocks = 100,000 at the latest price of each
    expect(suggested.quantities).toEqual([847, 467, 2000])
  })

  it('leaves null quantities at zero in custom mode', () => {
    const custom = calculateRisk({
      ...input,
      stocks: input.stocks.map(s => ({ ...s, quantity: null })),
    })
    expect(custom.quantities).toEqual([0, 0, 0])
    expect(custom.totalValue).toBe(0)
    expect(custom.weights).toEqual([0, 0, 0])
    expect(custom.portfolioStdDev).not.toBeNaN()
  })

  it('names an unnamed row by its position', () => {
    const unnamed = calculateRisk({ ...input, stocks: [{ ...input.stocks[0]!, name: '  ' }] })
    expect(unnamed.names).toEqual(['سهم 1'])
  })

  it('drops the blank rows the form keeps at the bottom', () => {
    const withBlank = calculateRisk({
      ...input,
      stocks: [...input.stocks, { name: '', quantity: null, prices: [] }],
    })
    expect(withBlank.names).toHaveLength(3)
    expect(withBlank.covariance).toHaveLength(3)
  })

  it('returns a zero-filled result for an empty portfolio, never null', () => {
    const empty = calculateRisk({ ...input, stocks: [], marketPrices: [] })
    expect(empty.names).toEqual([])
    expect(empty.weights).toEqual([])
    expect(empty.covariance).toEqual([])
    expect(empty.correlation).toEqual([])
    expect(empty.totalValue).toBe(0)
    expect(empty.periods).toBe(0)
    expect(empty.portfolioMean).toBe(0)
    expect(empty.portfolioStdDev).toBe(0)
    expect(empty.varLevels.map(l => l.amount)).toEqual([0, 0, 0])
  })

  it('gives the market series a beta of exactly 1 against itself', () => {
    const withMarketAsStock = calculateRisk({
      ...input,
      stocks: [{ name: 'شاخص کل', quantity: 1, prices: input.marketPrices }],
    })
    expect(withMarketAsStock.betas[0]!).toBe(1)
  })
})
