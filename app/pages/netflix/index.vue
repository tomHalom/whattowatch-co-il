<script setup lang="ts">
const { data: months } = await useAsyncData('netflix-archive-months', () =>
  queryCollection('netflixMonthly').order('slug', 'DESC').all(),
)

useHead({
  title: 'ארכיון — נטפליקס טופ 10 חודשי',
  meta: [{ name: 'description', content: 'כל המדריכים החודשיים לטופ 10 הסדרות המומלצות בנטפליקס, לפי חודש.' }],
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <Breadcrumbs :items="[{ label: 'בית', to: '/' }, { label: 'ארכיון נטפליקס' }]" />
    <h1 class="mt-4 font-display text-3xl font-bold text-milk-parchment">ארכיון — נטפליקס טופ 10 חודשי</h1>
    <MonthPicker class="mt-6" :months="months ?? []" />
  </div>
</template>
