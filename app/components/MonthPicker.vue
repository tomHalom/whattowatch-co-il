<script setup lang="ts">
interface PickableMonth {
  slug: string
  monthLabel: string
  year: number
  series?: { name: string; nameHe?: string; posterPath: string | null }[]
}

const props = defineProps<{
  months: PickableMonth[]
  currentSlug?: string
}>()

// מקבץ לפי שנה (הקלט כבר ממוין DESC לפי slug, אז זה שומר על הרצף)
// לתצוגה נוחה יותר — במקום רשת אחת גדולה ומעורבת של כל החודשים.
const groups = computed(() => {
  const byYear: { year: number; months: typeof props.months }[] = []
  for (const m of props.months) {
    const last = byYear[byYear.length - 1]
    if (last && last.year === m.year) last.months.push(m)
    else byYear.push({ year: m.year, months: [m] })
  }
  return byYear
})

function topPick(month: PickableMonth) {
  return month.series?.[0] ?? null
}
function tileStyle(month: PickableMonth) {
  const pick = topPick(month)
  return pick?.posterPath ? { backgroundImage: `url(${pick.posterPath})` } : {}
}
</script>

<template>
  <div class="space-y-6">
    <div v-for="group in groups" :key="group.year">
      <h3 class="mb-3 font-utility text-sm font-bold tracking-wide text-sunset-gold">{{ group.year }}</h3>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="month in group.months"
          :key="month.slug"
          :to="`/netflix/${month.slug}`"
          class="month-tile"
          :class="{ 'month-tile--current': month.slug === currentSlug }"
          :style="tileStyle(month)"
          :aria-label="`${month.monthLabel} ${month.year}${topPick(month) ? ` — כולל ${topPick(month)!.nameHe || topPick(month)!.name}` : ''}`"
        >
          <span class="month-tile-scrim" aria-hidden="true" />
          <span class="month-tile-date">
            <span class="month-tile-month">{{ month.monthLabel }}</span>
            <span class="month-tile-year">{{ month.year }}</span>
          </span>
          <span v-if="topPick(month)" class="month-tile-pick">
            🏆 {{ topPick(month)!.nameHe || topPick(month)!.name }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── חודש כ"פוסטר קולנועי" — הפוסטר האמיתי של הבחירה #1 של אותו
     חודש מזהה אותו במבט אחד, בלי לקרוא תאריך. שקוף מעל: תאריך +
     שם הבחירה המובילה. בהשראת שורות "Top 10" של שירותי סטרימינג
     ורשימות "best of the month" עיתונאיות, שמשתמשות בפוסטר עצמו
     כתמונת התג של התקופה — לא בטקסט בלבד. ──────────────────────── */
.month-tile {
  position: relative;
  width: 8rem;
  height: 11.25rem;
  border-radius: 0.85rem;
  overflow: hidden;
  background-color: #1c1b27;
  background-size: cover;
  background-position: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.month-tile:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 30px rgba(232, 163, 61, 0.3);
}
.month-tile-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(20, 19, 28, 0.15) 0%, rgba(20, 19, 28, 0.35) 45%, rgba(20, 19, 28, 0.95) 100%);
}
.month-tile-date {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.55rem 0.65rem 0;
}
.month-tile-month {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.95rem;
  color: #f2eee4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.month-tile-year {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: rgba(242, 238, 228, 0.75);
}
.month-tile-pick {
  position: relative;
  z-index: 1;
  padding: 0 0.65rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #e8a33d;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.month-tile--current {
  outline: 2px solid #e8a33d;
  outline-offset: 2px;
}
.month-tile--current .month-tile-month {
  color: #f0c579;
}
</style>
