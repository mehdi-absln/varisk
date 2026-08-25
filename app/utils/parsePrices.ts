// Parsing for the pasted price series. Users copy out of Excel, TSETMC or a
// CSV, so the input arrives with Persian or Arabic digits, thousand separators
// and any mix of commas, tabs, spaces and newlines.

const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC = '٠١٢٣٤٥٦٧٨٩'

/** Rewrites Persian/Arabic-Indic digits to ASCII, leaving everything else. */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const p = PERSIAN.indexOf(d)
    return String(p >= 0 ? p : ARABIC.indexOf(d))
  })
}

export interface ParsedSeries {
  prices: number[]
  /** Tokens that were present but could not be read as a positive number. */
  invalid: string[]
}

/**
 * Splits a pasted block into a price series, oldest → newest.
 * Separators: newline, tab, comma, semicolon, Persian comma, or spaces.
 * Thousand separators (، ٬ , and spaces inside a number) are stripped.
 */
export function parsePriceSeries(raw: string): ParsedSeries {
  const prices: number[] = []
  const invalid: string[] = []

  const tokens = toLatinDigits(raw)
    // Drop grouping separators that sit between digits, so 12,400 stays one token.
    .replace(/(?<=\d)[,٬،\u066C ](?=\d{3}\b)/g, '')
    .split(/[\s،؛;,\t\r\n]+/)
    .filter(Boolean)

  for (const token of tokens) {
    // Persian decimal mark ٫ and stray currency words are common in pastes.
    const cleaned = token.replace(/٫/g, '.').replace(/[^\d.\-]/g, '')
    const n = Number(cleaned)
    if (cleaned === '' || !Number.isFinite(n) || n <= 0) invalid.push(token)
    else prices.push(n)
  }

  return { prices, invalid }
}
