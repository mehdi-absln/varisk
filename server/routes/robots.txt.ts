/**
 * Served from Nitro rather than `public/` so the Sitemap line follows
 * `NUXT_PUBLIC_SITE_URL`, exactly as the canonical and Open Graph URLs do —
 * a static file would have to hardcode a host the build cannot know.
 *
 * There must be no `public/robots.txt`: a public asset shadows a route of the
 * same path, and the stale copy would win silently.
 */
export default defineEventHandler((event) => {
  const site = useRuntimeConfig(event).public.siteUrl.replace(/\/$/, '')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-Agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`
})
