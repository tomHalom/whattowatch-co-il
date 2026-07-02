import { describe, expect, it } from 'vitest'
import { buildFallbackTopTen, buildFaq, buildMarkdown } from '../scripts/fetchTopSeries.mjs'

describe('fetchTopSeries fallback content', () => {
  it('produces exactly 10 ranked items with required fields', () => {
    const series = buildFallbackTopTen()
    expect(series).toHaveLength(10)
    series.forEach((item, index) => {
      expect(item.rank).toBe(index + 1)
      expect(typeof item.name).toBe('string')
      expect(item.name.length).toBeGreaterThan(0)
      expect(Array.isArray(item.genres)).toBe(true)
      expect(item.genres.length).toBeGreaterThan(0)
    })
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
    expect(markdown).toContain('# 10 הסדרות הכי מומלצות בנטפליקס')
  })
})
