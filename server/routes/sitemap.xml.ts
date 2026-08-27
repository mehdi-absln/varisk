/**
 * The sitemap, built against the configured site URL. See `robots.txt.ts` for
 * why this is a route and not a file in `public/`.
 */

/** Every indexable page, with its weight relative to the others. */
const PAGES = [
  { path: '/', priority: '1.0' },
  { path: '/calculate', priority: '0.8' },
]

export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')

  const urls = PAGES
    .map(p => `  <url><loc>${site}${p.path}</loc><priority>${p.priority}</priority></url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
