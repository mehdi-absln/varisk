import { updatePortfolio } from '../../db/portfolio-service'
import { useDb } from '../../db/index'
import { savedPortfolioSchema, summarise } from '#shared/utils/savedPortfolio'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const payload = await readValidated(event, savedPortfolioSchema)

  const row = await updatePortfolio(useDb(), idParam(event), user.id, {
    title: payload.title,
    payload: JSON.stringify(payload),
    summary: summarise(payload),
  })

  if (!row) throw createError({ statusCode: 404, statusMessage: 'این پرتفوی پیدا نشد.' })
  return { id: row.id }
})
