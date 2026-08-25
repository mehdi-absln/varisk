/**
 * The system's suggested holding — the «عدد پیشنهادی» of the 1400 prototype.
 *
 * The rule is deliberately explainable: split the notional budget equally
 * across the stocks and buy whole shares at the latest price. The user can
 * always switch to «لیست دلخواه» and type their own numbers.
 */
export function suggestQuantity(prices: number[], stockCount: number, budget: number): number {
  const last = prices.at(-1)
  if (!last || last <= 0 || stockCount < 1 || budget <= 0) return 0
  return Math.max(1, Math.round(budget / stockCount / last))
}
