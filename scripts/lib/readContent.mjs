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
