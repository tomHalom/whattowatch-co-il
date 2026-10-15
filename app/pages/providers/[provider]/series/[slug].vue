<script setup lang="ts">
const route = useRoute()
const providerSlug = route.params.provider as string
const seriesSlug = route.params.slug as string
const { public: pub } = useRuntimeConfig()
const { selected, open, close } = useSeriesModal()

const { data: provider } = await useAsyncData(`provider-${providerSlug}-meta-series`, () =>
  queryCollection('providers').where('slug', '=', providerSlug).first(),
)
if (!provider.value) throw createError({ statusCode: 404, statusMessage: 'ספק לא נמצא' })

const { data: months } = await useAsyncData(`provider-${providerSlug}-all-series`, () =>
  providerSlug === 'netflix' ? queryCollection('netflixMonthly').all() : Promise.resolve([]),
)

const allSeries = computed(() => (months.value ?? []).flatMap((m) => m.series))

const series = computed(() =>
  allSeries.value.find((s) => slugify(s.name, s.tmdbId) === seriesSlug),
)

if (!series.value) {
  throw createError({ statusCode: 404, statusMessage: 'הסדרה לא נמצאה' })
}

const similar = computed(() =>
  allSeries.value
    .filter(
      (s) =>
        slugify(s.name, s.tmdbId) !== seriesSlug &&
        s.genres.some((g) => series.value!.genres.includes(g)),
    )
    .filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i)
    .slice(0, 3),
)

useHead({
  title: `${series.value.name} — טריילר, דירוג ותקציר`,
  meta: [
    { name: 'description', content: series.value.overview },
    { property: 'og:title', content: series.value.name },
    { property: 'og:description', content: series.value.overview },
    { property: 'og:image', content: series.value.posterPath || undefined },
  ],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/providers/${providerSlug}/series/${seriesSlug}` }],
})

useJsonLd(
  () => ({
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: series.value!.name,
    description: series.value!.overview,
    image: series.value!.posterPath || undefined,
    genre: series.value!.genres,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: series.value!.voteAverage,
      bestRating: 10,
    },
  }),
  'series-detail',
)
</script>

<template>
  <div v-if="series" class="mx-auto max-w-3xl px-4 py-10">
    <SeriesModal :series="selected" @close="close" />

    <Breadcrumbs
      :items="[
        { label: 'בית', to: '/' },
        { label: provider!.name, to: `/providers/${providerSlug}` },
        { label: series.name },
      ]"
    />

    <h1 class="mt-4 font-display text-3xl font-bold text-milk-parchment">{{ series.name }}</h1>

    <div class="mt-4 aspect-video overflow-hidden rounded-xl bg-charcoal-deep">
      <iframe
        v-if="series.trailerYoutubeId"
        class="h-full w-full"
        :src="`https://www.youtube-nocookie.com/embed/${series.trailerYoutubeId}`"
        title="נגן טריילר"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      />
      <img
        v-else-if="series.posterPath"
        :src="posterSrc(series.posterPath)"
        :alt="`פוסטר ${series.name}`"
        class="h-full w-full object-cover"
      />
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-mist-grey">
      <span class="font-utility text-sunset-gold">★ {{ series.voteAverage }}</span>
      <span v-for="genre in series.genres" :key="genre" class="rounded-full bg-charcoal-line px-2 py-0.5">
        {{ genre }}
      </span>
    </div>

    <p class="mt-4 text-milk-parchment">{{ series.overview }}</p>

    <AffiliateLink
      class="mt-6"
      provider="nordvpn"
      label="לצפייה מכל מקום בעולם — נסו VPN"
    />

    <section v-if="similar.length" class="mt-10">
      <h2 class="font-display text-xl font-bold text-milk-parchment">סדרות בדומה ל-{{ series.name }}</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-3">
        <SeriesCard
          v-for="item in similar"
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
          @open-modal="open(item)"
        />
      </div>
    </section>
  </div>
</template>
