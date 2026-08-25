import { describe, expect, it } from 'vitest'
import { parsePriceSeries, toLatinDigits } from '../app/utils/parsePrices'

describe('toLatinDigits', () => {
  it('rewrites Persian digits', () => {
    expect(toLatinDigits('۱۲۳۴۵')).toBe('12345')
  })

  it('rewrites Arabic-Indic digits', () => {
    expect(toLatinDigits('٤٥٦')).toBe('456')
  })

  it('leaves non-digits untouched', () => {
    expect(toLatinDigits('فولاد ۱۲')).toBe('فولاد 12')
  })
})

describe('parsePriceSeries', () => {
  it('reads a newline-separated column', () => {
    expect(parsePriceSeries('8400\n8520\n8390').prices).toEqual([8400, 8520, 8390])
  })

  it('reads a comma-separated row', () => {
    expect(parsePriceSeries('8400, 8520 ,8390').prices).toEqual([8400, 8520, 8390])
  })

  it('strips thousand separators', () => {
    expect(parsePriceSeries('12,400\n12٬650\n12،800').prices).toEqual([12400, 12650, 12800])
  })

  it('accepts Persian digits with the Persian decimal mark', () => {
    expect(parsePriceSeries('۱۲۳۴٫۵').prices).toEqual([1234.5])
  })

  it('collects unreadable tokens instead of producing NaN', () => {
    const { prices, invalid } = parsePriceSeries('8400\nتومان\n0\n8520')
    expect(prices).toEqual([8400, 8520])
    expect(invalid).toEqual(['تومان', '0'])
  })

  it('returns an empty series for empty input', () => {
    expect(parsePriceSeries('   \n  ')).toEqual({ prices: [], invalid: [] })
  })
})
