import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

/**
 * The database handle.
 *
 * `createDb` is a plain factory rather than a module-level singleton built from
 * `process.env`, for two reasons. A test can point it at `:memory:` and get a
 * real database with no Turso account and no mocks. And if this ever has to
 * leave Vercel, `file:` is a URL like any other — the swap is one environment
 * variable, not a rewrite.
 */
export function createDb(url: string, authToken?: string) {
  return drizzle(createClient({ url, authToken: authToken || undefined }), { schema })
}

export type Db = ReturnType<typeof createDb>

let cached: Db | null = null

/** The request-time handle, from runtime config. Cached across invocations. */
export function useDb(): Db {
  if (cached) return cached

  const config = useRuntimeConfig()
  if (!config.tursoUrl) {
    // Said plainly here rather than surfacing as a connection error three
    // frames deeper: on a fresh checkout this is the thing that is missing.
    throw createError({
      statusCode: 500,
      statusMessage: 'پایگاه داده پیکربندی نشده است (NUXT_TURSO_URL).',
    })
  }

  cached = createDb(config.tursoUrl, config.tursoAuthToken)
  return cached
}
