// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    public: {
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL || '',
    },
  },

  app: {
    head: {
      title: 'Game Rooms',
      meta: [
        { name: 'description', content: 'Play games with friends in real-time rooms' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  typescript: {
    strict: true,
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },
})
