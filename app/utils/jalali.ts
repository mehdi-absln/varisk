import { toPersianDigits } from '#shared/utils/format'
import { toLatinDigits } from './parsePrices'

// Jalali (Shamsi) date handling for the "تاریخ اطلاعات" range.
//
// Only what this app needs: parse what the user types, validate it, and measure
// the span between two dates. No Gregorian conversion — nothing here needs one.

export interface JalaliDate {
  y: number
  m: number
  d: number
}

/** Months 1–6 have 31 days, 7–11 have 30, and Esfand has 29 or 30. */
const MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

/**
 * Leap years in the 33-year cycle. Exact across the range a portfolio tool
 * ever sees (1300–1500); the full 2820-year rule is not worth carrying.
 */
const LEAP_OFFSETS = [1, 5, 9, 13, 17, 22, 26, 30]

export function isJalaliLeap(year: number): boolean {
  return LEAP_OFFSETS.includes(((year % 33) + 33) % 33)
}

export function daysInJalaliMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0
  if (month === 12) return isJalaliLeap(year) ? 30 : 29
  return MONTH_DAYS[month - 1]!
}

/** Accepts Persian or Latin digits and / - or . as the separator. */
export function parseJalali(input: string): JalaliDate | null {
  const parts = toLatinDigits(input).trim().split(/[/\-.]/)
  if (parts.length !== 3) return null

  const [y, m, d] = parts.map(p => Number(p.trim()))
  if (![y, m, d].every(n => Number.isInteger(n))) return null
  if (y! < 1300 || y! > 1500) return null
  if (m! < 1 || m! > 12) return null
  if (d! < 1 || d! > daysInJalaliMonth(y!, m!)) return null

  return { y: y!, m: m!, d: d! }
}

export function formatJalali(date: JalaliDate): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return toPersianDigits(`${date.y}/${pad(date.m)}/${pad(date.d)}`)
}

/** Days elapsed since the start of year 1. Only differences are meaningful. */
export function jalaliDayIndex(date: JalaliDate): number {
  const priorYears = date.y - 1
  // Leap years among 1…priorYears: eight per full cycle, plus the offsets that
  // fit in the partial cycle at the end.
  const leaps =
    Math.floor(priorYears / 33) * 8 +
    LEAP_OFFSETS.filter(offset => offset <= priorYears % 33).length

  let days = priorYears * 365 + leaps
  for (let month = 1; month < date.m; month++) days += daysInJalaliMonth(date.y, month)
  return days + date.d
}

/** Calendar days from `from` to `to`; negative when the range is backwards. */
export function jalaliSpanDays(from: JalaliDate, to: JalaliDate): number {
  return jalaliDayIndex(to) - jalaliDayIndex(from)
}
