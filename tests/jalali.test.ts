import { describe, expect, it } from 'vitest'
import {
  daysInJalaliMonth,
  formatJalali,
  isJalaliLeap,
  jalaliSpanDays,
  parseJalali,
} from '../app/utils/jalali'

describe('isJalaliLeap', () => {
  it('matches known leap years', () => {
    expect(isJalaliLeap(1399)).toBe(true)
    expect(isJalaliLeap(1403)).toBe(true)
  })

  it('matches known common years', () => {
    expect(isJalaliLeap(1398)).toBe(false)
    expect(isJalaliLeap(1404)).toBe(false)
  })
})

describe('daysInJalaliMonth', () => {
  it('gives 31 days to the first six months', () => {
    expect(daysInJalaliMonth(1404, 1)).toBe(31)
    expect(daysInJalaliMonth(1404, 6)).toBe(31)
  })

  it('gives 30 days to months seven through eleven', () => {
    expect(daysInJalaliMonth(1404, 7)).toBe(30)
    expect(daysInJalaliMonth(1404, 11)).toBe(30)
  })

  it('varies Esfand with the leap year', () => {
    expect(daysInJalaliMonth(1403, 12)).toBe(30)
    expect(daysInJalaliMonth(1404, 12)).toBe(29)
  })
})

describe('parseJalali', () => {
  it('reads Persian digits', () => {
    expect(parseJalali('۱۴۰۴/۰۵/۱۲')).toEqual({ y: 1404, m: 5, d: 12 })
  })

  it('reads Latin digits and a dash separator', () => {
    expect(parseJalali('1403-12-30')).toEqual({ y: 1403, m: 12, d: 30 })
  })

  it('rejects Esfand 30 in a common year', () => {
    expect(parseJalali('1404/12/30')).toBeNull()
  })

  it('rejects an impossible month', () => {
    expect(parseJalali('1404/13/01')).toBeNull()
  })

  it('rejects malformed input', () => {
    expect(parseJalali('1404/05')).toBeNull()
    expect(parseJalali('دیروز')).toBeNull()
  })
})

describe('formatJalali', () => {
  it('pads and renders Persian digits', () => {
    expect(formatJalali({ y: 1404, m: 5, d: 2 })).toBe('۱۴۰۴/۰۵/۰۲')
  })
})

describe('jalaliSpanDays', () => {
  it('counts days inside one month', () => {
    expect(jalaliSpanDays({ y: 1404, m: 1, d: 1 }, { y: 1404, m: 1, d: 11 })).toBe(10)
  })

  it('counts across a month boundary', () => {
    expect(jalaliSpanDays({ y: 1404, m: 1, d: 1 }, { y: 1404, m: 2, d: 1 })).toBe(31)
  })

  it('counts a full common year', () => {
    expect(jalaliSpanDays({ y: 1404, m: 1, d: 1 }, { y: 1405, m: 1, d: 1 })).toBe(365)
  })

  it('counts a full leap year', () => {
    expect(jalaliSpanDays({ y: 1403, m: 1, d: 1 }, { y: 1404, m: 1, d: 1 })).toBe(366)
  })

  it('is negative when the range runs backwards', () => {
    expect(jalaliSpanDays({ y: 1404, m: 5, d: 1 }, { y: 1404, m: 4, d: 1 })).toBe(-31)
  })
})
