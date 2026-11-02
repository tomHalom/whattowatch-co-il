<script setup lang="ts">
const props = defineProps<{
  series: Array<{
    rank: number
    name: string
    nameHe?: string
    editorReview?: string
  }>
}>()

const picks = computed(() =>
  props.series.filter((item) => item.editorReview && item.editorReview.trim()),
)
</script>

<template>
  <section v-if="picks.length" class="monthly-picks">
    <h2 class="font-display text-xl font-bold text-milk-parchment">למה כל סדרה ברשימה</h2>
    <p class="mt-2 max-w-2xl text-sm leading-relaxed text-mist-grey">
      לפני הכרטיסיות, המשפט שבגללו הצוות השאיר כל סדרה בעשירייה.
    </p>
    <ol class="mt-5 space-y-4">
      <li v-for="item in picks" :key="item.rank + item.name" class="pick">
        <span class="pick-rank">{{ item.rank }}</span>
        <div class="min-w-0">
          <h3 class="font-display text-lg font-bold text-milk-parchment">{{ item.nameHe || item.name }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-milk-parchment/90">{{ item.editorReview }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.monthly-picks {
  margin-top: 2rem;
}
.pick {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}
.pick-rank {
  flex-shrink: 0;
  width: 1.75rem;
  font-family: var(--font-utility, ui-monospace, monospace);
  font-weight: 700;
  color: var(--clr-gold);
}
</style>
