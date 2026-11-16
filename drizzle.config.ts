import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Nuxt loads .env.local for the app; drizzle-kit runs outside Nuxt, so it has
// to load the file itself. Same variable names either way — see nuxt.config.ts,
// where the NUXT_ prefix is what makes them runtime-overridable.
config({ path: '.env.local', quiet: true })

export default defineConfig({
  dialect: 'turso',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    // Local development points this at a plain file: no Turso account needed to
    // build the feature, and the same client speaks to both.
    url: process.env.NUXT_TURSO_URL || 'file:.data/varisk.db',
    // drizzle-kit insists on a non-empty token for the turso dialect even when
    // the URL is a local file, where libsql ignores it entirely. A placeholder
    // keeps one dialect for both development and production, which is the whole
    // point of developing against a file.
    authToken: process.env.NUXT_TURSO_AUTH_TOKEN || 'unused-for-file-urls',
  },
})
