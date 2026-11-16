import { listForUser } from '../../db/portfolio-service'
import { useDb } from '../../db/index'

/** This user's portfolios, newest first. Summaries only — no price series. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return { portfolios: await listForUser(useDb(), user.id) }
})
