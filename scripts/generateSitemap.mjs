#!/usr/bin/env node
/** בונה public/sitemap.xml סטטי מתוך תוכן חודשי + קונפיגורציית ספקים. */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ROOT, readNetflixMonths, readProviders } from './lib/readContent.mjs'
import { slugify } from './lib/slugify.mjs'

const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il'

function urlEntry(loc, { changefreq = 'monthly', priority = '0.5' } = {}) {
  return `  <url>\n    <loc>${SITE_URL}${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

async function main() {
  const months = await readNetflixMonths()
  const providers = await readProviders()

  const urls = [
    urlEntry('/', { changefreq: 'daily', priority: '1.0' }),
    urlEntry('/netflix', { changefreq: 'weekly', priority: '0.8' }),
    urlEntry('/search', { changefreq: 'monthly', priority: '0.3' }),
    urlEntry('/privacy', { changefreq: 'yearly', priority: '0.1' }),
    urlEntry('/terms', { changefreq: 'yearly', priority: '0.1' }),
  ]

  for (const provider of providers) {
    urls.push(urlEntry(`/providers/${provider.slug}`, { changefreq: 'weekly', priority: '0.7' }))
    urls.push(urlEntry(`/providers/${provider.slug}/top-10`, { changefreq: 'weekly', priority: '0.8' }))
  }

  const seenSeries = new Set()
  for (const month of months) {
    urls.push(urlEntry(`/netflix/${month.slug}`, { changefreq: 'monthly', priority: '0.9' }))
    for (const s of month.series) {
      const slug = slugify(s.name, s.tmdbId)
      if (seenSeries.has(slug)) continue
      seenSeries.add(slug)
      urls.push(urlEntry(`/providers/${month.provider}/series/${slug}`, { changefreq: 'monthly', priority: '0.6' }))
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  await writeFile(path.join(ROOT, 'public', 'sitemap.xml'), xml, 'utf-8')
  console.log(`[generateSitemap] נכתב public/sitemap.xml עם ${urls.length} כתובות`)
}

main().catch((err) => {
  console.error('[generateSitemap] נכשל:', err)
  process.exitCode = 1
})
