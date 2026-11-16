// Shared contract between the portfolio form, the risk engine and the result
// components. `calculateRisk` in `app/utils/stats.ts` is the only producer of
// `RiskResult`, and it satisfies every invariant documented below.

/** A Jalali date, as the user types it: ۱۴۰۴/۰۵/۱۲ */
export type JalaliString = string

/**
 * The window the price series covers. Carried as metadata today — it labels the
 * result and is checked against the number of observations — and becomes the
 * actual query range when the TSETMC connection lands.
 */
export interface DateRange {
  start: JalaliString
  end: JalaliString
}

/**
 * Where the per-stock holding comes from.
 * - `suggested`: the system splits a notional budget across the stocks
 * - `custom`: the user types their own share counts
 */
export type AmountMode = 'suggested' | 'custom'

/** One holding: a share count plus the historical close prices behind it. */
export interface Stock {
  name: string
  /** Number of shares held. Position value is derived, never typed. */
  quantity: number | null
  /** Close prices, oldest → newest. */
  prices: number[]
}

/** Everything the engine needs to produce a `RiskResult`. */
export interface PortfolioInput {
  stocks: Stock[]
  /** Market index series (شاخص کل), same length as each stock series. */
  marketPrices: number[]
  dateRange: DateRange
  amountMode: AmountMode
  /** Notional capital behind the suggested share counts, in toman. */
  budget: number
  /** Risk horizon in trading days, default 1 (e.g. 10 for Basel 10-day). */
  horizonDays?: number
}

/** Value at Risk at one confidence level. */
export interface VarLevel {
  /** Confidence percentage, e.g. 90 | 95 | 99 */
  confidence: number
  /** One-sided standard normal quantile (inverse CDF) */
  z: number
  /** Loss as a fraction of portfolio value. */
  ratio: number
  /** Loss in toman. */
  amount: number
  /** Holding horizon in days (default 1). */
  horizonDays?: number
}

/**
 * Full output of the risk engine. Every array is indexed by stock, in the same
 * order as `names`; the matrices are n×n over that same order.
 */
export interface RiskResult {
  /** Risk horizon in trading days. */
  horizonDays?: number
  names: string[]
  /** Share count per stock. */
  quantities: number[]
  /** Position value per stock, = quantity × latest price. */
  values: number[]
  /** Normalised to sum 1. */
  weights: number[]
  /** Total portfolio value, in toman. */
  totalValue: number
  /** Number of return observations (prices.length − 1). */
  periods: number
  /** The window the prices came from, for labelling the result. */
  dateRange: DateRange
  /** How the share counts were arrived at. */
  amountMode: AmountMode

  /**
   * Per-stock return series, oldest → newest, each `periods` long. Always
   * filled by `calculateRisk`; optional because nothing renders it yet — the
   * "جدول بازدهی سهام‌ها" table is still to be built on top of it.
   */
  returns?: number[][]

  /** Per-stock mean simple return. */
  means: number[]
  /** Per-stock sample variance (n−1 denominator). */
  variances: number[]
  /** Per-stock standard deviation, = √variance. */
  stdDevs: number[]

  /** Covariance matrix Σ. Symmetric; diagonal equals `variances`. */
  covariance: number[][]
  /** Correlation matrix. Symmetric; diagonal is exactly 1. */
  correlation: number[][]
  /** β = Cov(rᵢ, r_market) / Var(r_market). */
  betas: number[]

  /** Weighted mean return of the portfolio. */
  portfolioMean: number
  /** σₚ = √(wᵀΣw). */
  portfolioStdDev: number

  /** Ordered 90 → 95 → 99. */
  varLevels: VarLevel[]
}
