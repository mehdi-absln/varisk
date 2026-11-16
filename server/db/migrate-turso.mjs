// One-shot migration runner for the Turso cloud DB. Runs the SQL in
// `server/db/migrations/0000_outstanding_chat.sql` against the URL/token
// given on the command line. drizzle-kit writes statements separated by
// `--> statement-breakpoint`, which this script splits on.
//
// Usage:  node server/db/migrate-turso.mjs <dbUrl> <authToken>
import { createClient } from '@libsql/client'
import { readFile } from 'node:fs/promises'

const [url, authToken] = process.argv.slice(2)
if (!url || !authToken) {
  console.error('usage: node server/db/migrate-turso.mjs <dbUrl> <authToken>')
  process.exit(2)
}

const client = createClient({ url, authToken })

const sql = await readFile(
  new URL('./migrations/0000_outstanding_chat.sql', import.meta.url),
  'utf8',
)
const statements = sql
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(Boolean)

console.log(`running ${statements.length} statements against ${url}`)
for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 70)
  try {
    await client.execute(stmt)
    console.log('  ok  -', preview)
  } catch (e) {
    console.error('  FAIL -', preview)
    console.error('       ', e.message)
    process.exit(1)
  }
}

// Verify by listing tables.
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
)
console.log('tables now in cloud DB:')
for (const row of tables.rows) console.log('  -', row.name)
