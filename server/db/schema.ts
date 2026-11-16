import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Two tables: who is asking, and what they saved.
 *
 * Timestamps are plain integer milliseconds — what `Date.now()` returns and
 * what `faDate` in `shared/utils/format.ts` reads — rather than drizzle's
 * `timestamp` mode, so no layer has to remember whether a column is seconds or
 * milliseconds.
 */

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Stored lowercased and trimmed; `authSchema` normalises before it checks. */
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  /** bcrypt hash. Never selected into anything that leaves the server. */
  password: text('password').notNull(),
  /**
   * The roadmap asks for roles, so the column is here and every account gets
   * `user`. Nothing reads it yet — this phase builds no administrative surface,
   * and inventing one nobody asked for is how a column becomes a lie.
   */
  role: text('role').notNull().default('user'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})
// `email` needs no separate index: `unique()` already builds one.

export const portfolios = sqliteTable('portfolios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  /**
   * The portfolio itself, as JSON: `savedPortfolioSchema` in
   * `shared/utils/savedPortfolio.ts` is the authority on its shape, on the way
   * in and on the way back out.
   */
  payload: text('payload').notNull(),

  /**
   * Enough to draw a card on «پروژه‌های من» without shipping every price series
   * to the list page. Both are derived **on the server** from the payload above
   * — see `summarise` — never taken from the request, so a stored number cannot
   * disagree with the portfolio it belongs to.
   *
   * Deliberately no VaR here. The engine lives in the app layer and the server
   * cannot recompute it, and a risk figure the server took on trust from a
   * client is exactly the kind of number this project does not print. The real
   * one appears when the portfolio is opened and the engine runs again.
   */
  stockCount: integer('stock_count').notNull(),
  totalValue: real('total_value').notNull(),

  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, table => [index('portfolios_user_id_idx').on(table.userId)])

export type UserRow = typeof users.$inferSelect
export type PortfolioRow = typeof portfolios.$inferSelect
