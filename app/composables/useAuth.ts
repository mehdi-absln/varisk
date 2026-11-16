import { apiMessage } from '~/utils/apiError'
import type { PublicUser } from '#shared/utils/authSchema'

/**
 * Who is signed in.
 *
 * `useState` rather than a store: the app has two composables and no Pinia, and
 * this holds one nullable object. The fetch goes through `useRequestFetch` so
 * the session cookie is forwarded during SSR — plain `$fetch` on the server
 * carries no cookies, and every page would render signed out and then correct
 * itself after hydration.
 */

export function useAuth() {
  const user = useState<PublicUser | null>('auth:user', () => null)
  /** Whether `/api/auth/me` has answered once. Distinguishes «no» from «not yet». */
  const settled = useState<boolean>('auth:settled', () => false)

  const signedIn = computed(() => user.value !== null)

  /** Resolves the session once per app load; cheap and idempotent after that. */
  async function fetchUser(): Promise<PublicUser | null> {
    if (settled.value) return user.value

    try {
      const { user: fetched } = await useRequestFetch()('/api/auth/me')
      user.value = fetched
    }
    catch {
      // A visitor with no session is the common case, not an error worth showing.
      user.value = null
    }
    settled.value = true
    return user.value
  }

  async function signIn(body: { email: string, password: string }): Promise<void> {
    try {
      const { user: signed } = await $fetch('/api/auth/signin', { method: 'POST', body })
      user.value = signed
      settled.value = true
    }
    catch (error) {
      throw new Error(apiMessage(error, 'ورود انجام نشد. دوباره تلاش کنید.'))
    }
  }

  async function signUp(body: { name: string, email: string, password: string }): Promise<void> {
    try {
      const { user: created } = await $fetch('/api/auth/signup', { method: 'POST', body })
      user.value = created
      settled.value = true
    }
    catch (error) {
      throw new Error(apiMessage(error, 'ثبت‌نام انجام نشد. دوباره تلاش کنید.'))
    }
  }

  async function signOut(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    user.value = null
    settled.value = true
    await navigateTo('/')
  }

  return { user, signedIn, settled, fetchUser, signIn, signUp, signOut }
}
