import bcrypt from 'bcryptjs'
import { findByEmail, toPublicUser, verifyPassword } from '../../db/user-service'
import { useDb } from '../../db/index'
import { AUTH_MESSAGES, signInSchema } from '#shared/utils/authSchema'

/**
 * A bcrypt hash of nothing in particular.
 *
 * When the address is unknown there is no stored hash to compare against, and
 * returning immediately would make "no such account" measurably faster than
 * "wrong password" — the timing alone would answer a question the error message
 * deliberately refuses to answer. Comparing against this instead keeps both
 * paths the same shape.
 */
const DUMMY_HASH = '$2b$12$K1p8mZ3vQ9tYxL5nR7cJ2eW4uH6dS0aF8gB1iO3kP5rT7yU9wX2zC'

export default defineEventHandler(async (event) => {
  const input = await readValidated(event, signInSchema)
  const user = await findByEmail(useDb(), input.email)

  const ok = user
    ? await verifyPassword(input.password, user.password)
    : (await bcrypt.compare(input.password, DUMMY_HASH), false)

  if (!user || !ok) {
    throw createError({ statusCode: 401, statusMessage: AUTH_MESSAGES.credentials })
  }

  await startSession(event, user.id)
  return { user: toPublicUser(user) }
})
