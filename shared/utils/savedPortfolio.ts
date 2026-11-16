import { z } from 'zod'
import { toPersianDigits } from './format'
import {
  MAX_PAYLOAD_BYTES,
  MAX_PRICES,
  MAX_STOCK_NAME,
  MAX_STOCKS,
  MAX_TITLE,
  MIN_PRICES,
} from './portfolioLimits'

/**
 * What a saved portfolio is, on the wire and in the `payload` column.
 *
 * It is the engine's own input — the same shape `PortfolioInput` describes in
 * `app/types/portfolio.ts` — plus the title the user gave it. Deliberately not
 * the `RiskResult`: that is derived, and storing it would mean one day showing
 * a number that did not come from the data printed beside it. Loading a
 * portfolio re-runs `calculateRisk` like any other input.
 *
 * Checked in both directions. On write, because a request body is not
 * necessarily something our own form produced. On read, because a row written
 * by an older version of this app is exactly as untrusted — better a clear
 * refusal than a form that half-fills and an engine that returns NaN.
 */

export const SAVED_MESSAGES = {
  title: 'عنوان پرتفوی را وارد کنید.',
  titleLong: `عنوان نباید بلندتر از ${toPersianDigits(MAX_TITLE)} نویسه باشد.`,
  noStocks: 'پرتفوی باید دست‌کم یک سهم داشته باشد.',
  tooManyStocks: `بیشتر از ${toPersianDigits(MAX_STOCKS)} سهم پشتیبانی نمی‌شود.`,
  name: 'نام سهم را وارد کنید.',
  quantity: 'تعداد سهم باید بزرگ‌تر از صفر باشد.',
  price: 'قیمت‌ها باید عددهای مثبت باشند.',
  tooFewPrices: `هر سری باید دست‌کم ${toPersianDigits(MIN_PRICES)} قیمت داشته باشد.`,
  tooManyPrices: `هر سری حداکثر ${toPersianDigits(MAX_PRICES)} قیمت می‌تواند داشته باشد.`,
  ragged: 'طول سری قیمت سهم‌ها با هم یکی نیست.',
  marketLength: 'سری شاخص کل باید با سری سهم‌ها هم‌طول باشد.',
  budget: 'سرمایهٔ فرضی نمی‌تواند منفی باشد.',
  tooLarge: 'حجم این پرتفوی از حد مجاز بیشتر است.',
} as const

/** A finite, strictly positive number — what a price and a share count are. */
const positive = (message: string) =>
  z.number({ error: message }).refine(n => Number.isFinite(n) && n > 0, message)

const priceSeries = z
  .array(positive(SAVED_MESSAGES.price))
  .min(MIN_PRICES, SAVED_MESSAGES.tooFewPrices)
  .max(MAX_PRICES, SAVED_MESSAGES.tooManyPrices)

const stockSchema = z.object({
  name: z.string().trim().min(1, SAVED_MESSAGES.name).max(MAX_STOCK_NAME),
  /** Already resolved: the typed count, or what the budget suggested. */
  quantity: positive(SAVED_MESSAGES.quantity),
  /** Close prices, oldest → newest. */
  prices: priceSeries,
})

/**
 * Both dates are optional in the form and stay optional here — the range labels
 * a result, it does not drive one. Bounded only so the column cannot be used
 * as free storage.
 */
const dateRangeSchema = z.object({
  start: z.string().max(20),
  end: z.string().max(20),
})

export const savedPortfolioSchema = z
  .object({
    title: z.string().trim().min(1, SAVED_MESSAGES.title).max(MAX_TITLE, SAVED_MESSAGES.titleLong),
    stocks: z
      .array(stockSchema)
      .min(1, SAVED_MESSAGES.noStocks)
      .max(MAX_STOCKS, SAVED_MESSAGES.tooManyStocks),
    marketPrices: priceSeries,
    dateRange: dateRangeSchema,
    amountMode: z.enum(['suggested', 'custom']),
    budget: z.number({ error: SAVED_MESSAGES.budget }).refine(n => Number.isFinite(n) && n >= 0, SAVED_MESSAGES.budget),
  })
  .superRefine((payload, ctx) => {
    // Zod 4 runs this even when the object above already failed, so nothing
    // here may assume the shape it was given is the shape it wanted.
    const first = payload.stocks[0]
    if (!first) return

    // The engine indexes every matrix by stock over a common period count, so
    // a ragged portfolio is not a portfolio it can weigh.
    const length = first.prices.length
    if (payload.stocks.some(s => s.prices.length !== length)) {
      ctx.addIssue({ code: 'custom', message: SAVED_MESSAGES.ragged, path: ['stocks'] })
      return
    }
    if (payload.marketPrices.length !== length) {
      ctx.addIssue({ code: 'custom', message: SAVED_MESSAGES.marketLength, path: ['marketPrices'] })
    }
    // Measured after parsing rather than on the raw body: what matters is the
    // size of what we are about to store, not the size of what was sent.
    if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) {
      ctx.addIssue({ code: 'custom', message: SAVED_MESSAGES.tooLarge })
    }
  })

/** A saved portfolio, validated. Satisfies `PortfolioInput` plus the title. */
export type SavedPortfolio = z.infer<typeof savedPortfolioSchema>

/**
 * Parse a `payload` column back into a portfolio, or `null` if the row cannot
 * be trusted — malformed JSON and a payload that no longer fits the rules are
 * the same kind of unusable, and both are the caller's problem to report.
 */
export function parseSavedPayload(json: string): SavedPortfolio | null {
  try {
    const result = savedPortfolioSchema.safeParse(JSON.parse(json))
    return result.success ? result.data : null
  }
  catch {
    return null
  }
}

/**
 * The two numbers a list card shows, derived from the payload.
 *
 * Kept next to the schema because it is only ever correct for something that
 * has passed it: a validated payload has at least one stock and at least
 * `MIN_PRICES` prices in every series, so `at(-1)` is a real close price and
 * the sum is a real position value.
 *
 * This is what the API stores. It never stores a number the client sent.
 */
export function summarise(payload: SavedPortfolio): { stockCount: number, totalValue: number } {
  return {
    stockCount: payload.stocks.length,
    totalValue: payload.stocks.reduce((sum, s) => sum + s.quantity * s.prices.at(-1)!, 0),
  }
}
