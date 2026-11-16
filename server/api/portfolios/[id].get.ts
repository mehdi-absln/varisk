import { getOwned } from '../../db/portfolio-service'
import { useDb } from '../../db/index'
import { parseSavedPayload } from '#shared/utils/savedPortfolio'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const row = await getOwned(useDb(), idParam(event), user.id)

  // Someone else's id and an id that never existed are the same answer. Saying
  // «403» here would confirm that the row exists, which is half of knowing
  // whose it is.
  if (!row) throw createError({ statusCode: 404, statusMessage: 'این پرتفوی پیدا نشد.' })

  const payload = parseSavedPayload(row.payload)
  if (!payload) {
    // Written by an older shape of this app, or edited underneath us. Better a
    // clear refusal than a form that half-fills.
    throw createError({ statusCode: 422, statusMessage: 'این پرتفوی قابل خواندن نیست.' })
  }

  return { id: row.id, updatedAt: row.updatedAt, payload }
})
