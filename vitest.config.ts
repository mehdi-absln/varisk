import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The suite imports source files directly, outside Nuxt — no plugin, no
// environment, no setup. The one thing it cannot work out on its own is the
// `#shared` alias that app/ uses to reach shared/, so that is all this says.
export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
})
