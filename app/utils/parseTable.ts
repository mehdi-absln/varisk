import { toPersianDigits } from '#shared/utils/format'
import { toLatinDigits } from './parsePrices'

// Parsing for an uploaded price table: one column per stock, one row per day.
// This is what a user actually has — an export from Excel or TSETMC — rather
// than a series they retype stock by stock.

export interface TableColumn {
  name: string
  prices: number[]
}

export interface ParsedTable {
  columns: TableColumn[]
  /** Index of the column whose header looks like the market index, if any. */
  marketColumn: number | null
  rows: number
  notes: string[]
}

// Grouping marks: ASCII comma, Arabic comma (U+060C), Arabic thousands
// separator (U+066C). U+066B is the Persian *decimal* mark and is not one.
const GROUPING = /(?<=\d)[,،٬](?=\d{3}\b)/g
const DECIMAL_MARK = /٫/g

/**
 * A date in any of the usual shapes. Stripping its separators would turn
 * ۱۴۰۴/۰۱/۰۱ into the perfectly valid "price" 14040101, so it is rejected
 * before the digits are cleaned.
 */
const DATE_LIKE = /^\d{1,4}\s*[/\-.]\s*\d{1,2}\s*[/\-.]\s*\d{1,4}$/

/** Reads one cell as a positive number, or null if it is not one. */
function readCell(raw: string): number | null {
  const latin = toLatinDigits(raw).replace(/["“”]/g, '').trim()
  if (latin.includes('/') || DATE_LIKE.test(latin)) return null

  const cleaned = latin
    .replace(GROUPING, '')
    .replace(DECIMAL_MARK, '.')
    .replace(/[^\d.\-]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Splits a comma-delimited line, keeping commas that sit inside quotes. */
function splitQuoted(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === ',' && !inQuotes) { cells.push(cell); cell = '' }
    else cell += ch
  }
  cells.push(cell)
  return cells
}

/**
 * Tab wins over semicolon wins over comma; whitespace is the last resort.
 *
 * The hard case is a comma that means "thousands" rather than "next column".
 * Excel quotes those cells, so quoted lines are split quote-aware; on an
 * unquoted line, a comma sitting between a digit and exactly three more digits
 * is read as a grouping mark and removed before the split.
 */
function splitRow(line: string): string[] {
  if (line.includes('\t')) return line.split('\t')
  if (/[;؛]/.test(line)) return line.split(/[;؛]/)
  if (line.includes('"')) return splitQuoted(line)
  if (line.includes(',')) return line.replace(GROUPING, '').split(',')
  return line.trim().split(/\s+/)
}

const MARKET_WORDS = ['شاخص', 'بازار', 'index', 'market', 'tepix']

export function parsePriceTable(raw: string): ParsedTable {
  const notes: string[] = []
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  if (!lines.length) {
    return { columns: [], marketColumn: null, rows: 0, notes: ['فایل خالی است.'] }
  }

  const grid = lines.map(splitRow)
  const width = Math.max(...grid.map(r => r.length))

  // A first row that is mostly non-numeric is a header, not data.
  const firstRow = grid[0]!
  const numericInFirst = firstRow.filter(c => readCell(c) !== null).length
  const hasHeader = numericInFirst < Math.ceil(firstRow.length / 2)
  const header = hasHeader ? firstRow : null
  const body = hasHeader ? grid.slice(1) : grid

  if (!body.length) {
    return { columns: [], marketColumn: null, rows: 0, notes: ['فایل فقط سرستون دارد.'] }
  }

  const columns: TableColumn[] = []
  let marketColumn: number | null = null
  let skippedLabelColumns = 0

  for (let c = 0; c < width; c++) {
    const cells = body.map(row => row[c] ?? '')
    const prices = cells
      .map(readCell)
      .filter((n): n is number => n !== null)

    // A column that is mostly unreadable is a label column — dates, usually.
    if (prices.length < Math.ceil(cells.length / 2)) {
      skippedLabelColumns++
      continue
    }

    const name = header?.[c]?.trim().replace(/"/g, '')
      || `ستون ${toPersianDigits(columns.length + 1)}`

    if (marketColumn === null && MARKET_WORDS.some(w => name.toLowerCase().includes(w))) {
      marketColumn = columns.length
    }
    columns.push({ name, prices })
  }

  if (skippedLabelColumns) {
    notes.push(`${toPersianDigits(skippedLabelColumns)} ستون غیرعددی (مثل تاریخ) نادیده گرفته شد.`)
  }
  if (new Set(columns.map(c => c.prices.length)).size > 1) {
    notes.push('طول ستون‌ها یکسان نیست؛ سطرهای ناقص را بررسی کنید.')
  }
  if (!hasHeader) {
    notes.push('سرستونی پیدا نشد؛ نام سهم‌ها را دستی وارد کنید.')
  }

  return {
    columns,
    marketColumn,
    rows: columns.length ? Math.max(...columns.map(c => c.prices.length)) : 0,
    notes,
  }
}
