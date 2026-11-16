import { readFileSync, readdirSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { createDb, type Db } from '../server/db/index'
import { users } from '../server/db/schema'
import {
  createPortfolio,
  deletePortfolio,
  getOwned,
  listForUser,
  updatePortfolio,
} from '../server/db/portfolio-service'
import { createUser, findByEmail, toPublicUser, verifyPassword } from '../server/db/user-service'

/**
 * The real SQL, against a real database, with no Turso account and no mocks —
 * which is the reason `createDb` is a factory instead of a singleton.
 *
 * What this file is actually here to prove: **a row is only reachable through
 * its owner.** It is the one defect in this phase that would be silent — no
 * error, no crash, just one person reading another person's portfolio.
 */

const MIGRATIONS = 'server/db/migrations'

async function freshDb(): Promise<Db> {
  const db = createDb(':memory:')

  // The migrations the app actually ships, not a hand-written copy that could
  // drift from them.
  const files = readdirSync(MIGRATIONS).filter(f => f.endsWith('.sql')).sort()
  expect(files.length).toBeGreaterThan(0)

  for (const file of files) {
    const statements = readFileSync(`${MIGRATIONS}/${file}`, 'utf8')
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(Boolean)
    for (const statement of statements) await db.run(sql.raw(statement))
  }
  return db
}

/** Inserted directly: these tests are about ownership, not about hashing. */
async function addUser(db: Db, email: string): Promise<number> {
  const now = Date.now()
  const [row] = await db
    .insert(users)
    .values({ email, name: email, password: 'x', createdAt: now, updatedAt: now })
    .returning()
  return row!.id
}

const somePortfolio = (title: string) => ({
  title,
  payload: JSON.stringify({ title, stocks: [] }),
  summary: { stockCount: 2, totalValue: 2300 },
})

describe('portfolio ownership', () => {
  let db: Db
  let alice: number
  let bob: number
  let aliceRow: number

  beforeEach(async () => {
    db = await freshDb()
    alice = await addUser(db, 'alice@varisk.ir')
    bob = await addUser(db, 'bob@varisk.ir')
    aliceRow = (await createPortfolio(db, alice, somePortfolio('پرتفوی آلیس'))).id
  })

  it('lists only the asking user’s rows', async () => {
    await createPortfolio(db, bob, somePortfolio('پرتفوی باب'))

    expect((await listForUser(db, alice)).map(p => p.title)).toEqual(['پرتفوی آلیس'])
    expect((await listForUser(db, bob)).map(p => p.title)).toEqual(['پرتفوی باب'])
  })

  it('never returns the price series to the list page', async () => {
    const [row] = await listForUser(db, alice)
    expect(row).not.toHaveProperty('payload')
    expect(row).not.toHaveProperty('userId')
  })

  it('orders newest first', async () => {
    const older = await createPortfolio(db, alice, somePortfolio('قدیمی'))
    await db.run(sql`update portfolios set updated_at = 1 where id = ${older.id}`)

    expect((await listForUser(db, alice)).map(p => p.title)).toEqual(['پرتفوی آلیس', 'قدیمی'])
  })

  it('hands the row to its owner', async () => {
    expect((await getOwned(db, aliceRow, alice))?.title).toBe('پرتفوی آلیس')
  })

  it('hands nothing to anyone else — the same nothing a missing row gives', async () => {
    expect(await getOwned(db, aliceRow, bob)).toBeNull()
    expect(await getOwned(db, 9999, alice)).toBeNull()
  })

  it('refuses an update from a stranger, and leaves the row untouched', async () => {
    const result = await updatePortfolio(db, aliceRow, bob, somePortfolio('ربوده‌شده'))

    expect(result).toBeNull()
    expect((await getOwned(db, aliceRow, alice))?.title).toBe('پرتفوی آلیس')
  })

  it('lets the owner update, and moves the summary with it', async () => {
    const updated = await updatePortfolio(db, aliceRow, alice, {
      ...somePortfolio('نام تازه'),
      summary: { stockCount: 5, totalValue: 42 },
    })

    expect(updated?.title).toBe('نام تازه')
    expect(updated?.stockCount).toBe(5)
    expect(updated?.totalValue).toBe(42)
  })

  it('refuses a delete from a stranger, and leaves the row standing', async () => {
    expect(await deletePortfolio(db, aliceRow, bob)).toBe(false)
    expect(await getOwned(db, aliceRow, alice)).not.toBeNull()
  })

  it('lets the owner delete, once', async () => {
    expect(await deletePortfolio(db, aliceRow, alice)).toBe(true)
    expect(await deletePortfolio(db, aliceRow, alice)).toBe(false)
  })
})

describe('user service', () => {
  it('stores a hash, not a password, and can check one against it', async () => {
    const db = await freshDb()
    const user = await createUser(db, {
      name: 'مهدی',
      email: 'mehdi@varisk.ir',
      password: 'longenough',
    })

    expect(user.password).not.toBe('longenough')
    expect(await verifyPassword('longenough', user.password)).toBe(true)
    expect(await verifyPassword('wrong-one', user.password)).toBe(false)
  })

  it('gives every new account the default role', async () => {
    const db = await freshDb()
    const user = await createUser(db, { name: 'م', email: 'a@b.ir', password: 'longenough' })
    expect(user.role).toBe('user')
  })

  it('finds by the normalised address', async () => {
    const db = await freshDb()
    await createUser(db, { name: 'م', email: 'a@b.ir', password: 'longenough' })
    expect((await findByEmail(db, 'a@b.ir'))?.name).toBe('م')
    expect(await findByEmail(db, 'nobody@b.ir')).toBeNull()
  })

  it('never lets the hash out through the public shape', async () => {
    const db = await freshDb()
    const user = await createUser(db, { name: 'م', email: 'a@b.ir', password: 'longenough' })
    expect(toPublicUser(user)).not.toHaveProperty('password')
  })
})
