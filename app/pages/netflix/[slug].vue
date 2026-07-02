<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const { public: pub } = useRuntimeConfig()

const { data: page } = await useAsyncData(`netflix-${slug}`, () =>
  queryCollection('netflixMonthly').where('slug', '=', slug).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'החודש המבוקש לא נמצא' })
}

const { data: allMonths } = await useAsyncData('netflix-all-months', () =>
  queryCollection('netflixMonthly').order('slug', 'DESC').all(),
)

useHead({
  title: `הסדרות הכי מומלצות בנטפליקס — ${page.value.monthLabel} ${page.value.year}`,
  meta: [
    { name: 'description', content: page.value.aiSummary },
    { property: 'og:title', content: `נטפליקס טופ 10 — ${page.value.monthLabel} ${page.value.year}` },
    { property: 'og:description', content: page.value.aiSummary },
    { property: 'og:type', content: 'article' },
  ],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/netflix/${slug}` }],
})

useJsonLd(
  () => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `10 הסדרות הכי מומלצות בנטפליקס — ${page.value!.monthLabel} ${page.value!.year}`,
    itemListElement: page.value!.series.map((s) => ({
      '@type': 'ListItem',
      position: s.rank,
      name: s.name,
      url: `${pub.siteUrl}/providers/netflix/series/${slugify(s.name, s.tmdbId)}`,
    })),
  }),
  'monthly-itemlist',
)

useJsonLd(
  () => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.value!.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }),
  'monthly-faq',
)
</script>

<template>
  <div v-if="page" class="mx-auto max-w-5xl px-4 py-10">
    <Breadcrumbs
      :items="[
        { label: 'בית', to: '/' },
        { label: 'ארכיון נטפליקס', to: '/netflix' },
        { label: `${page.monthLabel} ${page.year}` },
      ]"
    />

    <h1 class="mt-4 font-display text-3xl font-black text-milk-parchment md:text-4xl">
      10 הסדרות הכי מומלצות בנטפליקס — {{ page.monthLabel }} {{ page.year }}
    </h1>

    <AiSummaryBlock class="mt-4" :text="page.aiSummary" />

    <p v-if="page.isFallback" class="mt-4 rounded bg-charcoal-line px-3 py-2 text-xs text-mist-grey">
      זהו תוכן דמו (fallback) — הרץ <code>npm run fetch:netflix</code> עם TMDB_API_KEY מוגדר לנתונים אמיתיים.
    </p>

    <ContentRenderer v-if="page" :value="page" class="prose prose-invert mt-6 max-w-none" />

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SeriesCard
        v-for="item in page.series"
        :key="item.tmdbId + item.name"
        :rank="item.rank"
        :name="item.name"
        :overview="item.overview"
        :poster-path="item.posterPath"
        :vote-average="item.voteAverage"
        :genres="item.genres"
        :trailer-youtube-id="item.trailerYoutubeId"
        :to="`/providers/netflix/series/${slugify(item.name, item.tmdbId)}`"
      />
    </div>

    <AdSlot slot-id="monthly-mid" />

    <FAQBlock class="mt-10" :items="page.faq" />

    <section v-if="allMonths?.length" class="mt-10">
      <h2 class="font-display text-xl font-bold text-milk-parchment">חודשים נוספים</h2>
      <MonthPicker class="mt-4" :months="allMonths" :current-slug="slug" />
    </section>
  </div>
</template>
