#!/usr/bin/env node
/** בונה public/llms.txt לפי מפרט llms.txt — מסמך Markdown שמנחה מנועי
 * AI (ChatGPT, Claude, Perplexity וכו') להבנה מהירה של האתר ותוכנו. */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ROOT, readNetflixMonths, readProviders } from './lib/readContent.mjs'

const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL || 'https://whattowatch.co.il'

async function main() {
  const months = await readNetflixMonths()
  const providers = await readProviders()

  const monthLinks = months
    .map((m) => `- [10 הסדרות הכי מומלצות בנטפליקס — ${m.monthLabel} ${m.year}](${SITE_URL}/netflix/${m.slug}): ${m.aiSummary}`)
    .join('\n')

  const providerLinks = providers
    .map((p) => `- [${p.name}](${SITE_URL}/providers/${p.slug}): ${p.seoDescription}`)
    .join('\n')

  const content = `# WhatToWatch.co.il

> אתר עברי המרכז המלצות סדרות וסרטים בסטרימינג, בדגש על נטפליקס.
> המדריך "טופ 10 בנטפליקס" מתעדכן אוטומטית כל חודש וכולל טריילרים,
> דירוגים, ז'אנרים ותקציר AI לכל כותר. הארכיטקטורה תומכת בספקי
> סטרימינג נוספים (Disney+, Prime Video וכו') ללא שינוי קוד.

## מדריכים חודשיים

${monthLinks || '- (עדיין לא נוצר תוכן חודשי)'}

## ספקים

${providerLinks}

## מידע נוסף

- [מדיניות פרטיות](${SITE_URL}/privacy)
- [תנאי שימוש](${SITE_URL}/terms)
`

  await writeFile(path.join(ROOT, 'public', 'llms.txt'), content, 'utf-8')
  console.log('[generateLlmsTxt] נכתב public/llms.txt')
}

main().catch((err) => {
  console.error('[generateLlmsTxt] נכשל:', err)
  process.exitCode = 1
})
