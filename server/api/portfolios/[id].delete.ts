import { deletePortfolio } from '../../db/portfolio-service'
import { useDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const removed = await deletePortfolio(useDb(), idParam(event), user.id)
  if (!removed) throw createError({ statusCode: 404, statusMessage: 'این پرتفوی پیدا نشد.' })
  return { ok: true }
})
