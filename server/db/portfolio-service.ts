import { and, desc, eq } from 'drizzle-orm'
import type { Db } from './index'
import { portfolios, type PortfolioRow } from './schema'

/**
 * Saved portfolios, as queries.
 *
 * One rule runs through every function here and is the reason they exist at
 * all: **a row is only ever reachable through its owner**. `userId` is part of
 * the WHERE clause of every read, every update and every delete — not checked
 * afterwards in the handler, where a future edit could forget it. A caller that
 * asks for someone else's row gets nothing back, and the handler turns that
 * into the same 404 a row that never existed would get.
 */

/** The server-derived snapshot stored beside the payload, for the list cards. */
export interface PortfolioSummary {
  stockCount: number
  totalValue: number
}

/** What the list page needs: everything except the price series. */
export type PortfolioListItem = Omit<PortfolioRow, 'payload' | 'userId'>

export async function listForUser(db: Db, userId: number): Promise<PortfolioListItem[]> {
  return db
    .select({
      id: portfolios.id,
      title: portfolios.title,
      stockCount: portfolios.stockCount,
      totalValue: portfolios.totalValue,
      createdAt: portfolios.createdAt,
      updatedAt: portfolios.updatedAt,
    })
    .from(portfolios)
    .where(eq(portfolios.userId, userId))
    .orderBy(desc(portfolios.updatedAt))
}

export async function getOwned(db: Db, id: number, userId: number): Promise<PortfolioRow | null> {
  const [row] = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function createPortfolio(
  db: Db,
  userId: number,
  input: { title: string, payload: string, summary: PortfolioSummary },
): Promise<PortfolioRow> {
  const now = Date.now()
  const [row] = await db
    .insert(portfolios)
    .values({
      userId,
      title: input.title,
      payload: input.payload,
      ...input.summary,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!row) throw new Error('insert returned no row')
  return row
}

/** Returns the updated row, or `null` when it is not this user's to update. */
export async function updatePortfolio(
  db: Db,
  id: number,
  userId: number,
  input: { title: string, payload: string, summary: PortfolioSummary },
): Promise<PortfolioRow | null> {
  const [row] = await db
    .update(portfolios)
    .set({
      title: input.title,
      payload: input.payload,
      ...input.summary,
      updatedAt: Date.now(),
    })
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)))
    .returning()
  return row ?? null
}

/** `false` when there was nothing of this user's to delete. */
export async function deletePortfolio(db: Db, id: number, userId: number): Promise<boolean> {
  const rows = await db
    .delete(portfolios)
    .where(and(eq(portfolios.id, id), eq(portfolios.userId, userId)))
    .returning({ id: portfolios.id })
  return rows.length > 0
}
