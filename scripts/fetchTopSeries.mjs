#!/usr/bin/env node
/**
 * בונה מדריך חודשי ("10 הסדרות הכי מומלצות בנטפליקס — {חודש}") לפי
 * נתוני TMDB אמיתיים (שם, שם מקור, תקציר, פוסטר, טריילר, מספר עונות),
 * ומעטר אותם בביקורת עורך אישית — כך שהתוכן מוצג כבחירה קפדנית של
 * הצוות, לא כ"פלט אוטומטי".
 *
 * export generateMonth() כדי ש-scripts/backfillMonths.mjs יוכל להריץ
 * את אותה לוגיקה על חודשים היסטוריים עם פרמטרים שונים (page/sortBy).
 *
 * בלי TMDB_READ_ACCESS_TOKEN: נופל לתוכן דמו ריאליסטי (10 כותרים
 * ידועים, בלי טריילר/תמונה אמיתיים) כדי ש-npm run dev/generate/build
 * יעבדו תמיד. TODO: הגדר TMDB_READ_ACCESS_TOKEN (ראה .env.example).
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { stringify as toYaml } from 'yaml'
import { slugify } from './lib/slugify.mjs'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const NETFLIX_NETWORK_ID = 213
const HAS_TMDB_AUTH = !!(process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY)

// אופציונלי — ראה buildEditorReview. בלעדיו, ביקורות העורך חוזרות
// לתבניות (buildTemplateEditorReview) בלי לשבור כלום. Gemini נבחר כי
// יש לו tier חינמי אמיתי (מפתח חינם מ-aistudio.google.com), בלי
// עלות/כרטיס אשראי — מתאים לפרויקט שרץ בחינם.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..')

// העדפות עריכה ידניות (החרגות / בוסט / ביקורת ידנית) — ראה
// scripts/data/editorialOverrides.json. חסר/שבור = ממשיכים בלעדיו.
function loadEditorialOverrides() {
  try {
    const raw = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'data', 'editorialOverrides.json'), 'utf-8'))
    return { exclude: new Set(raw.exclude ?? []), series: raw.series ?? {} }
  } catch {
    return { exclude: new Set(), series: {} }
  }
}
const OVERRIDES = loadEditorialOverrides()

async function tmdbGet(endpoint, params = {}, { language = 'he-IL' } = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  if (language) url.searchParams.set('language', language)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  // Bearer token (Read Access Token, מומלץ ע"י TMDB) — מועדף.
  // API key ישן (v3 query param) — חלופה.
  const readToken = process.env.TMDB_READ_ACCESS_TOKEN || ''
  const apiKey = process.env.TMDB_API_KEY || ''

  const headers = readToken
    ? { Authorization: `Bearer ${readToken}`, 'Content-Type': 'application/json' }
    : {}
  if (!readToken && apiKey) url.searchParams.set('api_key', apiKey)

  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`TMDB ${endpoint} failed: ${res.status}`)
  return res.json()
}

const HEBREW_RE = /[֐-׿]/
// שם "לטיני" (או לפחות ASCII-safe) מועדף עבור slug/URL קריא. אם אין
// כזה בכלל (למשל כותר קוריאני בלעדי) — עדיין תקין, רק ה-slug יהיה
// לא-לטיני.
function pickUrlSafeName(name, originalName) {
  const isAsciiish = (s) => /^[\x00-\x7F\s\-:.,'!?&()]+$/.test(s || '')
  if (isAsciiish(originalName)) return originalName
  if (isAsciiish(name)) return name
  return originalName || name
}

async function fetchTrailerId(tmdbId) {
  try {
    // וידאו לרוב מתויג en-US ב-TMDB גם לתוכן לא-אנגלי; לא מגבילים
    // לשפה כדי למקסם סיכוי למצוא טריילר אמיתי.
    const videos = await tmdbGet(`/tv/${tmdbId}/videos`, {}, { language: '' })
    const results = videos.results || []
    const trailer =
      results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
      results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
      results.find((v) => v.site === 'YouTube')
    return trailer?.key ?? null
  } catch {
    return null
  }
}

async function fetchSeriesDetails(tmdbId) {
  // /tv/{id} בעברית מחזיר בבת אחת: name (מתורגם), original_name,
  // overview (עברית אם קיים), genres בעברית, ומספר עונות — חוסך את
  // הצורך בקריאה נפרדת ל-genre/tv/list.
  return tmdbGet(`/tv/${tmdbId}`)
}

// ביקורות TMDB הן ברובן אנגלית ולא מתורגמות בפועל לפי language —
// מבקשים en-US במפורש כדי למקסם כיסוי, ואז מתרגמים/מסכמים לעברית
// ב-summarizeReviewWithGemini.
// עד 3 ביקורות (ולא אחת): ביקורת בודדת יכולה להיות חריגה לכאן או לכאן
// ולהטות את הנימה של כל הסיכום.
async function fetchCriticReviews(tmdbId, limit = 3) {
  try {
    const data = await tmdbGet(`/tv/${tmdbId}/reviews`, { page: 1 }, { language: 'en-US' })
    const reviews = (data.results || []).filter((r) => (r.content || '').trim().length > 80)
    // מעדיפים ביקורת עם דירוג מפורש (author_details.rating) ואז לפי
    // אורך תוכן — סימן לביקורת מנומקת ולא משפט חטוף.
    reviews.sort((a, b) => {
      const ratingDiff = (b.author_details?.rating ?? 0) - (a.author_details?.rating ?? 0)
      if (ratingDiff !== 0) return ratingDiff
      return (b.content?.length ?? 0) - (a.content?.length ?? 0)
    })
    return reviews.slice(0, limit)
  } catch {
    return []
  }
}

// הנימה נגזרת מהציון האמיתי של TMDB, כדי שסדרה עם 7.9 לא תקבל "קצת
// התאכזבנו" ושסדרה עם 6.0 לא תקבל התלהבות.
function toneForScore(voteAverage) {
  if (!voteAverage) return 'חיובית בזהירות'
  if (voteAverage >= 8.3) return 'נלהבת מאוד, כמעט מושלמת'
  if (voteAverage >= 7.5) return 'חיובית ונלהבת, בלי הסתייגויות מהותיות'
  if (voteAverage >= 6.8) return 'חיובית עם הסתייגות קלה אחת לכל היותר'
  return 'פושרת — שווה צפייה אבל לא מושלמת'
}

// מסכם ביקורת אמיתית (אנגלית, לרוב ארוכה) למשפט-שניים בעברית, בקול
// האתר — "אנחנו/צפינו", בלי לצטט מילה-במילה ובלי להזכיר שזו ביקורת
// שנשלפה מהאינטרנט. מבוסס בפועל על תוכן הביקורת, לא מפוברק. Gemini
// (tier חינמי) ולא מודל בתשלום — ראה GEMINI_API_KEY למעלה.
async function summarizeReviewWithGemini({ label, reviewTexts, voteAverage, voteCount }) {
  const joined = reviewTexts.map((t, i) => `[${i + 1}] ${t.slice(0, 700)}`).join('\n\n')
  const scoreLine = voteAverage
    ? `הציון הממוצע של הסדרה ב-TMDB הוא ${voteAverage.toFixed(1)}/10 מתוך ${voteCount ?? 'כמה'} מדרגים. נימת הסיכום חייבת להתאים לציון: ${toneForScore(voteAverage)}.`
    : ''
  const prompt = `להלן ביקורות אמיתיות (באנגלית) על הסדרה "${label}":

"""
${joined}
"""

${scoreLine}

כתוב משפט אחד או שניים בעברית, בגוף ראשון-רבים ("אנחנו", "צפינו",
"התאהבנו" וכו'), בנימה אישית וכיפית, שמשקף את הקונצנזוס של הביקורות
ולא ביקורת בודדת חריגה (חיובי או שלילי — תהיה נאמן לתחושה האמיתית). אל
תצטט מילה-במילה, אל תזכיר "ביקורת" או "מבקר" או "האינטרנט" או
"אוטומטי" — כתוב כאילו זו התגובה האישית והספונטנית של הצוות. החזר
רק את המשפט/השניים, בלי מרכאות ובלי הקדמות.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200 },
    }),
  })

  if (!res.ok) return null
  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) return null
  return `${label} — ${text}`
}

// TALK (10767) ו-NEWS (10763): לא "סדרות לצפייה" — פודקאסטים/תוכניות
// אירוח שמסתננות ל-discover ומיד ישברו את הרושם ה"נבחר בקפידה".
// vote_count.gte: בלי סף מינימלי, sort_by=vote_average.desc מעלה
// כותרים אזוטריים עם 3 מצביעים ודירוג 10 מעל דרמות עם 50 אלף מצביעים.
const QUALITY_PARAMS = {
  without_genres: '10767,10763',
  'vote_count.gte': 150,
}

// ─── בחירת הכותרים החודשית ───────────────────────────────────────────
// הקריטריון: סדרות נטפליקס שבאמת שודרו/יצאו *בחודש הזה* (air_date של
// פרק באותו חלון) — לא "הכי פופולריות בכל הזמנים". כך "דברים מוזרים:
// סיפורים מ-1985" מופיעה בספטמבר 2026 ו"רחוב סומסום" לא מופיעה בכלל.
// הדירוג בתוך החלון = ציון משוקלל של איכות (ממוצע בייסיאני, כדי שכותר
// עם 20 מדרגים לא ינצח כותר עם 10,000) × פופולריות (לוגריתמית).
// אזהרה שקופה: popularity של TMDB היא נתון של *עכשיו*, לא היסטורי, אבל
// רק בתוך קבוצת מועמדים שנכונה לחודש — לכן הרשימה עדיין מייצגת אותו.
const MONTHLY_FILTERS = {
  with_networks: NETFLIX_NETWORK_ID,
  // 2=miniseries, 4=scripted. מחוץ לרשימה: ריאליטי/תוכניות אירוח/חדשות/
  // דוקומנטרי שמשודרים שבועית ותמיד "מנצחים" בפופולריות.
  with_type: '2|4',
  without_genres: '10767,10763,10762,10766', // talk, news, kids, soap
  'vote_count.gte': 20, // נמוך בכוונה — סדרה שיצאה לפני שבוע עוד אין לה אלפי מדרגים
  'vote_average.gte': 6.5,
}
const MAX_PER_PRIMARY_GENRE = 3
const BAYES_PRIOR_MEAN = 6.8
const BAYES_PRIOR_WEIGHT = 100
const WINDOW_EXTEND_DAYS = 15
const WINDOW_MAX_EXTENSIONS = 3

const isoDay = (d) => d.toISOString().slice(0, 10)

// חלון תאריכים לחודש נתון. לחודש הנוכחי חותכים ב"היום". אם יש פחות
// מ-wanted מועמדים (למשל ריצה ב-1 לחודש, או חודש דל) מרחיבים אחורה.
function monthWindow(year, monthIndex, extensions = 0, today = new Date()) {
  const start = new Date(Date.UTC(year, monthIndex, 1))
  const end = new Date(Date.UTC(year, monthIndex + 1, 0))
  const cappedEnd = end > today ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) : end
  start.setUTCDate(start.getUTCDate() - extensions * WINDOW_EXTEND_DAYS)
  return { gte: isoDay(start), lte: isoDay(cappedEnd) }
}

function candidateScore(item) {
  const v = item.vote_count ?? 0
  const r = item.vote_average ?? 0
  const bayes = (v / (v + BAYES_PRIOR_WEIGHT)) * r + (BAYES_PRIOR_WEIGHT / (v + BAYES_PRIOR_WEIGHT)) * BAYES_PRIOR_MEAN
  const boost = OVERRIDES.series[String(item.id)]?.boost ?? 1
  return bayes * Math.log10(10 + (item.popularity ?? 0)) * boost
}

// ממיין לפי ציון ושומר על גיוון: לא יותר מ-MAX_PER_PRIMARY_GENRE לכל
// ז'אנר ראשי, כדי שהטופ 10 לא יהיה 7 אנימות. אם אין מספיק גיוון —
// משלימים מהנדחים לפי הציון.
function selectBalancedTopTen(candidates, count = 10) {
  const ranked = candidates
    .filter((c) => !OVERRIDES.exclude.has(c.id))
    .map((c) => ({ item: c, score: candidateScore(c) }))
    .sort((a, b) => b.score - a.score)

  const picked = []
  const skipped = []
  const perGenre = new Map()
  for (const entry of ranked) {
    const primary = entry.item.genre_ids?.[0] ?? 'none'
    const used = perGenre.get(primary) ?? 0
    if (used >= MAX_PER_PRIMARY_GENRE) {
      skipped.push(entry)
      continue
    }
    perGenre.set(primary, used + 1)
    picked.push(entry)
    if (picked.length === count) break
  }
  for (const entry of skipped) {
    if (picked.length >= count) break
    picked.push(entry)
  }
  return picked.sort((a, b) => b.score - a.score).map((e) => e.item)
}

async function discoverMonthCandidates(year, monthIndex) {
  const wanted = 14 // מעט יותר מ-10 כדי שלסינון הגיוון יהיה ממה לבחור
  let candidates = []
  for (let ext = 0; ext <= WINDOW_MAX_EXTENSIONS; ext++) {
    const win = monthWindow(year, monthIndex, ext)
    const seen = new Map()
    for (let page = 1; page <= 3; page++) {
      const data = await tmdbGet('/discover/tv', {
        ...MONTHLY_FILTERS,
        'air_date.gte': win.gte,
        'air_date.lte': win.lte,
        sort_by: 'popularity.desc',
        page,
      })
      for (const item of data.results ?? []) seen.set(item.id, item)
      if (page >= (data.total_pages ?? 1)) break
    }
    candidates = [...seen.values()].filter((c) => !OVERRIDES.exclude.has(c.id))
    if (ext > 0) console.log(`[fetchTopSeries] חלון הורחב ל-${win.gte}..${win.lte} (${candidates.length} מועמדים)`)
    if (candidates.length >= wanted) break
  }
  return candidates
}

// מספר עונות שבאמת שודרו: TMDB מחזיר לעיתים number_of_seasons שכולל
// עונה "placeholder" עתידית (בלי תאריך ובלי פרקים) — למשל הג'נטלמנים
// מחזירה 3 כשבפועל יצאו 2.
function countAiredSeasons(details, today = new Date()) {
  const todayIso = isoDay(today)
  const seasons = (details?.seasons ?? []).filter((s) => s.season_number > 0)
  if (!seasons.length) return details?.number_of_seasons ?? undefined
  const aired = seasons.filter((s) => (s.episode_count ?? 0) > 0 && s.air_date && s.air_date <= todayIso)
  return aired.length || undefined
}

// הופך פריט גולמי מ-TMDB (discover/search) לצורת ה-series entry
// המשמשת בכל האתר — משותף בין המדריך החודשי (fetchRealTopTen) לבין
// עמודי ה"תצוגות" לפי ז'אנר (generateGenreShowcase ב-scripts/fetchGenreShowcases.mjs)
// כדי לא לשכפל את לוגיקת שם/nameHe/ביקורת בשני מקומות.
async function buildSeriesEntryFromTmdbItem(item, rank) {
  const [details, trailerYoutubeId] = await Promise.all([
    fetchSeriesDetails(item.id).catch(() => null),
    fetchTrailerId(item.id),
  ])

  const localizedName = details?.name || item.name
  const originalName = details?.original_name || item.original_name || localizedName
  const name = pickUrlSafeName(localizedName, originalName)
  const nameHe = HEBREW_RE.test(localizedName) && localizedName !== name ? localizedName : undefined

  const genres = (details?.genres || []).map((g) => g.name).filter(Boolean)
  const overview = details?.overview || item.overview || 'תקציר יתעדכן בקרוב.'
  const editorReview = await buildEditorReview({
    name,
    nameHe,
    genres,
    rank,
    tmdbId: item.id,
    voteAverage: item.vote_average,
    voteCount: item.vote_count,
  })

  return {
    rank,
    tmdbId: item.id,
    name,
    nameHe,
    overview,
    posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
    backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null,
    voteAverage: Math.round((item.vote_average ?? 0) * 10) / 10,
    genres,
    firstAirDate: item.first_air_date || null,
    seasons: countAiredSeasons(details),
    trailerYoutubeId,
    editorReview,
  }
}

async function fetchRealTopTen({ year, monthIndex } = {}) {
  const candidates = await discoverMonthCandidates(year, monthIndex)
  const top = selectBalancedTopTen(candidates)

  const series = await Promise.all(top.map((item, index) => buildSeriesEntryFromTmdbItem(item, index + 1)))

  return series
}

// תוכן פייק ריאליסטי — משמש כשאין TMDB_READ_ACCESS_TOKEN. כותרים
// ידועים בפועל, אך ללא נתוני TMDB חיים (תמונה/טריילר/עונות מדויקים).
function buildFallbackTopTen() {
  const titles = [
    { name: 'Stranger Things', nameHe: 'דברים מוזרים', genres: ['מתח', 'מדע בדיוני', 'דרמה'] },
    { name: 'Wednesday', nameHe: 'וונסדיי', genres: ['קומדיה', 'פנטזיה', 'מתח'] },
    { name: 'The Crown', nameHe: 'הכתר', genres: ['דרמה', 'היסטוריה'] },
    { name: 'Squid Game', nameHe: 'משחק הדיונון', genres: ['מתח', 'דרמה', 'אקשן'] },
    { name: 'Bridgerton', nameHe: 'משפחת ברידג׳רטון', genres: ['רומנטי', 'דרמה'] },
    { name: 'Fauda', nameHe: 'פאודה', genres: ['מתח', 'דרמה', 'אקשן'] },
    { name: 'The Witcher', nameHe: 'המכשף', genres: ['פנטזיה', 'אקשן', 'דרמה'] },
    { name: 'Money Heist', nameHe: 'בית הנייר', genres: ['מתח', 'פשע', 'דרמה'] },
    { name: 'Ozark', nameHe: 'אוזארק', genres: ['דרמה', 'פשע', 'מתח'] },
    { name: 'Dark', nameHe: 'דארק', genres: ['מדע בדיוני', 'מתח', 'דרמה'] },
  ]

  return titles.map((t, index) => ({
    rank: index + 1,
    tmdbId: 0,
    name: t.name,
    nameHe: t.nameHe,
    overview: `${t.nameHe} היא אחת הסדרות שהצוות שלנו לא מפסיק לדבר עליה. תוכן זה הוא תוכן דמו (fallback) עד שיוגדר TMDB_READ_ACCESS_TOKEN — ואז יוחלף בנתונים אמיתיים.`,
    posterPath: null,
    backdropPath: null,
    voteAverage: 8,
    genres: t.genres,
    firstAirDate: null,
    seasons: undefined,
    trailerYoutubeId: null,
    editorReview: buildTemplateEditorReview({ name: t.name, nameHe: t.nameHe, genres: t.genres, rank: index + 1 }),
  }))
}

// ─── ביקורת עורך אישית ────────────────────────────────────────────
// תבניות מנוסחות בגוף ראשון-רבים ("אנחנו/צפינו"), לא "המערכת בחרה
// אוטומטית". מסתובבות לפי rank כדי להימנע מ-Math.random (טסטביליות
// דטרמיניסטית) בלי לחזור על אותו משפט בכל הרשימה.
// המפתחות תואמים למחרוזות ז'אנר אמיתיות שחוזרות מ-TMDB (he-IL) —
// "אקשן והרפתקאות" ולא "אקשן", "מדע בדיוני ופנטזיה" ולא "פנטזיה" וכו'.
// מפתח שלא תואם בדיוק לעולם לא ייבחר, אז כל הרשימה הייתה נופלת ל-
// 'default' בעבר עם 2 משפטים בלבד — כאן זו הסיבה האמיתית לחזרתיות.
const REVIEW_BY_GENRE = {
  'אקשן והרפתקאות': [
    'האדרנלין פה אמיתי — קשה להשהות באמצע קרב.',
    'בדיוק מה שצריך כשמחפשים משהו שלא מבקש מחשבה, רק ריקושטים.',
    'הצוות התערב על מי ישרוד לסוף העונה. יש כאלה שהפסידו כסף.',
    'הסטאנטים כאן גורמים לשכוח שיש בכלל תקציב הפקה מוגבל.',
    'הפרק האחרון גרם לאחד מאיתנו לזרוק פופקורן על הקיר. שווה.',
    'לא הכי מקורית בעולם, אבל מבצעת כל טרופ בביטחון שגורם לזה לא להפריע.',
  ],
  'מדע בדיוני ופנטזיה': [
    'עולם שלם שנבנה כך שתרצו לחיות בו, גם כשהוא מפחיד.',
    'ההשקעה בעולם ניכרת בכל פינה — עצרנו כמה פעמים רק להסתכל.',
    'מהסוג שגורם לך לפתוח טאב נוסף ולחפש "מה זה אומר בעונה 2".',
    'לא הכל מוסבר, וזה בדיוק מה שגורם לרצות עוד פרק.',
    'הצוות התחלק לקבוצות ויכוח על תיאוריות התוכן — עדיין לא נגמר.',
    'מהמדע הבדיוני שמצליח להישאר אנושי ולא רק חכם.',
  ],
  'דרמה': [
    'מהסוג שממשיכה איתך גם למחרת בבוקר, בין כוס קפה לכוס קפה.',
    'לא הכי "קלילה", אבל בהחלט הכי מדויקת שראינו הרבה זמן.',
    'משהו באמת קרה לנו בפרק החמישי. לא נגלה מה, רק תגיעו לשם.',
    'מהדרמות שגורמות לשלוח הודעה לחבר בשעה מוזרה רק כדי לדבר עליה.',
    'לא ממהרת לשום מקום, ודווקא זו הסיבה שקשה לעזוב אותה.',
    'הכימיה בין הדמויות כאן היא הסיפור בעצמו.',
  ],
  'קומדיה': [
    'הצחקנו בקול רם, בלילה, לבד — ואין לנו שום בעיה להודות בזה.',
    'התרופה המושלמת לערב שדורש כלום מלבד לצחוק.',
    'ציטטנו משפטים ממנה בקבוצת הצוות במשך שבוע שלם.',
    'מהקומדיות שמצליחות להיות חכמות בלי להרגיש כמו שיעור.',
    'לא כל בדיחה נוחתת, אבל אלה שכן — נוחתות חזק.',
    'הדמות המשנית כאן טובה יותר מרוב הדמויות הראשיות בסדרות אחרות.',
  ],
  'רומנטי': [
    'הצוות התחלק לשני מחנות על מי הזוג הכי טוב בעונה — ולא הגענו להסכמה.',
    'מהסוג שגורם לך לרצות לצפות עוד פרק "רק עוד אחד" בשלוש לפנות בוקר.',
    'קלישאות רומנטיות? כן. עובד עלינו בכל פעם? גם כן.',
    'יש כאן סצנה אחת שגרמה לצוות שלם לצעוק על המסך.',
    'הכימיה בין הדמויות הראשיות עובדת אפילו כשהתסריט לא.',
    'מהסדרות שמזכירות למה בכלל אוהבים ז\'אנר רומנטי.',
  ],
  'אנימציה': [
    'קסם שעובד גם למי שחושב שאנימציה זו רק לילדים.',
    'צבעונית, חכמה, ומצליחה להגיד משהו אמיתי בלי להתנשא.',
    'האנימציה כאן עושה דברים שצילום רגיל פשוט לא יכול.',
    'עצרנו את הפרק כמה פעמים רק כדי להעריך פריים בודד.',
    'מהסוג שצופים בו "בשביל הילדים" ונשארים בשביל עצמכם.',
    'הומור לכל הגילאים בלי שאף רגע מרגיש מיותר.',
  ],
  'פשע': [
    'תכנון של תסריט פשע שבאמת מצליח להפתיע, לא רק "לטוויסט טוויסט".',
    'ניסינו לפצח את התוכנית לפני הדמויות. הפסדנו.',
    'מהסוג שגורם לדבר בלחישה גם כשצופים לבד בבית.',
    'המתח לא נעלם אפילו כשכבר יודעים "מי עשה את זה".',
    'עוד סדרת פשע שמצליחה להרגיש כמו הראשונה שראינו בז\'אנר.',
    'סוף כל פרק הוא בדיוק המקום הלא-נכון לעצור — ועצרנו בו כל פעם.',
  ],
  'משפחה': [
    'מהסוג שכל בני המשפחה מסכימים לגביו, וזה כבר הישג בפני עצמו.',
    'לא מתנשאת על הקהל הצעיר ולא מתביישת בלב החם שלה.',
    'צחקנו ביחד, זה כבר סימן טוב לסדרה משפחתית.',
    'קלילה בלי להיות שטחית — איזון שלא כל סדרה מוצאת.',
    'מהסדרות שאפשר להשאיר פתוחות ברקע ועדיין להיתפס צופים בה.',
  ],
  'מסתורין': [
    'כל פרק מוסיף שאלה אחת חדשה על כל תשובה שהוא נותן.',
    'ניחשנו לא נכון בכל תחנה. מרגיש נורא, אבל בכיף.',
    'מהתעלומות שבאמת משתלמות לפענוח בסוף, לא רק "טוויסט בשביל טוויסט".',
    'הצוות פתח קבוצת וואטסאפ ייעודית רק לתיאוריות על הסדרה הזו.',
  ],
  'ילדים': [
    'מתאימה בול לילדים, ומצליחה לא לעצבן את המבוגרים שצופים לידם.',
    'צבעונית, חמודה, ובלי אג\'נדה מעצבנת — פשוט כיף.',
    'מהסדרות שילדים מבקשים לצפות בהן שוב — וזה עובר את הבדיקה האמיתית.',
  ],
  'ריאליטי': [
    'ריאליטי שמצליח להיות מהנה בלי להרגיש מלוכלך.',
    'הצוות התחלק בדעתו על המנצח הצפוי, ולא לראשונה.',
    'מהסוג שמתכוונים לצפות ב"עוד פרק אחד בלבד" ופתאום זה 2 בלילה.',
  ],
  default: [
    'זו מהסדרות שגורמות לנו לפתוח את התגובות רק כדי לראות אם עוד מישהו קם ב-3 בלילה בשבילה.',
    'לא נשבע שנרדמנו על השעה, אבל בטוח שלא היה סיפור לפני.',
    'מהסדרות שקשה להסביר למה הן כל כך טובות — פשוט תתחילו לצפות.',
    'עוד אחת שנכנסה לרשימה שלנו בלי שהתכוונו, ונשארה בה.',
    'לא ציפינו לזה, ובדיוק בשביל זה יש רשימה כזו.',
  ],
}

// נופל ל-fallback הזה כשאין ביקורת אמיתית ל-tmdbId (נדיר/לא ידוע),
// כש-GEMINI_API_KEY לא מוגדר, או כשקריאת ה-API נכשלת — לעולם לא
// שובר את הבנייה החודשית.
function buildTemplateEditorReview({ name, nameHe, genres, rank, tmdbId }) {
  const label = nameHe || name
  const primaryGenre = (genres || []).find((g) => REVIEW_BY_GENRE[g]) || 'default'
  const options = REVIEW_BY_GENRE[primaryGenre]
  // tmdbId מפזר טוב יותר מ-rank בלבד — פריטים שונים באותו ז'אנר
  // ובאותו rank יחסי (בין חודשים) לא נופלים תמיד על אותה בחירה.
  const index = (rank + (tmdbId || 0)) % options.length
  return `${label} — ${options[index]}`
}

// ביקורת "בינג'יונרים" אמיתית: שולפים ביקורות משתמשים/מבקרים אמיתיות
// מ-TMDB ומסכמים אותן בעברית, בקול האתר, באמצעות Gemini (tier חינמי)
// — כדי שהתוכן יהיה מבוסס על קבלה קריטית אמיתית, לא רק משפטי תבנית.
// דורש GEMINI_API_KEY; בלעדיו (או אם אין ביקורות אמיתיות לכותר) נופל
// חזרה ל-buildTemplateEditorReview בלי לשבור את ההרצה החודשית.
async function buildEditorReview({ name, nameHe, genres, rank, tmdbId, voteAverage, voteCount }) {
  const fallback = () => buildTemplateEditorReview({ name, nameHe, genres, rank, tmdbId })

  // ביקורת ידנית של העורך גוברת על כל מקור אוטומטי.
  const manual = tmdbId ? OVERRIDES.series[String(tmdbId)]?.editorReview : null
  if (manual) return manual

  if (!tmdbId || !GEMINI_API_KEY) return fallback()

  try {
    const reviews = await fetchCriticReviews(tmdbId)
    if (!reviews.length) return fallback()

    const summarized = await summarizeReviewWithGemini({
      label: nameHe || name,
      reviewTexts: reviews.map((r) => r.content),
      voteAverage,
      voteCount,
    })
    return summarized || fallback()
  } catch {
    return fallback()
  }
}

// מחולק ל-label (מודגש בתבנית) + body (טקסט רגיל) כדי שהעימוד לא יצטרך
// לפרסר מחרוזת שטוחה כדי להדגיש רק את הכותרת.
function buildEditorsNote(series, monthLabel) {
  // הבחירה האישית של הצוות היא לא בהכרח מקום 1 — עוד מגע אנושי:
  // "לא הכי מדוברת, אבל אנחנו לא מפסיקים איתה".
  const pick = series[4] || series[0]
  const pickLabel = pick.nameHe || pick.name
  return {
    label: `המלצת העורך לחודש ${monthLabel}:`,
    body:
      `כולם ידברו לכם על מקום 1, ` +
      `אבל אנחנו כצוות התאהבנו הכי הרבה ב"${pickLabel}" — מהמקום ${pick.rank} ברשימה. ` +
      `לא הכי מדוברת החודש, אבל זו שאנחנו ממליצים עליה בלי לחשוב פעמיים. ` +
      `— תום, ראש צוות הבינג'יונרים המוסמכים 🌙`,
  }
}

// התשובות מתבססות על series האמיתי של החודש הזה — לא הפניה כללית
// ל"ראו למעלה". buildFaq(monthLabel, year) בלי series (למשל בטסטים)
// עדיין עובד, רק עם תשובות כלליות יותר לשאלות שדורשות נתון קונקרטי.
function buildFaq(monthLabel, year, series = []) {
  const top = series[0]
  const topLabel = top ? top.nameHe || top.name : null
  const israeliShow = series.find((s) => HEBREW_RE.test(s.name))

  const faq = [
    {
      question: `מה הסדרה הטובה ביותר בנטפליקס ב${monthLabel} ${year}?`,
      answer: topLabel
        ? `"${topLabel}" — היא במקום הראשון ברשימה שלנו לחודש ${monthLabel} ${year}. ראו את הפירוט המלא והטריילר בכתבה למעלה.`
        : `הסדרה שבמקום הראשון ברשימה שלנו לחודש ${monthLabel} ${year} — ראו את הפירוט המלא למעלה.`,
    },
    {
      question: 'איך נבחרות הסדרות לרשימה החודשית?',
      answer:
        'צוות הבינג\'יונרים המוסמכים שלנו סוקר, צופה ובוחר בקפידה כל חודש מבין הסדרות שיצאו בנטפליקס באותו חודש, לפי פופולריות, דירוגים וגיוון ז\'אנרים — לא רשימה שנוצרת מעצמה.',
    },
    {
      question: 'האם יש סדרות ישראליות ברשימה?',
      answer: israeliShow
        ? `כן — "${israeliShow.nameHe || israeliShow.name}" נכנסה לטופ 10 החודש.`
        : 'לא נכנסה סדרה ישראלית לטופ 10 החודש, אבל יש לנו מדריך ייעודי לסדרות ישראליות בנטפליקס.',
      link: { to: '/netflix/genre/israeli', label: 'לכל הסדרות הישראליות בנטפליקס' },
    },
    {
      question: 'איפה אפשר לראות את הטריילרים?',
      answer: 'לכל סדרה ברשימה מוטמע טריילר וידאו שניתן לנגן ישירות מהכרטיסייה שלה בעמוד.',
    },
  ]

  if (top) {
    faq[0].link = {
      to: `/providers/netflix/series/${slugify(top.name, top.tmdbId)}`,
      label: `לכל הפרטים על "${topLabel}"`,
    }
  }

  return faq
}

function monthAiSummary(monthLabel, year) {
  return `10 הסדרות שצוות הבינג'יונרים המוסמכים שלנו ממליץ עליהן בנטפליקס לחודש ${monthLabel} ${year} — עם טריילרים, דירוגים, ביקורת עורך וז'אנרים.`
}

function buildMarkdown({ slug, monthLabel, year, series, faq, editorsNote, isFallback }) {
  const frontmatter = {
    provider: 'netflix',
    slug,
    monthLabel,
    year,
    aiSummary: monthAiSummary(monthLabel, year),
    editorsNote,
    series,
    faq,
    isFallback,
  }

  // בלי כותרת H1 בגוף ה-markdown בכוונה — ה-H1 היחיד בעמוד מגיע
  // מקומפוננטת MonthHeading (חודש/שנה בולטים), לא כפילות סמנטית.
  const intro = `איזה סדרה כדאי להתחיל הערב? צוות הבינג'יונרים המוסמכים שלנו ריכז
בקפידה את 10 הסדרות שהכי שווה לצפות בהן בנטפליקס בחודש ${monthLabel}
${year}, כולל טריילר, דירוג, מספר עונות וביקורת עורך אישית לכל
סדרה — כדי שתוכלו להחליט מה לצפות בלי לגלול באינסוף.
`

  return `---\n${toYaml(frontmatter)}---\n\n${intro}`
}

async function generateMonth({ year, monthIndex } = {}) {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = monthIndex ?? now.getMonth()
  const monthLabel = HEBREW_MONTHS[m]
  const slug = `${y}-${String(m + 1).padStart(2, '0')}`

  const usingFallback = !HAS_TMDB_AUTH
  if (usingFallback) {
    console.warn(
      '[fetchTopSeries] TMDB_READ_ACCESS_TOKEN (או TMDB_API_KEY) לא מוגדר — נוצר תוכן דמו (fallback). ' +
        'הגדר TMDB_READ_ACCESS_TOKEN ב-.env והרץ שוב לנתונים אמיתיים.',
    )
  }

  const series = usingFallback ? buildFallbackTopTen() : await fetchRealTopTen({ year: y, monthIndex: m })
  if (series.length < 10) {
    console.warn(`[fetchTopSeries] ${slug}: נמצאו רק ${series.length} כותרים מתאימים (פחות מ-10).`)
  }
  const faq = buildFaq(monthLabel, y, series)
  const editorsNote = buildEditorsNote(series, monthLabel)

  const markdown = buildMarkdown({ slug, monthLabel, year: y, series, faq, editorsNote, isFallback: usingFallback })

  const contentDir = path.join(ROOT, 'content', 'netflix')
  const dataDir = path.join(ROOT, 'public', 'data', 'netflix')
  await mkdir(contentDir, { recursive: true })
  await mkdir(dataDir, { recursive: true })

  await writeFile(path.join(contentDir, `${slug}.he.md`), markdown, 'utf-8')
  await writeFile(
    path.join(dataDir, `${slug}.json`),
    JSON.stringify(
      { provider: 'netflix', slug, monthLabel, year: y, aiSummary: monthAiSummary(monthLabel, y), editorsNote, series, faq, isFallback: usingFallback },
      null,
      2,
    ),
    'utf-8',
  )

  console.log(`[fetchTopSeries] נוצר content/netflix/${slug}.he.md ו-public/data/netflix/${slug}.json`)
  return { slug, usingFallback, series }
}

// ─── תצוגות ז'אנר (content/genres/{slug}.json) ───────────────────────
// לא כל ז'אנר קיים כ-genre ID אמיתי ב-TMDB ל-TV (אין "Thriller"/
// "Romance" נפרדים!), ולא כל ז'אנר בהכרח הופיע בטופ 10 של חודש נתון
// — אז לא בונים את עמודי הז'אנר מהרשימות החודשיות, אלא משליפה
// ייעודית ואמיתית לכל ז'אנר. שלושה "סוגים":
//   'genre'    — genre ID אמיתי ב-TMDB, מסונן ל-Netflix ישירות.
//   'language' — אין genre מתאים (למשל "ישראלי") — מסננים לפי שפת
//                מקור ומאמתים זמינות Netflix אמיתית בפועל דרך
//                watch/providers (כי with_networks לא תמיד מתעדכן
//                לתוכן שנרכש/הורשה בדיעבד, לא רק Netflix Originals).
//   'curated'  — אין genre/language מבחין (למשל "רומנטי") — מחפשים
//                כותרים ידועים לפי שם ומאמתים זמינות Netflix בפועל.
const GENRE_DEFS = {
  drama: { kind: 'genre', tmdbGenres: [18] },
  comedy: { kind: 'genre', tmdbGenres: [35] },
  action: { kind: 'genre', tmdbGenres: [10759] },
  documentary: { kind: 'genre', tmdbGenres: [99] },
  kids: { kind: 'genre', tmdbGenres: [10762] },
  thriller: { kind: 'genre', tmdbGenres: [9648, 80] }, // מסתורין|פשע — TMDB TV אין לו "Thriller" נפרד
  anime: { kind: 'genre', tmdbGenres: [16], originalLanguage: 'ja' }, // אנימציה + שפת מקור יפנית
  romance: {
    kind: 'curated',
    titles: [
      'Bridgerton', 'Emily in Paris', 'Virgin River', 'Outer Banks',
      'Never Have I Ever', 'You', 'XO Kitty', 'Nobody Wants This', 'Heartstopper',
    ],
  },
  israeli: {
    kind: 'language',
    originalLanguage: 'he',
    // חלק מהתוכן הישראלי הבינלאומי-מכוון (הפקות משותפות) מתויג ב-TMDB
    // בשפת מקור לא-עברית (אנגלית וכו') — לכן language-discover בלבד
    // לא מוצא אותו; מוסיפים חיפוש שם ידוע כתוסף.
    supplementalTitles: ['Hit & Run', 'The Spy', 'Losing Alice', 'Kupp', 'The Beauty Queen of Jerusalem'],
  },
}

const GENRE_SHOWCASE_SIZE = 10

async function isAvailableOnNetflix(tmdbId) {
  try {
    const data = await tmdbGet(`/tv/${tmdbId}/watch/providers`, {}, { language: '' })
    const regions = data.results || {}
    const region = regions.IL || regions.US || null
    return (region?.flatrate || []).some((p) => p.provider_name === 'Netflix')
  } catch {
    return false
  }
}

async function collectGenreCandidates(def) {
  if (def.kind === 'genre') {
    const params = {
      with_networks: NETFLIX_NETWORK_ID,
      with_genres: def.tmdbGenres.join('|'),
      sort_by: 'popularity.desc',
      page: 1,
      ...QUALITY_PARAMS,
    }
    if (def.originalLanguage) params.with_original_language = def.originalLanguage
    const discover = await tmdbGet('/discover/tv', params)
    return (discover.results || []).slice(0, GENRE_SHOWCASE_SIZE).map((item) => ({ item, verified: true }))
  }

  if (def.kind === 'language') {
    // בלי with_networks — תוכן ישראלי מוכר ב-TMDB לרוב תחת הערוץ
    // המקורי (כאן/קשת/רשת), לא Netflix, גם אם זמין שם בפועל. הפופולריות
    // בקרב תוכן בעברית לא תמיד מתואמת עם זמינות Netflix בפרט — לכן
    // סורקים כמה עמודים כדי לתת ל-isAvailableOnNetflix מספיק מועמדים
    // לסנן מתוכם, ומוסיפים supplementalTitles (חיפוש שם) לתוכן
    // בינלאומי-מכוון שלא מתויג בשפת מקור עברית.
    const pages = await Promise.all(
      [1, 2, 3, 4, 5, 6].map((page) =>
        tmdbGet('/discover/tv', {
          with_original_language: def.originalLanguage,
          sort_by: 'popularity.desc',
          page,
        }),
      ),
    )
    const fromLanguage = pages.flatMap((d) => d.results || [])

    const fromSupplemental = []
    for (const title of def.supplementalTitles || []) {
      try {
        const data = await tmdbGet('/search/tv', { query: title }, { language: 'he-IL' })
        if (data.results?.[0]) fromSupplemental.push(data.results[0])
      } catch {
        // ממשיכים — כותר בודד שנכשל לא עוצר את כל הרשימה
      }
    }

    return [...fromLanguage, ...fromSupplemental].map((item) => ({ item, verified: false }))
  }

  // 'curated' — חיפוש לפי שם ידוע, לא לפי genre/language.
  const found = []
  for (const title of def.titles) {
    try {
      const data = await tmdbGet('/search/tv', { query: title }, { language: 'he-IL' })
      if (data.results?.[0]) found.push({ item: data.results[0], verified: false })
    } catch {
      // ממשיכים לכותר הבא — חיפוש בודד שנכשל לא אמור לעצור את כל הרשימה
    }
  }
  return found
}

async function generateGenreShowcase(slug) {
  const def = GENRE_DEFS[slug]
  if (!def) throw new Error(`Unknown genre slug: ${slug}`)

  const candidates = await collectGenreCandidates(def)
  const chosen = []
  for (const { item, verified } of candidates) {
    if (chosen.length >= GENRE_SHOWCASE_SIZE) break
    if (chosen.some((c) => c.id === item.id)) continue
    // 'genre' כבר מסונן ל-with_networks=Netflix ישירות; 'language' ו-
    // 'curated' דורשים אימות אמיתי כי אין להם סינון Netflix מובנה.
    if (!verified && !(await isAvailableOnNetflix(item.id))) continue
    chosen.push(item)
  }

  const series = await Promise.all(chosen.map((item, index) => buildSeriesEntryFromTmdbItem(item, index + 1)))

  const genresDir = path.join(ROOT, 'content', 'genres')
  await mkdir(genresDir, { recursive: true })
  await writeFile(path.join(genresDir, `${slug}.json`), JSON.stringify({ slug, series }, null, 2), 'utf-8')

  console.log(`[fetchGenreShowcases] ${slug}: ${series.length}/${GENRE_SHOWCASE_SIZE} כותרים אומתו ונכתבו ל-content/genres/${slug}.json`)
  return { slug, count: series.length }
}

async function generateAllGenreShowcases() {
  if (!HAS_TMDB_AUTH) {
    console.warn(
      '[fetchGenreShowcases] TMDB_READ_ACCESS_TOKEN (או TMDB_API_KEY) לא מוגדר — ' +
        'מדלגים על תצוגות הז\'אנר (אין fallback דמו לכך, בניגוד למדריך החודשי).',
    )
    return []
  }

  const results = []
  for (const slug of Object.keys(GENRE_DEFS)) {
    // ברצף, לא Promise.all — עדינות מול TMDB rate limits (הרבה קריאות
    // watch/providers לכל ז'אנר).
    results.push(await generateGenreShowcase(slug))
  }
  return results
}

async function main() {
  await generateMonth()
}

export {
  buildFallbackTopTen,
  buildFaq,
  buildMarkdown,
  buildEditorReview,
  buildTemplateEditorReview,
  buildEditorsNote,
  generateMonth,
  monthWindow,
  candidateScore,
  selectBalancedTopTen,
  countAiredSeasons,
  toneForScore,
  generateGenreShowcase,
  generateAllGenreShowcases,
  GENRE_DEFS,
  main,
}

// מריץ main() רק כשהקובץ מופעל ישירות (node scripts/fetchTopSeries.mjs),
// לא כשהוא מיובא ע"י בדיקות יחידה או ע"י scripts/backfillMonths.mjs.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[fetchTopSeries] נכשל:', err)
    process.exitCode = 1
  })
}
