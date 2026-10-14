#!/usr/bin/env node
/**
 * מייצר content/genres/{slug}.json לכל עמוד ז'אנר — תוכן ייעודי, לא
 * גזור מהרשימות החודשיות (כי "מתח"/"רומנטי" אין להם genre ID אמיתי
 * ב-TMDB ל-TV, ולא כל ז'אנר בהכרח מופיע בטופ 10 של חודש נתון).
 *
 * הרצה: node scripts/fetchGenreShowcases.mjs
 */
import { generateAllGenreShowcases } from './fetchTopSeries.mjs'

async function main() {
  const results = await generateAllGenreShowcases()
  if (!results.length) return // כבר הזהרנו בתוך generateAllGenreShowcases
  const empty = results.filter((r) => r.count === 0)
  if (empty.length) {
    console.warn(`[fetchGenreShowcases] אזהרה: ${empty.map((r) => r.slug).join(', ')} חזרו ריקים לחלוטין.`)
  }
  console.log(`[fetchGenreShowcases] הושלם — ${results.length} ז'אנרים עודכנו.`)
}

main().catch((err) => {
  console.error('[fetchGenreShowcases] נכשל:', err)
  process.exitCode = 1
})
