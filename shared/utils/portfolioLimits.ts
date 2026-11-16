/**
 * The bounds a portfolio has to fit, wherever it is checked.
 *
 * They live in `shared/` because two layers need them now. The form checks them
 * while the user types; the API checks them again before a row is written,
 * because a request body is not necessarily something our own form produced.
 */

/** Fewest prices a series can carry and still yield a variance worth trusting. */
export const MIN_PRICES = 3

/** Most prices one series may carry. Roughly eight years of daily closes. */
export const MAX_PRICES = 2000

/** Most stocks one portfolio may hold. */
export const MAX_STOCKS = 30

/** Longest a saved portfolio's title may be. */
export const MAX_TITLE = 80

/** Longest a single stock's name may be. */
export const MAX_STOCK_NAME = 60

/**
 * Ceiling on one stored payload, as JSON.
 *
 * The limits above already bound it — 30 stocks × 2000 prices is the worst
 * case — but they bound it loosely, and a row is cheap to write and expensive
 * to read back. This is the number the API actually refuses on.
 */
export const MAX_PAYLOAD_BYTES = 512 * 1024
