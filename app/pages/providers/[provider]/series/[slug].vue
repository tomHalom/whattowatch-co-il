<script setup lang="ts">
import { seriesIsIndexable } from '~/utils/seriesIndexable'

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

const series = computed(() => {
  const matches = allSeries.value.filter((s) => slugify(s.name, s.tmdbId) === seriesSlug)
  return matches.find((s) => seriesIsIndexable(s)) ?? matches[0]
})

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

const displayName = computed(() => series.value?.nameHe || series.value?.name || '')
const indexable = computed(() => seriesIsIndexable(series.value))

useHead({
  title: `${displayName.value} — המלצה, טריילר ותקציר`,
  meta: [
    { name: 'description', content: series.value.editorReview || series.value.overview },
    { property: 'og:title', content: displayName.value },
    { property: 'og:description', content: series.value.editorReview || series.value.overview },
    { property: 'og:image', content: series.value.posterPath || undefined },
    ...(!indexable.value ? [{ name: 'robots', content: 'noindex, follow' }] : []),
  ],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/providers/${providerSlug}/series/${seriesSlug}` }],
})

useJsonLd(
  () => ({
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: series.value!.nameHe || series.value!.name,
    description: series.value!.editorReview || series.value!.overview,
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
        { label: displayName },
      ]"
    />

    <h1 class="mt-4 font-display text-3xl font-bold text-milk-parchment">{{ displayName }}</h1>
    <p v-if="series.nameHe && series.name !== series.nameHe" class="mt-1 text-sm text-mist-grey" dir="ltr">{{ series.name }}</p>

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
      <span v-if="series.seasons">{{ series.seasons === 1 ? 'עונה אחת' : `${series.seasons} עונות` }}</span>
      <span v-if="series.firstAirDate">{{ new Date(series.firstAirDate).getFullYear() }}</span>
      <span v-for="genre in series.genres" :key="genre" class="rounded-full bg-charcoal-line px-2 py-0.5">
        {{ genre }}
      </span>
    </div>

    <p class="mt-4 text-base leading-relaxed text-milk-parchment">{{ series.overview }}</p>

    <section v-if="series.seasons" class="mt-6">
      <h2 class="font-display text-lg font-bold text-milk-parchment">לפני שמתחילים</h2>
      <p class="mt-2 text-base leading-relaxed text-milk-parchment">
        <template v-if="series.seasons === 1">יש כאן עונה אחת, בלי ארכיון ארוך.</template>
        <template v-else>יש כאן {{ series.seasons }} עונות. שווה לתת לזה שני פרקים לפני שמחליטים אם להמשיך.</template>
      </p>
    </section>

    <div v-if="series.editorReview" class="editor-review">
      <div class="editor-review-header">
        <span aria-hidden="true">✍️</span>
        <span class="editor-label">ביקורת הבינג'יונרים</span>
      </div>
      <blockquote class="editor-quote">{{ series.editorReview }}</blockquote>
    </div>

    <AffiliateLink
      class="mt-6"
      provider="nordvpn"
      label="לצפייה מכל מקום בעולם — נסו VPN"
    />

    <section v-if="similar.length" class="mt-10">
      <h2 class="font-display text-xl font-bold text-milk-parchment">סדרות בדומה ל{{ displayName }}</h2>
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

<style scoped>
.editor-review {
  margin-top: 1.25rem;
  background: linear-gradient(135deg, rgba(230, 60, 40, 0.06), rgba(255, 140, 0, 0.04));
  border: 1px solid rgba(230, 60, 40, 0.2);
  border-inline-start: 3px solid #e63c28;
  border-radius: 0.5rem;
  padding: 1rem 1.15rem;
}
.editor-review-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.editor-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #e63c28;
}
.editor-quote {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(242, 238, 228, 0.92);
}
</style>
