import { describe, expect, it } from 'vitest'
import {
  buildEditorReview,
  buildTemplateEditorReview,
  buildEditorsNote,
  buildFallbackTopTen,
  buildFaq,
  buildMarkdown,
  monthWindow,
  candidateScore,
  selectBalancedTopTen,
  countAiredSeasons,
  latestAiredSeason,
  classifyShelfCandidate,
  selectNewShelf,
  toneForScore,
} from '../scripts/fetchTopSeries.mjs'

describe('monthly selection', () => {
  const today = new Date(Date.UTC(2026, 9, 14)) // 2026-10-14

  it('monthWindow covers the whole past month', () => {
    expect(monthWindow(2026, 8, 0, today)).toEqual({ gte: '2026-09-01', lte: '2026-09-30' })
  })

  it('monthWindow caps the current month at today and extends backwards', () => {
    expect(monthWindow(2026, 9, 0, today)).toEqual({ gte: '2026-10-01', lte: '2026-10-14' })
    expect(monthWindow(2026, 9, 1, today).gte).toBe('2026-09-16')
  })

  it('countAiredSeasons ignores placeholder seasons (Gentlemen: TMDB says 3, 2 aired)', () => {
    const details = {
      number_of_seasons: 3,
      seasons: [
        { season_number: 0, episode_count: 3, air_date: '2024-01-01' },
        { season_number: 1, episode_count: 8, air_date: '2024-03-07' },
        { season_number: 2, episode_count: 8, air_date: '2026-09-03' },
        { season_number: 3, episode_count: 0, air_date: null },
      ],
    }
    expect(countAiredSeasons(details, today)).toBe(2)
    expect(latestAiredSeason(details, '2026-10-14')?.season_number).toBe(2)
  })

  it('classifies a premiere as new, and a later season as a new season', () => {
    const win = { gte: '2026-10-01', lte: '2026-10-31' }
    expect(classifyShelfCandidate({ firstAirDate: '2026-10-09', seasonAirDate: '2026-10-09', seasonNumber: 1, ...win })).toBe('new')
    expect(classifyShelfCandidate({ firstAirDate: '2024-03-07', seasonAirDate: '2026-10-03', seasonNumber: 2, ...win })).toBe('new-season')
    expect(classifyShelfCandidate({ firstAirDate: '2022-01-01', seasonAirDate: '2026-08-01', seasonNumber: 4, ...win })).toBe(null)
    expect(classifyShelfCandidate({ firstAirDate: null, seasonAirDate: '2026-10-03', seasonNumber: 1, ...win })).toBe(null)
  })

  it('keeps a high-buzz premiere on the new shelf when it has fewer than 20 ratings', () => {
    const rated = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      vote_average: 7.5,
      vote_count: 40,
      popularity: 100 - i,
    }))
    const buzz = { id: 333533, vote_average: 7, vote_count: 11, popularity: 95 }
    const quiet = { id: 50, vote_average: 8, vote_count: 5, popularity: 10 }
    const disliked = { id: 51, vote_average: 4.2, vote_count: 6, popularity: 200 }
    const picked = selectNewShelf([...rated, buzz, quiet, disliked], 10).map((item) => item.id)
    expect(picked).toContain(333533)
    expect(picked).not.toContain(10)
    expect(picked).not.toContain(50)
    expect(picked).not.toContain(51)
    expect(picked[0]).toBe(1)
  })

  it('countAiredSeasons ignores announced seasons with a future air date', () => {
    const details = {
      seasons: [
        { season_number: 1, episode_count: 8, air_date: '2025-01-01' },
        { season_number: 2, episode_count: 8, air_date: '2027-01-01' },
      ],
    }
    expect(countAiredSeasons(details, today)).toBe(1)
  })

  it('candidateScore: quality beats a tiny sample, and the editorial boost applies', () => {
    const tiny = { id: 1, vote_average: 9.5, vote_count: 3, popularity: 100 }
    const solid = { id: 2, vote_average: 7.9, vote_count: 1000, popularity: 100 }
    expect(candidateScore(solid)).toBeGreaterThan(candidateScore(tiny))

    const plain = { id: 5, vote_average: 7.9, vote_count: 1005, popularity: 100 }
    const gentlemen = { ...plain, id: 236235 }
    expect(candidateScore(gentlemen)).toBeGreaterThan(candidateScore(plain))
  })

  it('selectBalancedTopTen caps one primary genre, excludes blocked ids, returns 10', () => {
    const anime = Array.from({ length: 8 }, (_, i) => ({
      id: 100 + i, vote_average: 8.5, vote_count: 500, popularity: 200 - i, genre_ids: [16],
    }))
    const others = Array.from({ length: 8 }, (_, i) => ({
      id: 200 + i, vote_average: 7.2, vote_count: 300, popularity: 50 - i, genre_ids: [18 + i],
    }))
    const blocked = { id: 4656, vote_average: 9, vote_count: 9000, popularity: 999, genre_ids: [10764] }
    const top = selectBalancedTopTen([blocked, ...anime, ...others])

    expect(top).toHaveLength(10)
    expect(top.some((t) => t.id === 4656)).toBe(false)
    expect(top.filter((t) => t.genre_ids[0] === 16).length).toBeLessThanOrEqual(3)
  })

  it('toneForScore scales with the score', () => {
    expect(toneForScore(7.9)).toMatch(/נלהבת/)
    expect(toneForScore(6.0)).toMatch(/פושרת/)
  })
})

describe('fetchTopSeries fallback content', () => {
  it('produces exactly 10 ranked items with required fields', () => {
    const series = buildFallbackTopTen()
    expect(series).toHaveLength(10)
    series.forEach((item, index) => {
      expect(item.rank).toBe(index + 1)
      expect(typeof item.name).toBe('string')
      expect(item.name.length).toBeGreaterThan(0)
      expect(typeof item.nameHe).toBe('string')
      expect(Array.isArray(item.genres)).toBe(true)
      expect(item.genres.length).toBeGreaterThan(0)
      expect(item.editorReview).toContain(item.nameHe)
      // ביקורת העורך לא אמורה להישמע כמו טקסט אוטומטי
      expect(item.editorReview).not.toMatch(/אוטומטי/)
    })
  })

  it('template editor review + editor note never mention "automatic" generation', () => {
    const review = buildTemplateEditorReview({ name: 'Test Show', nameHe: 'סדרת בדיקה', genres: ['דרמה'], rank: 1 })
    expect(review).not.toMatch(/אוטומטי/)

    const series = buildFallbackTopTen()
    const note = buildEditorsNote(series, 'יולי')
    expect(note.label).toContain('יולי')
    expect(note.body).toContain('תום')
    expect(note.label).not.toMatch(/אוטומטי/)
    expect(note.body).not.toMatch(/אוטומטי/)
  })

  it('buildEditorReview falls back to the template without a tmdbId or API key (no network call)', async () => {
    const review = await buildEditorReview({ name: 'Test Show', nameHe: 'סדרת בדיקה', genres: ['דרמה'], rank: 1 })
    expect(review).toBe(
      buildTemplateEditorReview({ name: 'Test Show', nameHe: 'סדרת בדיקה', genres: ['דרמה'], rank: 1 }),
    )
    expect(review).not.toMatch(/אוטומטי/)
  })

  it('builds at least 3 FAQ entries in Hebrew', () => {
    const faq = buildFaq('יולי', 2026)
    expect(faq.length).toBeGreaterThanOrEqual(3)
    faq.forEach((item) => {
      expect(item.question).toContain('?')
      expect(item.answer.length).toBeGreaterThan(0)
    })
  })

  it('builds valid markdown with YAML frontmatter and 10 series in it', () => {
    const series = buildFallbackTopTen()
    const faq = buildFaq('יולי', 2026)
    const markdown = buildMarkdown({
      slug: '2026-07',
      monthLabel: 'יולי',
      year: 2026,
      series,
      faq,
      isFallback: true,
    })

    expect(markdown.startsWith('---\n')).toBe(true)
    expect(markdown).toContain('provider: netflix')
    expect(markdown).toContain('slug: 2026-07')
    expect(markdown.match(/rank: \d+/g)).toHaveLength(10)
    expect(markdown).toContain('איזה סדרה כדאי להתחיל הערב')
    // בכוונה בלי כותרת H1 בגוף ה-markdown — נמנעים מ-H1 כפול, כי
    // הכותרת הראשית של העמוד מגיעה מקומפוננטת MonthHeading.
    expect(markdown).not.toMatch(/^# /m)
  })
})
