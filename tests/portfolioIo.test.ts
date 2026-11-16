import { describe, expect, it } from 'vitest'
import { buildPayload, suggestTitle, toFormFill } from '../app/utils/portfolioIo'
import { SAVED_MESSAGES } from '../shared/utils/savedPortfolio'
import type { PortfolioInput } from '../app/types/portfolio'

function input(): PortfolioInput {
  return {
    stocks: [
      { name: 'فولاد', quantity: 100, prices: [10, 11, 12] },
      { name: 'ملت', quantity: 50, prices: [20, 21, 22] },
    ],
    marketPrices: [1000, 1010, 1020],
    dateRange: { start: '۱۴۰۴/۰۲/۰۱', end: '۱۴۰۴/۰۴/۲۵' },
    amountMode: 'custom',
    budget: 1_000_000,
  }
}

describe('buildPayload', () => {
  it('accepts what the engine accepted', () => {
    const { payload, issues } = buildPayload('پرتفوی بانکی', input())
    expect(issues).toEqual([])
    expect(payload?.title).toBe('پرتفوی بانکی')
  })

  it('reports the missing title in the words the user reads', () => {
    expect(buildPayload('   ', input()).issues).toContain(SAVED_MESSAGES.title)
  })

  it('refuses a portfolio the calculator has no opinion about but storage does', () => {
    const tooMany = { ...input(), stocks: Array.from({ length: 31 }, () => input().stocks[0]!) }
    const { payload, issues } = buildPayload('بزرگ', tooMany)
    expect(payload).toBeNull()
    expect(issues).toContain(SAVED_MESSAGES.tooManyStocks)
  })
})

describe('round trip', () => {
  it('gives the form back exactly what was saved', () => {
    const { payload } = buildPayload('پرتفوی بانکی', input())
    const fill = toFormFill(payload!)

    expect(fill).toEqual({
      stocks: [
        { name: 'فولاد', quantity: 100, series: '10\n11\n12' },
        { name: 'ملت', quantity: 50, series: '20\n21\n22' },
      ],
      marketSeries: '1000\n1010\n1020',
      dateStart: '۱۴۰۴/۰۲/۰۱',
      dateEnd: '۱۴۰۴/۰۴/۲۵',
      amountMode: 'custom',
      budget: 1_000_000,
    })
  })

  it('survives a second trip unchanged — the series text reparses to itself', () => {
    const first = buildPayload('یک', input()).payload!
    const fill = toFormFill(first)
    const second = buildPayload('یک', {
      stocks: fill.stocks.map(s => ({
        name: s.name,
        quantity: s.quantity,
        prices: parsePriceSeriesFor(s.series),
      })),
      marketPrices: parsePriceSeriesFor(fill.marketSeries),
      dateRange: { start: fill.dateStart, end: fill.dateEnd },
      amountMode: fill.amountMode,
      budget: fill.budget,
    }).payload!

    expect(second).toEqual(first)
  })

  it('carries the suggested mode back, so a reopened portfolio weighs the same', () => {
    const { payload } = buildPayload('یک', { ...input(), amountMode: 'suggested' })
    expect(toFormFill(payload!).amountMode).toBe('suggested')
  })
})

/** What the textarea does with the text `toFormFill` put in it. */
function parsePriceSeriesFor(series: string): number[] {
  return series.split('\n').map(Number)
}

describe('suggestTitle', () => {
  it('names a single holding after itself', () => {
    expect(suggestTitle(['فولاد'])).toBe('فولاد')
  })

  it('names a portfolio after its first holding and the rest', () => {
    expect(suggestTitle(['فولاد', 'ملت', 'خودرو'])).toBe('فولاد و ۲ سهم دیگر')
  })

  it('falls back rather than producing an empty title', () => {
    expect(suggestTitle(['  ', ''])).toBe('پرتفوی بدون نام')
  })
})
