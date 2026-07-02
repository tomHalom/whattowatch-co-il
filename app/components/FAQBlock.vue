<script setup lang="ts">
defineProps<{ items: { question: string; answer: string }[] }>()
</script>

<template>
  <section>
    <h2 class="font-display text-2xl font-bold text-milk-parchment">{{ $t('faq.title') }}</h2>
    <div class="mt-4 divide-y divide-charcoal-line">
      <details v-for="item in items" :key="item.question" class="group py-4">
        <summary class="cursor-pointer list-none font-semibold text-milk-parchment">
          {{ item.question }}
        </summary>
        <p class="mt-2 text-mist-grey">{{ item.answer }}</p>
      </details>
    </div>
  </section>
</template>
