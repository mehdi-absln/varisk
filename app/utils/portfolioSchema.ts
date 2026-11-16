import { z } from 'zod'
import { faInt } from '#shared/utils/format'
import { MIN_PRICES } from '#shared/utils/portfolioLimits'

/**
 * Validation for the portfolio form.
 *
 * The form holds raw text; `parsePriceSeries` and `suggestQuantity` turn it
 * into numbers. The schema takes over from there, so it never has to reason
 * about half-typed input — it checks a resolved portfolio.
 *
 * Every issue is raised against a path. Anything under `stocks[i]` belongs to
 * that row and is shown beneath it; everything else belongs to the form as a
 * whole. `validatePortfolio` does the splitting, so the rules live in one place
 * and the page only decides where to paint them.
 */

/** Shown under the offending row, so each is phrased about that row alone. */
export const ROW_MESSAGES = {
  name: 'نام سهم را وارد کنید.',
  quantity: 'تعداد باید بزرگ‌تر از صفر باشد.',
  tooFewPrices: `دست‌کم ${faInt(MIN_PRICES)} قیمت لازم است.`,
  ragged: 'طول سری قیمت با بقیهٔ سهم‌ها یکی نیست.',
} as const

/** Shown in the summary panel: these belong to no single row. */
export const FORM_MESSAGES = {
  empty: 'نام و تعداد دست‌کم یک سهم را وارد کنید.',
  budget: 'سرمایهٔ فرضی باید بزرگ‌تر از صفر باشد.',
  marketMissing: 'سری شاخص کل را وارد کنید.',
  marketLength: 'سری شاخص باید با سری سهم‌ها هم‌طول باشد.',
} as const

const rowSchema = z.object({
  name: z.string(),
  /** Effective share count: the system suggestion or the typed number. */
  quantity: z.number(),
  prices: z.array(z.number()),
})

const draftSchema = z.object({
  stocks: z.array(rowSchema),
  /** Market index series (شاخص کل). */
  marketPrices: z.array(z.number()),
  amountMode: z.enum(['suggested', 'custom']),
})

export type PortfolioDraft = z.infer<typeof draftSchema>

/**
 * A row counts as touched once it carries a name, a share count or a price —
 * untouched rows are the empty slots the form keeps at the bottom, and
 * complaining about them would flag the user's own blank canvas.
 */
function isFilled(row: z.infer<typeof rowSchema>): boolean {
  return Boolean(row.name.trim()) || row.quantity > 0 || row.prices.length > 0
}

/** The length most rows agree on; ties fall back to the first row's. */
function referenceLength(lengths: number[]): number {
  const tally = new Map<number, number>()
  for (const l of lengths) tally.set(l, (tally.get(l) ?? 0) + 1)

  let best = lengths[0]!
  for (const [length, count] of tally) {
    if (count > tally.get(best)!) best = length
  }
  return best
}

export const portfolioSchema = draftSchema.superRefine((draft, ctx) => {
  const atRow = (i: number, message: string) =>
    ctx.addIssue({ code: 'custom', message, path: ['stocks', i] })
  const atForm = (message: string) => ctx.addIssue({ code: 'custom', message })

  const filled = draft.stocks
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => isFilled(row))

  if (!filled.length) {
    atForm(FORM_MESSAGES.empty)
    return
  }

  for (const { row, index } of filled) {
    if (!row.name.trim()) atRow(index, ROW_MESSAGES.name)
    // In suggested mode the count comes from the budget, so a zero is the
    // budget's fault, not the row's — it is reported once, on the form.
    if (row.quantity <= 0 && draft.amountMode === 'custom') {
      atRow(index, ROW_MESSAGES.quantity)
    }
    if (row.prices.length < MIN_PRICES) atRow(index, ROW_MESSAGES.tooFewPrices)
  }

  if (draft.amountMode === 'suggested' && filled.some(({ row }) => row.quantity <= 0)) {
    atForm(FORM_MESSAGES.budget)
  }

  // Comparing lengths is only meaningful once every series is long enough;
  // until then «دست‌کم ۳ قیمت» is the more useful thing to say.
  if (filled.some(({ row }) => row.prices.length < MIN_PRICES)) return

  const reference = referenceLength(filled.map(({ row }) => row.prices.length))
  const ragged = filled.filter(({ row }) => row.prices.length !== reference)
  for (const { index } of ragged) atRow(index, ROW_MESSAGES.ragged)
  if (ragged.length) return

  if (!draft.marketPrices.length) atForm(FORM_MESSAGES.marketMissing)
  else if (draft.marketPrices.length !== reference) atForm(FORM_MESSAGES.marketLength)
})

export interface PortfolioIssues {
  /** One message list per input row, indexed as `draft.stocks`. */
  rows: string[][]
  /** Issues that belong to the portfolio rather than to any one row. */
  form: string[]
  /** Everything that still blocks a result, row messages tagged by row number. */
  all: string[]
}

/** Split the schema's issues into what each row shows and what the form shows. */
export function validatePortfolio(draft: PortfolioDraft): PortfolioIssues {
  const rows: string[][] = draft.stocks.map(() => [])
  const form: string[] = []

  const result = portfolioSchema.safeParse(draft)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const [key, index] = issue.path
      if (key === 'stocks' && typeof index === 'number') rows[index]!.push(issue.message)
      else form.push(issue.message)
    }
  }

  const all = [
    ...form,
    ...rows.flatMap((messages, i) =>
      messages.map(m => `ردیف ${faInt(i + 1)}: ${m}`)),
  ]

  return { rows, form, all }
}
