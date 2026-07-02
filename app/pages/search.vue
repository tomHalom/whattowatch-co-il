<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const query = ref((route.query.q as string) || '')

const { data: months } = await useAsyncData('search-all-months', () =>
  queryCollection('netflixMonthly').all(),
)

const allSeries = computed(() => {
  const seen = new Set<string>()
  return (months.value ?? [])
    .flatMap((m) => m.series)
    .filter((s) => {
      const key = `${s.name}-${s.tmdbId}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
})

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return allSeries.value.filter(
    (s) => s.name.toLowerCase().includes(q) || s.genres.some((g) => g.toLowerCase().includes(q)),
  )
})

watch(query, (q) => {
  router.replace({ query: q ? { q } : {} })
})

useHead({ title: t('nav.search') })
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <h1 class="font-display text-3xl font-bold text-milk-parchment">{{ $t('nav.search') }}</h1>
    <input
      v-model="query"
      type="search"
      placeholder="חפשו סדרה או ז'אנר..."
      class="mt-4 w-full rounded-lg border border-charcoal-line bg-charcoal-deep px-4 py-2 text-milk-parchment placeholder:text-mist-grey focus:border-sunset-gold focus:outline-none"
    />

    <div v-if="results.length" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SeriesCard
        v-for="item in results"
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
    <p v-else-if="query" class="mt-8 text-mist-grey">לא נמצאו תוצאות עבור "{{ query }}".</p>
  </div>
</template>
