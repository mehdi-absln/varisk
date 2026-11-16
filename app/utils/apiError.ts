/**
 * The sentence a failed request meant for the user.
 *
 * Every handler in `server/api` raises `createError` with a Persian
 * `statusMessage`, so the client has nothing to translate — it only has to dig
 * the message out of whatever shape ofetch wrapped it in, and fall back when
 * the failure was the network rather than the server.
 */
export function apiMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: { statusMessage?: string, message?: string } })?.data
  return data?.statusMessage || data?.message || fallback
}
