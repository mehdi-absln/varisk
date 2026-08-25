import { describe, expect, it } from 'vitest'
import { suggestQuantity } from '../app/utils/quantity'

describe('suggestQuantity', () => {
  it('splits the budget equally and buys whole shares at the latest price', () => {
    // 100,000,000 / 4 stocks = 25,000,000 at 8500 → 2941 shares
    expect(suggestQuantity([8000, 8500], 4, 100_000_000)).toBe(2941)
  })

  it('uses the latest price, not the first', () => {
    expect(suggestQuantity([1000, 2000], 1, 100_000)).toBe(50)
  })

  it('never suggests less than one share', () => {
    expect(suggestQuantity([1_000_000], 1, 100)).toBe(1)
  })

  it('returns zero when there is no usable price', () => {
    expect(suggestQuantity([], 4, 100_000_000)).toBe(0)
  })

  it('returns zero for a non-positive budget', () => {
    expect(suggestQuantity([8500], 4, 0)).toBe(0)
  })
})
