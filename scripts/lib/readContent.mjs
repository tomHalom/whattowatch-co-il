import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

export const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..', '..')

/** קורא את כל קבצי public/data/netflix/*.json — מקור אמת פשוט (JSON
 * שטוח) לסקריפטי build שרצים מחוץ להקשר של Nuxt Content, כדי לא
 * להיות תלויים ב-API הפנימי של @nuxt/content בסקריפטים חיצוניים. */
export async function readNetflixMonths() {
  const dir = path.join(ROOT, 'public', 'data', 'netflix')
  let files = []
  try {
    files = await readdir(dir)
  } catch {
    return []
  }
  const months = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map((f) => readFile(path.join(dir, f), 'utf-8').then((raw) => JSON.parse(raw))),
  )
  return months.sort((a, b) => b.slug.localeCompare(a.slug))
}

/** Monthly JSON often has no aiSummary (it lives on the markdown only).
 * Agents and the RSS feed need a real sentence either way. */
export function netflixMonthSummary(month) {
  const written = typeof month.aiSummary === 'string' ? month.aiSummary.replace(/\s+/g, ' ').trim() : ''
  if (written) return written
  return `10 הסדרות שצוות הבינג'יונרים המוסמכים שלנו ממליץ עליהן בנטפליקס לחודש ${month.monthLabel} ${month.year} — עם טריילרים, דירוגים, ביקורת עורך וז'אנרים.`
}

export async function readProviders() {
  const dir = path.join(ROOT, 'content', 'providers')
  let files = []
  try {
    files = await readdir(dir)
  } catch {
    return []
  }
  return Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map((f) => readFile(path.join(dir, f), 'utf-8').then((raw) => JSON.parse(raw))),
  )
}
