import tailwindcss from '@tailwindcss/vite'

// Applied before first paint so a stored light preference never flashes dark.
// Dark needs no attribute: it is what `:root` already is.
const THEME_BOOT = `try{if(localStorage.getItem('varisk-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`

/** Assets that are versioned by renaming the file, never by editing it. */
const FOREVER = 'public, max-age=31536000, immutable'

export default defineNuxtConfig({
  compatibilityDate: '2026-08-23',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      // Open Graph and canonical links must be absolute, and a build has no way
      // to know the host it will be served from. This is the production origin;
      // override it per environment with NUXT_PUBLIC_SITE_URL. Every absolute
      // URL the app emits — canonical, og:url, og:image, robots, sitemap —
      // resolves from this one value.
      siteUrl: 'https://www.varisk.ir',
    },
  },

  css: ['~/assets/css/main.css'],

  // Binds all interfaces so localhost stays reachable while a VPN is active.
  // Port 3001: almas keeps 3000 occupied on this machine.
  devServer: {
    host: '0.0.0.0',
    port: 3001,
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fa', dir: 'rtl' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // Matches the dark ground, so the phone chrome blends into the page.
        { name: 'theme-color', content: '#070B12', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#F5F8FC', media: '(prefers-color-scheme: light)' },
      ],
      link: [
        // The two faces first paint needs — Bold carries every heading, since
        // the 600 and 800 the design asks for both resolve to it. Fetched
        // alongside the stylesheet rather than after it. `crossorigin` is
        // required even same-origin, or the preload is discarded and refetched.
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Shabnam.woff2', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Shabnam-Bold.woff2', crossorigin: '' },
        // SVG first for the browsers that take it, .ico as the fallback — the
        // .ico carries 16/32/48 so nothing has to rescale a single bitmap.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      script: [{ innerHTML: THEME_BOOT, tagPosition: 'head' }],
    },
  },

  routeRules: {
    // Hashed bundles under /_nuxt already get an immutable year from Nitro.
    // Everything under public/ is served by its own plain name, so it needs
    // the policy stated. The fonts and the icons are versioned by editing the
    // filename, never in place; og.jpg is allowed to be a little staler than
    // the page that points at it, hence the day rather than the year.
    // Filenames are matched literally — a trailing '**' only spans path
    // segments, so it never matches an extension.
    '/fonts/**': { headers: { 'cache-control': FOREVER } },
    '/icon-192.png': { headers: { 'cache-control': FOREVER } },
    '/icon-512.png': { headers: { 'cache-control': FOREVER } },
    '/apple-touch-icon.png': { headers: { 'cache-control': FOREVER } },
    '/favicon.svg': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/favicon.ico': { headers: { 'cache-control': 'public, max-age=604800' } },
    '/og.jpg': { headers: { 'cache-control': 'public, max-age=86400' } },
  },

  nitro: {
    // Pre-compress at build time so the node server serves .br/.gz for the
    // hashed bundles. Vercel's edge would compress anyway; doing it in the
    // build means a plain `node .output/server/index.mjs` measures the same.
    compressPublicAssets: { gzip: true, brotli: true },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
