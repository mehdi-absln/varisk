/**
 * Named, not global: two pages need a session and the rest are open to
 * everyone, so this should not run on every navigation. Pages opt in with
 * `definePageMeta({ middleware: 'auth' })`.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchUser } = useAuth()
  if (await fetchUser()) return

  // Carries where they were going, so signing in finishes the trip instead of
  // dropping them on the home page.
  return navigateTo(`/auth/signin?next=${encodeURIComponent(to.fullPath)}`)
})
