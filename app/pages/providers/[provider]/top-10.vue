<script setup lang="ts">
const route = useRoute()
const providerSlug = route.params.provider as string
const { public: pub } = useRuntimeConfig()

const { data: provider } = await useAsyncData(`provider-${providerSlug}-meta`, () =>
  queryCollection('providers').where('slug', '=', providerSlug).first(),
)
if (!provider.value) throw createError({ statusCode: 404, statusMessage: 'ספק לא נמצא' })

const { data: page } = await useAsyncData(`provider-${providerSlug}-top10`, () => {
  if (providerSlug !== 'netflix') return Promise.resolve(null)
  return queryCollection('netflixMonthly').order('slug', 'DESC').first()
})

useHead({
  title: `טופ 10 ${provider.value.name}`,
  meta: [{ name: 'description', content: provider.value.seoDescription }],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/providers/${providerSlug}/top-10` }],
})

if (page.value) {
  useJsonLd(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `טופ 10 ${provider.value!.name} — ${page.value!.monthLabel} ${page.value!.year}`,
      itemListElement: page.value!.series.map((s) => ({
        '@type': 'ListItem',
        position: s.rank,
        name: s.name,
        url: `${pub.siteUrl}/providers/${providerSlug}/series/${slugify(s.name, s.tmdbId)}`,
      })),
    }),
    'provider-top10-itemlist',
  )
}
</script>

<template>
  <div v-if="provider" class="mx-auto max-w-5xl px-4 py-10">
    <Breadcrumbs
      :items="[
        { label: 'בית', to: '/' },
        { label: provider.name, to: `/providers/${providerSlug}` },
        { label: 'טופ 10' },
      ]"
    />
    <h1 class="mt-4 font-display text-3xl font-bold text-milk-parchment">טופ 10 — {{ provider.name }}</h1>

    <div v-if="page" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        :to="`/providers/${providerSlug}/series/${slugify(item.name, item.tmdbId)}`"
      />
    </div>
    <p v-else class="mt-6 rounded border border-dashed border-charcoal-line p-4 text-sm text-mist-grey">
      עדיין אין נתוני טופ 10 לספק הזה.
    </p>
  </div>
</template>
