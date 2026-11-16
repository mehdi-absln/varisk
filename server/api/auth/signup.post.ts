import { createUser, findByEmail, toPublicUser } from '../../db/user-service'
import { useDb } from '../../db/index'
import { AUTH_MESSAGES, signUpSchema } from '#shared/utils/authSchema'

export default defineEventHandler(async (event) => {
  const input = await readValidated(event, signUpSchema)
  const db = useDb()

  if (await findByEmail(db, input.email)) {
    throw createError({ statusCode: 409, statusMessage: AUTH_MESSAGES.emailTaken })
  }

  const user = await createUser(db, input)
  await startSession(event, user.id)
  return { user: toPublicUser(user) }
})
