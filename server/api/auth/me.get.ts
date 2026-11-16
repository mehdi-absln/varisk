/** The current user, or `null`. A signed-out visitor is not an error. */
export default defineEventHandler(async (event) => {
  return { user: await getOptionalUser(event) }
})
