import { describe, expect, it } from 'vitest'
import { calculateRisk } from '../app/utils/stats'
import numpyBenchmark from './fixtures/benchmark.json'

describe('Independent Benchmark Validation (VaRisk vs NumPy/SciPy/Excel)', () => {
  const input = {
    stocks: [
      {
        name: 'فولاد مبارکه',
        quantity: 1000,
        prices: [100.0, 110.0, 105.0, 120.0, 118.0, 125.0],
      },
      {
        name: 'بانک ملت',
        quantity: 500,
        prices: [200.0, 204.0, 199.0, 210.0, 214.0, 220.0],
      },
      {
        name: 'ایران خودرو',
        quantity: 2000,
        prices: [50.0, 49.0, 51.0, 52.0, 50.0, 53.0],
      },
    ],
    marketPrices: [1000.0, 1020.0, 1010.0, 1050.0, 1045.0, 1070.0],
    dateRange: { start: '۱۴۰۴/۰۱/۰۱', end: '۱۴۰۴/۰۱/۰۶' },
    amountMode: 'custom' as const,
    budget: 1_000_000_000,
  }

  const result = calculateRisk(input)

  it('matches total portfolio value and individual stock values', () => {
    expect(result.totalValue).toBeCloseTo(numpyBenchmark.totalValue, 8)
    for (let i = 0; i < 3; i++) {
      expect(result.values[i]!).toBeCloseTo(numpyBenchmark.values[i]!, 8)
    }
  })

  it('matches portfolio weights to 12 decimal places', () => {
    for (let i = 0; i < 3; i++) {
      expect(result.weights[i]!).toBeCloseTo(numpyBenchmark.weights[i]!, 12)
    }
  })

  it('matches asset mean returns with NumPy np.mean()', () => {
    for (let i = 0; i < 3; i++) {
      expect(result.means[i]!).toBeCloseTo(numpyBenchmark.means[i]!, 12)
    }
  })

  it('matches asset sample variances with NumPy np.var(ddof=1) and Excel VAR.S', () => {
    for (let i = 0; i < 3; i++) {
      expect(result.variances[i]!).toBeCloseTo(numpyBenchmark.variances[i]!, 12)
    }
  })

  it('matches asset standard deviations with NumPy np.std(ddof=1) and Excel STDEV.S', () => {
    for (let i = 0; i < 3; i++) {
      expect(result.stdDevs[i]!).toBeCloseTo(numpyBenchmark.stdDevs[i]!, 12)
    }
  })

  it('matches full covariance matrix with NumPy np.cov(ddof=1) and Excel COVARIANCE.S', () => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(result.covariance[i]![j]!).toBeCloseTo(numpyBenchmark.covariance[i]![j]!, 12)
      }
    }
  })

  it('matches correlation matrix with NumPy np.corrcoef() and Excel CORREL', () => {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(result.correlation[i]![j]!).toBeCloseTo(numpyBenchmark.correlation[i]![j]!, 12)
      }
    }
  })

  it('matches Betas (β) against market with linear regression slope and Excel SLOPE', () => {
    for (let i = 0; i < 3; i++) {
      expect(result.betas[i]!).toBeCloseTo(numpyBenchmark.betas[i]!, 12)
    }
  })

  it('matches portfolio mean return and portfolio standard deviation (σₚ)', () => {
    expect(result.portfolioMean).toBeCloseTo(numpyBenchmark.portfolioMean, 12)
    expect(result.portfolioStdDev).toBeCloseTo(numpyBenchmark.portfolioStdDev, 12)
  })

  it('matches 1-day Parametric VaR with SciPy norm.ppf and Excel NORM.S.INV within 1e-6', () => {
    for (let k = 0; k < 3; k++) {
      const actual = result.varLevels[k]!
      const expected = numpyBenchmark.var1Day[k]!
      expect(actual.confidence).toBe(expected.confidence)
      expect(actual.z).toBeCloseTo(expected.z, 8)
      expect(actual.ratio).toBeCloseTo(expected.ratio, 8)
      expect(actual.amount).toBeCloseTo(expected.amount, 2)
    }
  })

  it('matches Basel 10-day Horizon VaR (scaled by √10) within 1e-6', () => {
    const result10 = calculateRisk({ ...input, horizonDays: 10 })
    for (let k = 0; k < 3; k++) {
      const actual = result10.varLevels[k]!
      const expected = numpyBenchmark.var10Day[k]!
      expect(actual.confidence).toBe(expected.confidence)
      expect(actual.z).toBeCloseTo(expected.z, 8)
      expect(actual.ratio).toBeCloseTo(expected.ratio, 8)
      expect(actual.amount).toBeCloseTo(expected.amount, 2)
    }
  })
})
