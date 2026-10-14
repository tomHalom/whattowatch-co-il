<script setup lang="ts">
defineProps<{
  prevMonth?: { slug: string; monthLabel: string; year: number } | null
  nextMonth?: { slug: string; monthLabel: string; year: number } | null
}>()
</script>

<template>
  <nav class="flex flex-wrap items-stretch gap-3" aria-label="ניווט בין חודשים">
    <!-- "חודש הבא" בצד ימין (ראשון ב-DOM, שקוראים RTL הוא הצד הפותח) -->
    <NuxtLink
      v-if="nextMonth"
      :to="`/netflix/${nextMonth.slug}`"
      class="group flex flex-1 basis-56 items-center gap-2 rounded-xl border border-charcoal-line px-4 py-3 transition-colors hover:border-sunset-gold"
    >
      <span class="text-xl text-sunset-gold" aria-hidden="true">‹</span>
      <span class="flex min-w-0 flex-col overflow-hidden text-right">
        <span class="text-xs text-mist-grey">חודש הבא</span>
        <span class="font-bold leading-tight text-milk-parchment group-hover:text-sunset-gold">{{ nextMonth.monthLabel }} {{ nextMonth.year }}</span>
      </span>
    </NuxtLink>
    <span v-else class="flex flex-1 basis-56 items-center gap-2 rounded-xl border border-charcoal-line px-4 py-3 opacity-40">
      <span class="text-xl text-mist-grey" aria-hidden="true">‹</span>
      <span class="flex min-w-0 flex-col overflow-hidden text-right">
        <span class="text-xs text-mist-grey">חודש הבא</span>
        <span class="font-bold leading-tight text-milk-parchment">זה החודש העדכני ביותר</span>
      </span>
    </span>

    <!-- "חודש קודם" בצד שמאל (שני ב-DOM, שב-RTL נופל לצד השמאלי) -->
    <NuxtLink
      v-if="prevMonth"
      :to="`/netflix/${prevMonth.slug}`"
      class="group flex flex-1 basis-56 items-center justify-end gap-2 rounded-xl border border-charcoal-line px-4 py-3 transition-colors hover:border-sunset-gold"
    >
      <span class="flex min-w-0 flex-col overflow-hidden text-left">
        <span class="text-xs text-mist-grey">חודש קודם</span>
        <span class="font-bold leading-tight text-milk-parchment group-hover:text-sunset-gold">{{ prevMonth.monthLabel }} {{ prevMonth.year }}</span>
      </span>
      <span class="text-xl text-sunset-gold" aria-hidden="true">›</span>
    </NuxtLink>
    <span v-else class="flex flex-1 basis-56 items-center justify-end gap-2 rounded-xl border border-charcoal-line px-4 py-3 opacity-40">
      <span class="flex min-w-0 flex-col overflow-hidden text-left">
        <span class="text-xs text-mist-grey">חודש קודם</span>
        <span class="font-bold leading-tight text-milk-parchment">זה החודש הראשון בארכיון</span>
      </span>
      <span class="text-xl text-mist-grey" aria-hidden="true">›</span>
    </span>
  </nav>
</template>
