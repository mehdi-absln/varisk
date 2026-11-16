import { SignJWT, jwtVerify } from 'jose'

/**
 * The session token.
 *
 * It carries the user id and nothing else. Name, email and role are read from
 * the row on every request, so an account that is renamed — or deleted — does
 * not keep an old copy of itself alive inside a cookie for a week.
 *
 * The secret is a parameter rather than module state: it makes this pair of
 * functions testable, and it keeps `useRuntimeConfig` at the edge where the
 * request is, instead of at import time.
 */

export interface SessionClaims {
  userId: number
}

/** How long a session lasts. Used for both the JWT and the cookie. */
export const SESSION_SECONDS = 7 * 24 * 60 * 60

export function signSession(secret: string, claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(new TextEncoder().encode(secret))
}

/** `null` for anything that is not a live, correctly signed session. */
export async function verifySession(secret: string, token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return typeof payload.userId === 'number' ? { userId: payload.userId } : null
  }
  catch {
    return null
  }
}
