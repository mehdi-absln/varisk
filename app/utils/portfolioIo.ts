import type { PortfolioInput } from '~/types/portfolio'
import { faInt } from '#shared/utils/format'
import { savedPortfolioSchema, type SavedPortfolio } from '#shared/utils/savedPortfolio'

/**
 * Between the form and a stored portfolio, in both directions.
 *
 * Kept out of the page and free of any component import — including the type of
 * a row, which is described structurally here rather than pulled out of
 * `StockRow.vue` — so the suite can exercise it without mounting anything.
 *
 * Prices make the round trip as numbers and come back as the text a textarea
 * holds, which is the same move `applyTable` makes for an uploaded file: the
 * stored series is normalised, and what the user sees on reload is what the
 * engine actually weighed, not the stray characters they originally pasted.
 */

/** The form's own shape, minus the row ids the page assigns. */
export interface PortfolioFormFill {
  stocks: { name: string, quantity: number | null, series: string }[]
  marketSeries: string
  dateStart: string
  dateEnd: string
  amountMode: PortfolioInput['amountMode']
  budget: number
}

export interface BuildResult {
  /** `null` when the portfolio cannot be stored as it stands. */
  payload: SavedPortfolio | null
  /** Why not, in the words the user would read under a field. */
  issues: string[]
}

/**
 * Check a resolved portfolio against the storage rules.
 *
 * The page only offers to save once the engine has produced a result, so this
 * usually passes — but «usually» is not a reason to send something the server
 * would refuse, and the limits here (how many stocks, how long a series) are
 * ones the calculator itself has no opinion about.
 */
export function buildPayload(title: string, input: PortfolioInput): BuildResult {
  const result = savedPortfolioSchema.safeParse({ ...input, title })

  return result.success
    ? { payload: result.data, issues: [] }
    : { payload: null, issues: result.error.issues.map(i => i.message) }
}

/** A stored portfolio, as the form holds it. */
export function toFormFill(payload: SavedPortfolio): PortfolioFormFill {
  return {
    stocks: payload.stocks.map(s => ({
      name: s.name,
      quantity: s.quantity,
      series: s.prices.join('\n'),
    })),
    marketSeries: payload.marketPrices.join('\n'),
    dateStart: payload.dateRange.start,
    dateEnd: payload.dateRange.end,
    amountMode: payload.amountMode,
    budget: payload.budget,
  }
}

/**
 * A title for a portfolio the user did not name.
 *
 * The first holding plus the count is what they would have typed themselves,
 * and it stays recognisable in a list of ten.
 */
export function suggestTitle(names: string[]): string {
  const named = names.map(n => n.trim()).filter(Boolean)
  if (!named.length) return 'پرتفوی بدون نام'
  if (named.length === 1) return named[0]!
  return `${named[0]} و ${faInt(named.length - 1)} سهم دیگر`
}
