<script setup lang="ts">
const route = useRoute()
const providerSlug = route.params.provider as string
const { public: pub } = useRuntimeConfig()

const { data: provider } = await useAsyncData(`provider-${providerSlug}`, () =>
  queryCollection('providers').where('slug', '=', providerSlug).first(),
)

if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'ספק לא נמצא' })
}

const { data: latestMonth } = await useAsyncData(`provider-${providerSlug}-latest`, () => {
  if (providerSlug !== 'netflix') return Promise.resolve(null)
  return queryCollection('netflixMonthly').order('slug', 'DESC').first()
})

useHead({
  title: provider.value.seoTitle,
  meta: [{ name: 'description', content: provider.value.seoDescription }],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/providers/${providerSlug}` }],
})
</script>

<template>
  <div v-if="provider" class="mx-auto max-w-5xl px-4 py-10">
    <Breadcrumbs :items="[{ label: 'בית', to: '/' }, { label: provider.name }]" />
    <h1 class="mt-4 font-display text-3xl font-bold text-milk-parchment">{{ provider.name }}</h1>
    <p class="mt-2 text-mist-grey">{{ provider.seoDescription }}</p>

    <template v-if="latestMonth">
      <NuxtLink
        :to="`/providers/${providerSlug}/top-10`"
        class="mt-4 inline-block rounded-full bg-sunset-gold px-5 py-2 font-semibold text-charcoal-night"
      >
        טופ 10 החודש — {{ latestMonth.monthLabel }} {{ latestMonth.year }}
      </NuxtLink>
    </template>
    <p v-else class="mt-6 rounded border border-dashed border-charcoal-line p-4 text-sm text-mist-grey">
      המדריך החודשי לספק הזה בקרוב — הארכיטקטורה מוכנה, רק נדרשת הזנת תוכן.
    </p>
  </div>
</template>
