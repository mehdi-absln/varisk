import tailwindcss from '@tailwindcss/vite'

// Applied before first paint so a stored light preference never flashes dark.
// Dark needs no attribute: it is what `:root` already is.
const THEME_BOOT = `try{if(localStorage.getItem('varisk-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`

export default defineNuxtConfig({
  compatibilityDate: '2026-08-23',
  devtools: { enabled: true },

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
        { name: 'theme-color', content: '#070B12' },
      ],
      script: [{ innerHTML: THEME_BOOT, tagPosition: 'head' }],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
