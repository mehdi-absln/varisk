import { describe, expect, it } from 'vitest'
import { sampleDateRange, sampleMarketSeries, sampleStocks } from '../app/utils/mock'
import { parsePriceSeries } from '../app/utils/parsePrices'
import { calculateBeta, calculateReturns, correlationMatrix } from '../app/utils/stats'

// The sample data is what the landing page and the «پرتفوی نمونه» button put in
// front of a first-time visitor, so it has to survive the same engine and the
// same validator as a real portfolio — and it has to look like a real market.

const stocks = sampleStocks()
const marketPrices = parsePriceSeries(sampleMarketSeries()).prices
const seriesPerStock = stocks.map(s => parsePriceSeries(s.series).prices)

describe('sample portfolio', () => {
  it('parses cleanly, with no token the parser has to reject', () => {
    for (const s of stocks) expect(parsePriceSeries(s.series).invalid).toEqual([])
    expect(parsePriceSeries(sampleMarketSeries()).invalid).toEqual([])
  })

  it('gives every stock the same series length as the market', () => {
    // The validator refuses ragged input, so the sample must not be ragged.
    for (const prices of seriesPerStock) expect(prices).toHaveLength(marketPrices.length)
  })

  it('quotes whole positive prices, as a real board would', () => {
    for (const prices of [...seriesPerStock, marketPrices]) {
      expect(prices.every(p => Number.isInteger(p) && p > 0)).toBe(true)
    }
  })

  it('names every stock and holds a positive quantity of it', () => {
    for (const s of stocks) {
      expect(s.name.trim()).not.toBe('')
      expect(s.quantity).toBeGreaterThan(0)
    }
  })

  it('is deterministic, so the server and the client agree', () => {
    // Math.random() here would break hydration; this is the guard on that.
    expect(sampleStocks()).toEqual(stocks)
    expect(sampleMarketSeries()).toBe(sampleMarketSeries())
    expect(sampleDateRange()).toEqual(sampleDateRange())
  })
})

describe('sample market factor', () => {
  const marketReturns = calculateReturns(marketPrices)
  const betas = seriesPerStock.map(prices => calculateBeta(calculateReturns(prices), marketReturns))

  it('drives every stock, so no sample beta is zero or negative', () => {
    // The whole point of the one-factor construction: before it, the stocks and
    // the market came off independent generators and the betas were noise.
    for (const beta of betas) expect(beta).toBeGreaterThan(0.2)
  })

  it('keeps the betas inside a range a reader would believe', () => {
    for (const beta of betas) expect(beta).toBeLessThan(2)
  })

  it('spreads the betas either side of 1, so the bar chart says something', () => {
    expect(Math.max(...betas)).toBeGreaterThan(1)
    expect(Math.min(...betas)).toBeLessThan(1)
  })

  it('leaves the stocks imperfectly correlated, not one factor in lockstep', () => {
    // A shared factor with no idiosyncratic noise would put every off-diagonal
    // entry at 1 and make the heatmap a solid block.
    const corr = correlationMatrix(seriesPerStock.map(p => calculateReturns(p)))
    for (let i = 0; i < corr.length; i++) {
      for (let j = i + 1; j < corr.length; j++) expect(Math.abs(corr[i]![j]!)).toBeLessThan(0.9)
    }
  })
})
