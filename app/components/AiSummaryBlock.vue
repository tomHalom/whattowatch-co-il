<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <aside class="rounded-lg border border-charcoal-line bg-charcoal-deep p-4">
    <h2 class="font-utility text-xs uppercase tracking-wide text-sunset-gold">
      {{ $t('aiSummary.title') }}
    </h2>
    <p class="mt-2 text-milk-parchment">{{ text }}</p>
  </aside>
</template>
