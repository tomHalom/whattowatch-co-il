<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const { public: pub } = useRuntimeConfig()
const { selected, open, close } = useSeriesModal()

const { data: page } = await useAsyncData(`netflix-${slug}`, () =>
  queryCollection('netflixMonthly').where('slug', '=', slug).first(),
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'החודש המבוקש לא נמצא' })
}

const { data: allMonths } = await useAsyncData('netflix-all-months', () =>
  queryCollection('netflixMonthly').order('slug', 'DESC').all(),
)

// allMonths ממויין DESC (החדש ביותר ראשון) — אז "קודם" (כרונולוגית, ישן יותר)
// הוא האינדקס הבא ברשימה, ו"הבא" (חדש יותר) הוא האינדקס הקודם.
const currentIndex = computed(() => allMonths.value?.findIndex((m) => m.slug === slug) ?? -1)
const prevMonth = computed(() => {
  if (!allMonths.value || currentIndex.value === -1) return null
  return allMonths.value[currentIndex.value + 1] ?? null
})
const nextMonth = computed(() => {
  if (!allMonths.value || currentIndex.value === -1) return null
  return allMonths.value[currentIndex.value - 1] ?? null
})

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
    <SeriesModal :series="selected" @close="close" />

    <Breadcrumbs
      :items="[
        { label: 'בית', to: '/' },
        { label: 'ארכיון נטפליקס', to: '/netflix' },
        { label: `${page.monthLabel} ${page.year}` },
      ]"
    />

    <MonthHeading class="mt-4" kicker="10 הסדרות הכי מומלצות בנטפליקס" :month-label="page.monthLabel" :year="page.year" />

    <MonthNav class="mt-5" :prev-month="prevMonth" :next-month="nextMonth" />

    <p v-if="page.isFallback" class="mt-4 rounded bg-charcoal-line px-3 py-2 text-xs text-mist-grey">
      זהו תוכן דמו (fallback) — הרץ <code>npm run fetch:netflix</code> עם TMDB_READ_ACCESS_TOKEN מוגדר לנתונים אמיתיים.
    </p>

    <ContentRenderer v-if="page" :value="page" class="prose prose-invert mt-6 max-w-none" />

    <div v-if="page.editorsNote" class="editor-note mt-6">
      <span class="editor-note-icon">🌙</span>
      <p><strong>{{ page.editorsNote.label }}</strong> {{ page.editorsNote.body }}</p>
    </div>

    <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <SeriesCard
        v-for="item in page.series"
        :key="item.tmdbId + item.name"
        :rank="item.rank"
        :name="item.name"
        :name-he="item.nameHe"
        :overview="item.overview"
        :poster-path="item.posterPath"
        :vote-average="item.voteAverage"
        :genres="item.genres"
        :trailer-youtube-id="item.trailerYoutubeId"
        :editor-review="item.editorReview"
        :is-new="!page.isFallback && isNewThisMonth(item.firstAirDate, page.slug)"
        @open-modal="open(item)"
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

<style scoped>
.editor-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(232, 163, 61, 0.08), rgba(214, 69, 69, 0.05));
  border: 1px solid rgba(232, 163, 61, 0.25);
  border-radius: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(245, 240, 232, 0.9);
}
.editor-note-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
.editor-note p {
  margin: 0;
}
</style>
