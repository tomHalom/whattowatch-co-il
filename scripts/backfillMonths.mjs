#!/usr/bin/env node
/**
 * מייצר ארכיון של N חודשים אחורה (כולל החודש הנוכחי).
 *
 * כל חודש נבנה מסדרות נטפליקס שבאמת שודרו באותו חודש (חלון air_date),
 * ומדורגות לפי איכות × פופולריות — ראה fetchTopSeries.mjs. פופולריות
 * TMDB היא נתון של *עכשיו*, אבל היא מופעלת רק על קבוצת מועמדים שנכונה
 * לחודש, כך שכל חודש מקבל רשימה שונה ורלוונטית.
 *
 * הרצה: node scripts/backfillMonths.mjs [--months=12]
 */
import { generateMonth } from './fetchTopSeries.mjs'

const monthsArg = process.argv.find((a) => a.startsWith('--months='))
const MONTHS_BACK = monthsArg ? Number(monthsArg.split('=')[1]) : 12

async function main() {
  const now = new Date()

  for (let i = 0; i < MONTHS_BACK; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const monthIndex = d.getMonth()

    console.log(`[backfillMonths] ${year}-${String(monthIndex + 1).padStart(2, '0')}`)
    await generateMonth({ year, monthIndex })

    // עדינות מול TMDB rate limits בין חודשים.
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log(`[backfillMonths] הושלם — ${MONTHS_BACK} חודשים נוצרו/עודכנו.`)
}

main().catch((err) => {
  console.error('[backfillMonths] נכשל:', err)
  process.exitCode = 1
})
