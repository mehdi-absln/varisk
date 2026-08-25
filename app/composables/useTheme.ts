export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'varisk-theme'

/**
 * Dark is the default and lives in `:root`, so the server can render without
 * knowing anything; only a stored *light* preference needs an attribute, and
 * the inline script in `nuxt.config` applies it before first paint.
 */
export function useTheme() {
  const theme = useState<Theme>('theme', () => 'dark')

  onMounted(() => {
    theme.value = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  })

  watch(theme, (next) => {
    if (!import.meta.client) return
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    }
    catch {
      // Private browsing: the toggle still works, it just will not persist.
    }
  })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
}
