import type { H3Event } from 'h3'
import type { ZodType } from 'zod'

/**
 * Read a request body and check it against a schema.
 *
 * The first issue's message is the status message, and every schema in
 * `shared/` phrases its issues in Persian for a reader — so a failed request
 * says the same sentence the form would have said, and the client can show it
 * without a translation table.
 */
export async function readValidated<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message ?? 'ورودی نامعتبر است.',
    })
  }
  return result.data
}

/** A positive integer route parameter, or a 404 — never a NaN reaching SQL. */
export function idParam(event: H3Event, name = 'id'): number {
  const raw = getRouterParam(event, name)
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 404, statusMessage: 'یافت نشد.' })
  }
  return id
}
