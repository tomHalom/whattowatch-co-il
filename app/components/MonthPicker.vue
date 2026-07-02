<script setup lang="ts">
defineProps<{
  months: { slug: string; monthLabel: string; year: number }[]
  currentSlug?: string
}>()
</script>

<template>
  <nav class="flex flex-wrap gap-2">
    <NuxtLink
      v-for="month in months"
      :key="month.slug"
      :to="`/netflix/${month.slug}`"
      class="rounded-full border px-3 py-1 text-sm transition-colors"
      :class="
        month.slug === currentSlug
          ? 'border-sunset-gold bg-sunset-gold/10 text-sunset-gold'
          : 'border-charcoal-line text-mist-grey hover:border-sunset-gold hover:text-sunset-gold'
      "
    >
      {{ month.monthLabel }} {{ month.year }}
    </NuxtLink>
  </nav>
</template>
