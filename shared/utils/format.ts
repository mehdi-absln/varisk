// Persian number formatting. Uses `fa-IR` so digits, the thousands separator
// (٬) and the decimal mark (٫) all match what a Persian reader expects.

const fa = (options?: Intl.NumberFormatOptions) => new Intl.NumberFormat('fa-IR', options)

/** Plain integer with Persian digits and grouping: 12400000 → ۱۲٬۴۰۰٬۰۰۰ */
export function faInt(n: number): string {
  return fa({ maximumFractionDigits: 0 }).format(n)
}

/** Fixed-decimal number: 1.6449 → ۱٫۶۴ */
export function faDecimal(n: number, digits = 2): string {
  return fa({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
}

/** Toman amount, rounded to whole toman. */
export function faToman(n: number): string {
  return `${faInt(Math.round(n))} تومان`
}

/** Fraction → percent: 0.0234 → ۲٫۳۴٪ */
export function faPercent(ratio: number, digits = 2): string {
  return `${faDecimal(ratio * 100, digits)}٪`
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Digits only, no grouping — for years, dates and other bare numbers. */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, d => PERSIAN_DIGITS[Number(d)]!)
}

/**
 * A stored timestamp as a Jalali date: 1755000000000 → ۱۴۰۴/۰۵/۲۳
 *
 * `jalali.ts` deliberately carries no Gregorian conversion — it only reads what
 * the user types. This is the other direction, and Intl already knows it.
 */
export function faDate(ms: number): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms))
}
