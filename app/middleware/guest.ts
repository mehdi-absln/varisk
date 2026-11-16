/** The mirror of `auth`: a signed-in visitor has no business on a sign-in form. */
export default defineNuxtRouteMiddleware(async () => {
  const { fetchUser } = useAuth()
  if (await fetchUser()) return navigateTo('/portfolios')
})
