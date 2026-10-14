#!/usr/bin/env node
/** robots.txt + ads.txt from env. ads.txt is written only for a real publisher id. */
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ROOT } from './lib/readContent.mjs'

const SITE_URL = (process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il').replace(/\/$/, '')

export function adsTxtLine(publisherId, enabled) {
  if (enabled !== true && enabled !== 'true') return null
  const match = String(publisherId || '').trim().match(/^(?:ca-)?(pub-\d+)$/)
  if (!match) return null
  return `google.com, ${match[1]}, DIRECT, f08c47fec0942fa0\n`
}

export function robotsTxt(siteUrl) {
  const base = String(siteUrl || 'https://whattowatch.co.il').replace(/\/$/, '')
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
}

async function main() {
  await writeFile(path.join(ROOT, 'public', 'robots.txt'), robotsTxt(SITE_URL), 'utf-8')
  await writeFile(path.join(ROOT, 'public', '.site-url'), `${SITE_URL}\n`, 'utf-8')
  console.log(`[generateHostFiles] robots.txt → ${SITE_URL}`)
  console.log(
    `[generateHostFiles] dotenv files before nuxt: .env=${existsSync(path.join(ROOT, '.env'))} .env.local=${existsSync(path.join(ROOT, '.env.local'))} .env.production=${existsSync(path.join(ROOT, '.env.production'))}`,
  )
  // Nuxt loads .env with override and would replace the Vercel host with the
  // local default. The build sandbox copy is disposable.
  if (process.env.VERCEL) {
    await unlink(path.join(ROOT, '.env')).catch(() => {})
    await unlink(path.join(ROOT, '.env.local')).catch(() => {})
    await unlink(path.join(ROOT, '.env.production')).catch(() => {})
  }

  const adsPath = path.join(ROOT, 'public', 'ads.txt')
  const line = adsTxtLine(process.env.NUXT_PUBLIC_ADSENSE_PUBLISHER_ID, process.env.NUXT_PUBLIC_ADSENSE_ENABLED)
  if (line) {
    await writeFile(adsPath, line, 'utf-8')
    console.log('[generateHostFiles] נכתב public/ads.txt')
  } else {
    await unlink(adsPath).catch(() => {})
    console.log('[generateHostFiles] אין מזהה AdSense — ads.txt לא נכתב')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[generateHostFiles] נכשל:', err)
    process.exitCode = 1
  })
}
