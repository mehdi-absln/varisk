import { describe, expect, it } from 'vitest'
import {
  SAVED_MESSAGES,
  parseSavedPayload,
  savedPortfolioSchema,
  summarise,
} from '../shared/utils/savedPortfolio'
import { MAX_PRICES, MAX_STOCKS, MAX_TITLE } from '../shared/utils/portfolioLimits'

/** A portfolio that passes everything; each test breaks one thing. */
function valid() {
  return {
    title: 'پرتفوی بانکی',
    stocks: [
      { name: 'فولاد', quantity: 100, prices: [10, 11, 12] },
      { name: 'ملت', quantity: 50, prices: [20, 21, 22] },
    ],
    marketPrices: [1000, 1010, 1020],
    dateRange: { start: '۱۴۰۴/۰۲/۰۱', end: '۱۴۰۴/۰۴/۲۵' },
    amountMode: 'custom' as const,
    budget: 1_000_000,
  }
}

const messageOf = (input: unknown) =>
  savedPortfolioSchema.safeParse(input).error?.issues[0]?.message

describe('savedPortfolioSchema', () => {
  it('accepts a complete portfolio', () => {
    expect(savedPortfolioSchema.safeParse(valid()).success).toBe(true)
  })

  it('requires a title', () => {
    expect(messageOf({ ...valid(), title: '  ' })).toBe(SAVED_MESSAGES.title)
  })

  it('bounds the title', () => {
    expect(messageOf({ ...valid(), title: 'ب'.repeat(MAX_TITLE + 1) })).toBe(SAVED_MESSAGES.titleLong)
  })

  it('requires at least one stock', () => {
    expect(messageOf({ ...valid(), stocks: [] })).toBe(SAVED_MESSAGES.noStocks)
  })

  it('bounds the number of stocks', () => {
    const one = valid().stocks[0]!
    const stocks = Array.from({ length: MAX_STOCKS + 1 }, () => ({ ...one }))
    expect(messageOf({ ...valid(), stocks })).toBe(SAVED_MESSAGES.tooManyStocks)
  })

  it('rejects a series shorter than the engine can weigh', () => {
    const input = valid()
    input.stocks[0]!.prices = [10, 11]
    input.stocks[1]!.prices = [20, 21]
    input.marketPrices = [1000, 1010]
    expect(messageOf(input)).toBe(SAVED_MESSAGES.tooFewPrices)
  })

  it('bounds the length of a series', () => {
    const input = valid()
    const long = Array.from({ length: MAX_PRICES + 1 }, (_, i) => i + 1)
    input.stocks[0]!.prices = long
    expect(messageOf(input)).toBe(SAVED_MESSAGES.tooManyPrices)
  })

  it('rejects a ragged portfolio, which the engine cannot index', () => {
    const input = valid()
    input.stocks[1]!.prices = [20, 21, 22, 23]
    expect(messageOf(input)).toBe(SAVED_MESSAGES.ragged)
  })

  it('rejects an index series of a different length', () => {
    expect(messageOf({ ...valid(), marketPrices: [1, 2, 3, 4] })).toBe(SAVED_MESSAGES.marketLength)
  })

  it('rejects a share count of zero', () => {
    const input = valid()
    input.stocks[0]!.quantity = 0
    expect(messageOf(input)).toBe(SAVED_MESSAGES.quantity)
  })

  it('rejects a negative or non-finite price', () => {
    const input = valid()
    input.stocks[0]!.prices = [10, -11, 12]
    expect(messageOf(input)).toBe(SAVED_MESSAGES.price)
  })

  it('rejects a NaN that JSON.parse would have let through as null', () => {
    const input = valid()
    input.stocks[0]!.prices = [10, Number.NaN, 12]
    expect(messageOf(input)).toBe(SAVED_MESSAGES.price)
  })

  it('allows an empty date range: it labels a result, it does not drive one', () => {
    const parsed = savedPortfolioSchema.safeParse({ ...valid(), dateRange: { start: '', end: '' } })
    expect(parsed.success).toBe(true)
  })

  it('drops keys nobody declared, so the column holds only the shape', () => {
    const parsed = savedPortfolioSchema.parse({ ...valid(), injected: 'whatever' })
    expect(parsed).not.toHaveProperty('injected')
  })
})

describe('parseSavedPayload', () => {
  it('reads back what the schema wrote', () => {
    const stored = JSON.stringify(savedPortfolioSchema.parse(valid()))
    expect(parseSavedPayload(stored)?.title).toBe('پرتفوی بانکی')
  })

  it('returns null for malformed JSON rather than throwing at the caller', () => {
    expect(parseSavedPayload('{not json')).toBeNull()
  })

  it('returns null for a row that no longer fits the rules', () => {
    expect(parseSavedPayload(JSON.stringify({ ...valid(), stocks: [] }))).toBeNull()
  })
})

describe('summarise', () => {
  it('values each position at its latest close', () => {
    // 100 × 12 + 50 × 22 = 1200 + 1100
    expect(summarise(savedPortfolioSchema.parse(valid()))).toEqual({
      stockCount: 2,
      totalValue: 2300,
    })
  })
})
