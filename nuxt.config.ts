import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify } from './app/utils/slugify'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

function resolveSiteUrl(): string {
  // generateHostFiles writes this before `nuxt generate`. Prefer it so a
  // later dotenv load cannot put the canonical host back on the unregistered domain.
  try {
    const fromFile = readFileSync(path.join(ROOT, 'public', '.site-url'), 'utf-8').trim()
    if (fromFile) return fromFile.replace(/\/$/, '')
  } catch {
    // fresh checkout before the first generate
  }
  return (process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il').replace(/\/$/, '')
}

const siteUrl = resolveSiteUrl()

// Cards no longer <a href> to series-detail pages (they open a modal
// instead), so Nitro's link-crawler can no longer *discover*
// /providers/{provider}/series/{slug} or /providers/{provider}(/top-10)
// on its own — yet generateSitemap.mjs still (correctly) lists them.
// Without this, `nuxt generate` would ship a sitemap full of URLs that
// 404 on the static host. Reads the same on-disk data the sitemap
// script reads, so the two stay in sync automatically.
function collectDynamicRoutes(): string[] {
  const routes: string[] = []

  const providersDir = path.join(ROOT, 'content', 'providers')
  let providerSlugs: string[] = []
  try {
    providerSlugs = readdirSync(providersDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(path.join(providersDir, f), 'utf-8')).slug)
  } catch {
    // no providers yet — fine on a fresh checkout
  }
  for (const slug of providerSlugs) {
    routes.push(`/providers/${slug}`, `/providers/${slug}/top-10`)
  }

  const netflixDataDir = path.join(ROOT, 'public', 'data', 'netflix')
  const seen = new Set<string>()
  try {
    for (const file of readdirSync(netflixDataDir).filter((f) => f.endsWith('.json'))) {
      const month = JSON.parse(readFileSync(path.join(netflixDataDir, file), 'utf-8'))
      for (const s of month.series ?? []) {
        const key = `${month.provider}/${s.tmdbId}/${s.name}`
        if (seen.has(key)) continue
        seen.add(key)
        routes.push(`/providers/${month.provider}/series/${slugify(s.name, s.tmdbId)}`)
      }
    }
  } catch {
    // no monthly data generated yet — fine on a fresh checkout
  }

  return routes
}

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
      routes: ['/', '/search', ...collectDynamicRoutes()],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'he', dir: 'rtl' },
    },
  },

  i18n: {
    bundle: { optimizeTranslationDirective: false },
    baseUrl: siteUrl,
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
    public: {
      siteUrl,
      siteName: 'WhatToWatch.co.il',
      adsensePublisherId: process.env.NUXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
      adsenseEnabled: process.env.NUXT_PUBLIC_ADSENSE_ENABLED === 'true',
      adsenseSlotHome: process.env.NUXT_PUBLIC_ADSENSE_SLOT_HOME || '',
      adsenseSlotProvider: process.env.NUXT_PUBLIC_ADSENSE_SLOT_PROVIDER || '',
      adsenseSlotMonthly: process.env.NUXT_PUBLIC_ADSENSE_SLOT_MONTHLY || '',
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

  hooks: {
    ready(nuxt) {
      const fromEnv = (process.env.NUXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
      if (fromEnv) nuxt.options.runtimeConfig.public.siteUrl = fromEnv
    },
  },
})
