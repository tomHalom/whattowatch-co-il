import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// Structured schema for a single recommended title inside a monthly
// guide. Shared shape across providers so the SEO engine and the
// SeriesCard component stay provider-agnostic.
const seriesEntry = z.object({
  rank: z.number(),
  tmdbId: z.number(),
  name: z.string(),
  nameHe: z.string().optional(),
  overview: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  voteAverage: z.number(),
  genres: z.array(z.string()),
  firstAirDate: z.string().nullable().optional(),
  seasons: z.number().optional(),
  trailerYoutubeId: z.string().nullable(),
  editorReview: z.string().optional(),
})

const faqEntry = z.object({
  question: z.string(),
  answer: z.string(),
  link: z.object({ to: z.string(), label: z.string() }).optional(),
})

export default defineContentConfig({
  collections: {
    // Provider configuration — logo, colors, SEO metadata, affiliate
    // settings, supported countries. Adding a new provider is a new
    // JSON file here, zero code changes.
    providers: defineCollection({
      type: 'data',
      source: 'providers/*.json',
      schema: z.object({
        slug: z.string(),
        name: z.string(),
        logo: z.string(),
        colorPrimary: z.string(),
        colorSecondary: z.string(),
        countries: z.array(z.string()),
        seoTitle: z.string(),
        seoDescription: z.string(),
        affiliateEnabled: z.boolean().default(false),
      }),
    }),

    // Monthly "Top 10" guides, one per provider per month. MVP ships
    // Netflix only (content/netflix/*.he.md); other providers reuse
    // the exact same schema (content/disney-plus/*.he.md, etc.).
    netflixMonthly: defineCollection({
      type: 'page',
      source: 'netflix/*.he.md',
      schema: z.object({
        provider: z.string(),
        slug: z.string(),
        monthLabel: z.string(),
        year: z.number(),
        aiSummary: z.string(),
        editorsNote: z.object({ label: z.string(), body: z.string() }).optional(),
        series: z.array(seriesEntry),
        faq: z.array(faqEntry),
        isFallback: z.boolean().default(false),
      }),
    }),

    // תוכן ייעודי לכל עמוד ז'אנר (content/genres/{slug}.json) — לא
    // נגזר מהרשימות החודשיות, כי לא כל ז'אנר בהכרח מופיע בטופ 10 של
    // חודש נתון (ולז'אנרים כמו "מתח"/"רומנטי" אין בכלל genre ID תואם
    // ב-TMDB ל-TV). ראה scripts/fetchGenreShowcases.mjs.
    genreShowcases: defineCollection({
      type: 'data',
      source: 'genres/*.json',
      schema: z.object({
        slug: z.string(),
        series: z.array(seriesEntry),
      }),
    }),
  },
})
