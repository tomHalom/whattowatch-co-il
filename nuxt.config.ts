export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',

  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  // Static-first: `nuxt generate` prerenders every route reachable by
  // crawling links starting from '/'. sitemap.xml / robots.txt /
  // llms.txt / feed.xml are plain files in /public (written by the
  // scripts/generate*.mjs automation scripts before build), not
  // server routes, so they don't need to be listed here.
  ssr: true,
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'he', dir: 'rtl' },
    },
  },

  i18n: {
    bundle: { optimizeTranslationDirective: false },
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il',
    locales: [
      { code: 'he', language: 'he-IL', dir: 'rtl', name: 'עברית', file: 'he.json' },
      // אנגלית מוכנה להפעלה עתידית — לא פעילה ב-MVP.
      // { code: 'en', language: 'en-US', dir: 'ltr', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'he',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales/',
  },

  runtimeConfig: {
    tmdbApiKey: process.env.TMDB_API_KEY || '',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il',
      siteName: 'WhatToWatch.co.il',
      adsensePublisherId: process.env.NUXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
      adsenseEnabled: process.env.NUXT_PUBLIC_ADSENSE_ENABLED === 'true',
      affiliateNordvpnId: process.env.NUXT_PUBLIC_AFFILIATE_NORDVPN_ID || '',
      affiliateAmazonTag: process.env.NUXT_PUBLIC_AFFILIATE_AMAZON_TAG || '',
    },
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 2, searchDepth: 2 },
      },
    },
  },

  image: {
    format: ['avif', 'webp'],
    quality: 80,
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  devtools: { enabled: true },
})
