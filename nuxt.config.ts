import tailwindcss from '@tailwindcss/vite'

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
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
