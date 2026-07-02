#!/usr/bin/env node
/**
 * שולף את 10 הסדרות הפופולריות ביותר בנטפליקס מ-TMDB (כולל טריילר
 * מ-videos endpoint), ובונה:
 *   - content/netflix/{YYYY-MM}.he.md  (frontmatter + מאמר עברי)
 *   - public/data/netflix/{YYYY-MM}.json (לצריכה ע"י סקריפטים אחרים)
 *
 * בלי TMDB_API_KEY: נופל אוטומטית לתוכן פייק ריאליסטי (10 כותרים
 * ידועים, ללא טריילר בפועל) כדי ש-npm run dev/generate/build יעבדו
 * תמיד, גם בסביבת פיתוח חדשה. TODO: הגדר TMDB_API_KEY (ראה .env.example).
 */
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { stringify as toYaml } from 'yaml'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const NETFLIX_NETWORK_ID = 213
const HAS_TMDB_AUTH = !!(process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY)

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..')

async function tmdbGet(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('language', 'he-IL')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  // Bearer token (Read Access Token) — מועדף
  // API key ישן (v3) — חלופה
  const readToken = process.env.TMDB_READ_ACCESS_TOKEN || ''
  const apiKey    = process.env.TMDB_API_KEY || ''

  const headers = readToken
    ? { Authorization: `Bearer ${readToken}`, 'Content-Type': 'application/json' }
    : {}
  if (!readToken && apiKey) url.searchParams.set('api_key', apiKey)

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`TMDB ${endpoint} failed: ${res.status}`)
  return res.json()
}

async function fetchRealTopTen() {
  const genreMap = await tmdbGet('/genre/tv/list').then((d) =>
    Object.fromEntries(d.genres.map((g) => [g.id, g.name])),
  )

  const discover = await tmdbGet('/discover/tv', {
    with_networks: NETFLIX_NETWORK_ID,
    sort_by: 'popularity.desc',
    page: 1,
  })

  const top = discover.results.slice(0, 10)

  const series = await Promise.all(
    top.map(async (item, index) => {
      let trailerYoutubeId = null
      try {
        const videos = await tmdbGet(`/tv/${item.id}/videos`)
        const trailer =
          videos.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
          videos.results.find((v) => v.site === 'YouTube')
        trailerYoutubeId = trailer?.key ?? null
      } catch {
        console.warn(`[fetchTopSeries] אין טריילר עבור "${item.name}" — ממשיך בלי טריילר.`)
      }

      return {
        rank: index + 1,
        tmdbId: item.id,
        name: item.name,
        overview: item.overview || 'תקציר יתעדכן בקרוב.',
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdropPath: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : null,
        voteAverage: Math.round((item.vote_average ?? 0) * 10) / 10,
        genres: (item.genre_ids || []).map((id) => genreMap[id]).filter(Boolean),
        firstAirDate: item.first_air_date || null,
        trailerYoutubeId,
      }
    }),
  )

  return series
}

// תוכן פייק ריאליסטי — משמש כשאין TMDB_API_KEY. כותרים ידועים בפועל,
// אך ללא נתוני TMDB חיים (דירוג/תיאור מקורבים, אין טריילר).
function buildFallbackTopTen() {
  const titles = [
    { name: 'Stranger Things', genres: ['מתח', 'מדע בדיוני', 'דרמה'] },
    { name: 'Wednesday', genres: ['קומדיה', 'פנטזיה', 'מתח'] },
    { name: 'The Crown', genres: ['דרמה', 'היסטוריה'] },
    { name: 'Squid Game', genres: ['מתח', 'דרמה', 'אקשן'] },
    { name: 'Bridgerton', genres: ['רומנטי', 'דרמה'] },
    { name: 'Fauda', genres: ['מתח', 'דרמה', 'אקשן'] },
    { name: 'The Witcher', genres: ['פנטזיה', 'אקשן', 'דרמה'] },
    { name: 'Money Heist', genres: ['מתח', 'פשע', 'דרמה'] },
    { name: 'Ozark', genres: ['דרמה', 'פשע', 'מתח'] },
    { name: 'Dark', genres: ['מדע בדיוני', 'מתח', 'דרמה'] },
  ]

  return titles.map((t, index) => ({
    rank: index + 1,
    tmdbId: 0,
    name: t.name,
    overview: `${t.name} — אחת הסדרות הפופולריות בנטפליקס. תוכן זה הוא תוכן דמו (fallback), יוחלף בנתונים אמיתיים מ-TMDB בהרצה הראשונה עם TMDB_API_KEY מוגדר.`,
    posterPath: null,
    backdropPath: null,
    voteAverage: 8,
    genres: t.genres,
    firstAirDate: null,
    trailerYoutubeId: null,
  }))
}

function buildFaq(monthLabel, year) {
  return [
    {
      question: `מה הסדרה הטובה ביותר בנטפליקס ב${monthLabel} ${year}?`,
      answer:
        'הסדרה שבמקום הראשון ברשימה שלנו החודש — ראו את הפירוט המלא ואת הטריילר בכתבה למעלה.',
    },
    {
      question: 'איך נבחרות הסדרות לרשימה החודשית?',
      answer:
        'הרשימה מתעדכנת אוטומטית כל חודש לפי פופולריות בנטפליקס, דירוגים, וכיסוי ז\'אנרים מגוון.',
    },
    {
      question: 'האם יש סדרות ישראליות ברשימה?',
      answer:
        'כאשר סדרה ישראלית (כמו Fauda) נכנסת לטופ 10 הפופולרי, היא מסומנת ומקבלת דגש מיוחד בכתבה.',
    },
    {
      question: 'איפה אפשר לראות את הטריילרים?',
      answer: 'לכל סדרה ברשימה מוטמע טריילר וידאו שניתן לנגן ישירות מהכרטיסייה שלה בעמוד.',
    },
  ]
}

function buildMarkdown({ slug, monthLabel, year, series, faq, isFallback }) {
  const frontmatter = {
    provider: 'netflix',
    slug,
    monthLabel,
    year,
    aiSummary: `10 הסדרות הכי מומלצות בנטפליקס לחודש ${monthLabel} ${year}, כולל טריילרים, דירוגים וז'אנרים — מתעדכן אוטומטית כל חודש.`,
    series,
    faq,
    isFallback,
  }

  const intro = `# 10 הסדרות הכי מומלצות בנטפליקס — ${monthLabel} ${year}

איזה סדרה כדאי להתחיל הערב? המדריך החודשי שלנו מרכז את 10 הסדרות
הפופולריות ביותר בנטפליקס לחודש ${monthLabel} ${year}, כולל טריילר,
דירוג וז'אנרים לכל סדרה — כדי שתוכלו להחליט מה לצפות בלי לגלול
באינסוף. הרשימה מתעדכנת אוטומטית בתחילת כל חודש.
`

  return `---\n${toYaml(frontmatter)}---\n\n${intro}`
}

async function main() {
  const now = new Date()
  const year = now.getFullYear()
  const monthIndex = now.getMonth()
  const monthLabel = HEBREW_MONTHS[monthIndex]
  const slug = `${year}-${String(monthIndex + 1).padStart(2, '0')}`

  const usingFallback = !HAS_TMDB_AUTH
  if (usingFallback) {
    console.warn(
      '[fetchTopSeries] TMDB_READ_ACCESS_TOKEN (או TMDB_API_KEY) לא מוגדר — נוצר תוכן דמו (fallback). ' +
        'הגדר TMDB_READ_ACCESS_TOKEN ב-.env והרץ שוב לנתונים אמיתיים.',
    )
  }

  const series = usingFallback ? buildFallbackTopTen() : await fetchRealTopTen()
  const faq = buildFaq(monthLabel, year)

  const markdown = buildMarkdown({
    slug,
    monthLabel,
    year,
    series,
    faq,
    isFallback: usingFallback,
  })

  const contentDir = path.join(ROOT, 'content', 'netflix')
  const dataDir = path.join(ROOT, 'public', 'data', 'netflix')
  await mkdir(contentDir, { recursive: true })
  await mkdir(dataDir, { recursive: true })

  await writeFile(path.join(contentDir, `${slug}.he.md`), markdown, 'utf-8')
  await writeFile(
    path.join(dataDir, `${slug}.json`),
    JSON.stringify({ provider: 'netflix', slug, monthLabel, year, series, faq, isFallback: usingFallback }, null, 2),
    'utf-8',
  )

  console.log(`[fetchTopSeries] נוצר content/netflix/${slug}.he.md ו-public/data/netflix/${slug}.json`)
}

export { buildFallbackTopTen, buildFaq, buildMarkdown, main }

// מריץ main() רק כשהקובץ מופעל ישירות (node scripts/fetchTopSeries.mjs),
// לא כשהוא מיובא ע"י בדיקות יחידה.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[fetchTopSeries] נכשל:', err)
    process.exitCode = 1
  })
}
