/**
 * Page metadata, in one place.
 *
 * Open Graph needs absolute URLs and a canonical link needs the real host, but
 * a static build cannot know where it will be served from — so every URL here
 * is resolved against `runtimeConfig.public.siteUrl` rather than written out.
 *
 * The site-wide half (card type, locale, the OG image) is declared once in
 * `app.vue`; a page only has to say what makes it different.
 */

/** Absolute URL for a root-relative path, from the configured site URL. */
export function useAbsoluteUrl(path = '/') {
  const base = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
  return `${base}${path}`
}

export interface PageSeo {
  title: string
  description: string
  /** Root-relative path of this page, for `og:url` and the canonical link. */
  path: string
}

/**
 * Title, description and the URL pair every page needs.
 *
 * `ogTitle` deliberately repeats `title`: leaving it unset makes some scrapers
 * fall back to the document title *including* whatever the tab shows, which is
 * not what should appear on a shared card.
 */
export function usePageSeo({ title, description, path }: PageSeo) {
  const url = useAbsoluteUrl(path)

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    twitterTitle: title,
    twitterDescription: description,
  })

  useHead({ link: [{ rel: 'canonical', href: url }] })
}
