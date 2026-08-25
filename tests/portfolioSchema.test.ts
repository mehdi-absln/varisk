import { describe, expect, it } from 'vitest'
import { FORM_MESSAGES, ROW_MESSAGES, validatePortfolio } from '../app/utils/portfolioSchema'
import type { PortfolioDraft } from '../app/utils/portfolioSchema'

/** A portfolio that passes everything; each test breaks one thing. */
function valid(): PortfolioDraft {
  return {
    stocks: [
      { name: 'فولاد', quantity: 100, prices: [100, 110, 105] },
      { name: 'شپنا', quantity: 50, prices: [200, 190, 210] },
    ],
    marketPrices: [1000, 1020, 1010],
    amountMode: 'custom',
  }
}

describe('validatePortfolio', () => {
  it('accepts a complete portfolio', () => {
    const { rows, form, all } = validatePortfolio(valid())
    expect(all).toEqual([])
    expect(form).toEqual([])
    expect(rows).toEqual([[], []])
  })

  it('returns one message slot per input row, always', () => {
    const draft = valid()
    draft.stocks.push({ name: '', quantity: 0, prices: [] })
    expect(validatePortfolio(draft).rows).toHaveLength(3)
  })

  it('asks for a first stock, on the form, when nothing is filled in', () => {
    const { form, rows } = validatePortfolio({
      stocks: [{ name: '', quantity: 0, prices: [] }],
      marketPrices: [],
      amountMode: 'custom',
    })
    expect(form).toEqual([FORM_MESSAGES.empty])
    expect(rows[0]).toEqual([])
  })

  it('ignores untouched trailing rows', () => {
    const draft = valid()
    draft.stocks.push({ name: '', quantity: 0, prices: [] })
    expect(validatePortfolio(draft).all).toEqual([])
  })

  // ── Row-level issues ──────────────────────────────────────────────────────

  it('puts a missing name on the row that lacks it, not on the form', () => {
    const draft = valid()
    draft.stocks[1]!.name = '   '
    const { rows, form } = validatePortfolio(draft)
    expect(rows[0]).toEqual([])
    expect(rows[1]).toEqual([ROW_MESSAGES.name])
    expect(form).toEqual([])
  })

  it('flags every offending row separately', () => {
    const draft = valid()
    draft.stocks[0]!.name = ''
    draft.stocks[1]!.name = ''
    const { rows } = validatePortfolio(draft)
    expect(rows[0]).toEqual([ROW_MESSAGES.name])
    expect(rows[1]).toEqual([ROW_MESSAGES.name])
  })

  it('stacks several complaints on one row', () => {
    const draft = valid()
    draft.stocks[0]!.name = ''
    draft.stocks[0]!.quantity = 0
    expect(validatePortfolio(draft).rows[0])
      .toEqual([ROW_MESSAGES.name, ROW_MESSAGES.quantity])
  })

  it('rejects a negative share count on its row', () => {
    const draft = valid()
    draft.stocks[0]!.quantity = -5
    expect(validatePortfolio(draft).rows[0]).toContain(ROW_MESSAGES.quantity)
  })

  it('reports a short series on its row', () => {
    const draft = valid()
    draft.stocks[0]!.prices = [100, 110]
    expect(validatePortfolio(draft).rows[0]).toContain(ROW_MESSAGES.tooFewPrices)
  })

  it('flags only the row whose length disagrees with the others', () => {
    const draft = valid()
    draft.stocks.push({ name: 'وبملت', quantity: 10, prices: [50, 55, 52] })
    draft.stocks[1]!.prices = [200, 190, 210, 205]
    const { rows } = validatePortfolio(draft)
    expect(rows[0]).toEqual([])
    expect(rows[1]).toEqual([ROW_MESSAGES.ragged])
    expect(rows[2]).toEqual([])
  })

  it('says «too few prices» before «ragged» — the length is not comparable yet', () => {
    const draft = valid()
    draft.stocks[0]!.prices = [100]
    const { rows } = validatePortfolio(draft)
    expect(rows[0]).toEqual([ROW_MESSAGES.tooFewPrices])
    expect(rows[1]).toEqual([])
  })

  // ── Form-level issues ─────────────────────────────────────────────────────

  it('blames the budget, not the rows, when counts are system-suggested', () => {
    const draft = valid()
    draft.amountMode = 'suggested'
    draft.stocks[0]!.quantity = 0
    const { rows, form } = validatePortfolio(draft)
    expect(form).toEqual([FORM_MESSAGES.budget])
    expect(rows[0]).toEqual([])
  })

  it('requires the market series, on the form', () => {
    const draft = valid()
    draft.marketPrices = []
    expect(validatePortfolio(draft).form).toEqual([FORM_MESSAGES.marketMissing])
  })

  it('requires the market series to match the stock series length', () => {
    const draft = valid()
    draft.marketPrices = [1000, 1020, 1010, 1030]
    expect(validatePortfolio(draft).form).toEqual([FORM_MESSAGES.marketLength])
  })

  it('holds the market check back until the rows agree with each other', () => {
    const draft = valid()
    draft.stocks[1]!.prices = [200, 190, 210, 205]
    draft.marketPrices = []
    expect(validatePortfolio(draft).form).toEqual([])
  })

  // ── The summary line ──────────────────────────────────────────────────────

  it('tags row messages with their row number in the summary', () => {
    const draft = valid()
    draft.stocks[1]!.name = ''
    expect(validatePortfolio(draft).all).toEqual([`ردیف ۲: ${ROW_MESSAGES.name}`])
  })

  it('lists form issues before row issues in the summary', () => {
    const draft = valid()
    draft.stocks[0]!.name = ''
    draft.marketPrices = []
    expect(validatePortfolio(draft).all).toEqual([
      FORM_MESSAGES.marketMissing,
      `ردیف ۱: ${ROW_MESSAGES.name}`,
    ])
  })
})
