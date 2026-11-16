import { createPortfolio } from '../../db/portfolio-service'
import { useDb } from '../../db/index'
import { savedPortfolioSchema, summarise } from '#shared/utils/savedPortfolio'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const payload = await readValidated(event, savedPortfolioSchema)

  const row = await createPortfolio(useDb(), user.id, {
    title: payload.title,
    // Stored as the schema parsed it, not as it arrived: trimmed strings, no
    // extra keys. What comes back out is then something the schema has already
    // agreed with once.
    payload: JSON.stringify(payload),
    summary: summarise(payload),
  })

  setResponseStatus(event, 201)
  return { id: row.id }
})
