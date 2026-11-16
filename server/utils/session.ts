import type { H3Event } from 'h3'
import { findById, toPublicUser } from '../db/user-service'
import { useDb } from '../db/index'
import { AUTH_MESSAGES, type PublicUser } from '#shared/utils/authSchema'

/**
 * Reading and writing the session.
 *
 * The cookie is host-only on purpose — no `domain` is set. That means a session
 * started on `www.varisk.ir` does not exist on `varisk.ir`, which is correct
 * and also why exactly one of the two must be canonical and the other must
 * redirect to it. `runtimeConfig.public.siteUrl` says which one.
 */

const COOKIE = 'varisk_session'

function secret(): string {
  const { jwtSecret } = useRuntimeConfig()
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'کلید امضای نشست تنظیم نشده است (NUXT_JWT_SECRET).',
    })
  }
  return jwtSecret
}

export async function startSession(event: H3Event, userId: number): Promise<void> {
  setCookie(event, COOKIE, await signSession(secret(), { userId }), {
    httpOnly: true,
    secure: !import.meta.dev,
    // Not `strict`: that drops the cookie on the first navigation back from any
    // external link, and the user lands on their own site signed out.
    sameSite: 'lax',
    path: '/',
    // Seconds. h3 takes seconds here, whatever the milliseconds elsewhere.
    maxAge: SESSION_SECONDS,
  })
}

export function endSession(event: H3Event): void {
  deleteCookie(event, COOKIE, { path: '/' })
}

/** The signed-in user, or `null`. Never throws for an absent session. */
export async function getOptionalUser(event: H3Event): Promise<PublicUser | null> {
  const token = getCookie(event, COOKIE)
  if (!token) return null

  const claims = await verifySession(secret(), token)
  if (!claims) return null

  const user = await findById(useDb(), claims.userId)
  return user ? toPublicUser(user) : null
}

/** The signed-in user, or a 401. */
export async function requireUser(event: H3Event): Promise<PublicUser> {
  const user = await getOptionalUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: AUTH_MESSAGES.unauthenticated })
  }
  return user
}
