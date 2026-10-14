#!/usr/bin/env node
/**
 * מיגרציה חד-פעמית (אידמפוטנטית): קוראת מחדש buildMarkdown()+buildFaq()
 * על קבצי content/netflix/*.he.md קיימים (ו-public/data/netflix/*.json
 * המקבילים) כדי לעדכן אותם לפורמט העדכני — כולל שדה link ב-FAQ וכותרת
 * ה-intro (בלי H1 כפול). לא קוראת ל-TMDB — משתמשת בנתוני series
 * שכבר שמורים בכל קובץ. ניתן להריץ שוב בבטחה בכל פעם ש-buildMarkdown
 * או buildFaq משתנים.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { ROOT } from './lib/readContent.mjs'
import { buildFaq, buildMarkdown } from './fetchTopSeries.mjs'

async function main() {
  const contentDir = path.join(ROOT, 'content', 'netflix')
  const dataDir = path.join(ROOT, 'public', 'data', 'netflix')
  const files = (await readdir(contentDir)).filter((f) => f.endsWith('.he.md'))

  for (const file of files) {
    const raw = await readFile(path.join(contentDir, file), 'utf-8')
    const match = raw.match(/^---\n([\s\S]*?)\n---\n/)
    if (!match) {
      console.warn(`[backfillFaqLinks] מדלג על ${file} — לא נמצא frontmatter`)
      continue
    }
    const frontmatter = parseYaml(match[1])
    const faq = buildFaq(frontmatter.monthLabel, frontmatter.year, frontmatter.series)
    const markdown = buildMarkdown({ ...frontmatter, faq })

    await writeFile(path.join(contentDir, file), markdown, 'utf-8')

    const dataFile = path.join(dataDir, file.replace('.he.md', '.json'))
    try {
      const dataRaw = await readFile(dataFile, 'utf-8')
      const data = JSON.parse(dataRaw)
      data.faq = faq
      await writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8')
    } catch {
      // אין קובץ JSON מקביל — לא קריטי, ה-Markdown הוא מקור האמת לתוכן.
    }

    console.log(`[backfillFaqLinks] עודכן ${file}`)
  }
}

main().catch((err) => {
  console.error('[backfillFaqLinks] נכשל:', err)
  process.exitCode = 1
})
