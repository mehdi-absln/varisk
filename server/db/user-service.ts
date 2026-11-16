import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { Db } from './index'
import { users, type UserRow } from './schema'
import type { PublicUser, SignUpInput } from '#shared/utils/authSchema'

/**
 * Users, as queries.
 *
 * Every function takes the handle rather than importing a singleton, so the
 * suite can hand it an in-memory database and exercise the real SQL.
 */

/**
 * Work factor. Twelve is the number the sibling project settled on and is still
 * the right order of magnitude: tens of milliseconds per attempt on a serverless
 * CPU, which is a rounding error for one sign-in and a wall for a guesser.
 */
const BCRYPT_ROUNDS = 12

/** Strips the hash. The only shape a user leaves the server in. */
export function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, name: row.name, email: row.email, role: row.role }
}

export async function findByEmail(db: Db, email: string): Promise<UserRow | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

export async function findById(db: Db, id: number): Promise<UserRow | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return user ?? null
}

export async function createUser(db: Db, input: SignUpInput): Promise<UserRow> {
  const now = Date.now()
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  if (!user) throw new Error('insert returned no row')
  return user
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
