#!/usr/bin/env node
/** בונה public/feed.xml (RSS 2.0) — פריט אחד לכל מדריך חודשי. */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ROOT, netflixMonthSummary, readNetflixMonths } from './lib/readContent.mjs'

const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il'

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]))
}

async function main() {
  const months = await readNetflixMonths()

  const items = months
    .map(
      (m) => `  <item>
    <title>${escapeXml(`10 הסדרות הכי מומלצות בנטפליקס — ${m.monthLabel} ${m.year}`)}</title>
    <link>${SITE_URL}/netflix/${m.slug}</link>
    <guid>${SITE_URL}/netflix/${m.slug}</guid>
    <description>${escapeXml(netflixMonthSummary(m))}</description>
  </item>`,
    )
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>WhatToWatch.co.il — עדכון חודשי נטפליקס</title>
  <link>${SITE_URL}</link>
  <description>10 הסדרות הכי מומלצות בנטפליקס, מתעדכן כל חודש</description>
  <language>he-il</language>
${items}
</channel>
</rss>
`

  await writeFile(path.join(ROOT, 'public', 'feed.xml'), rss, 'utf-8')
  console.log(`[generateRSS] נכתב public/feed.xml עם ${months.length} פריטים`)
}

main().catch((err) => {
  console.error('[generateRSS] נכשל:', err)
  process.exitCode = 1
})
