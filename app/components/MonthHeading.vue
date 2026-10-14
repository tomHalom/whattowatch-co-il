<script setup lang="ts">
// כותרת חודש/שנה בולטת — כשמנווטים בין חודשים (MonthNav) הטקסט הקבוע
// לא משתנה וקל לפספס שהתוכן החליף חודש. השם/שנה הם כאן האלמנט
// החזותי הכי גדול בעמוד (לא סיפא קטנה של משפט), ומקבלים אנימציית
// כניסה שרצה מחדש בכל טעינת עמוד — כדי שהשינוי "יתפוס את העין".
defineProps<{
  kicker: string
  monthLabel: string
  year: number
}>()
</script>

<template>
  <div>
    <p class="month-heading-kicker">{{ kicker }}</p>
    <h1 class="month-heading-date">
      <span class="month-heading-month">{{ monthLabel }}</span>
      <span class="month-heading-year">{{ year }}</span>
    </h1>
  </div>
</template>

<style scoped>
.month-heading-kicker {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(242, 238, 228, 0.55);
}
.month-heading-date {
  margin-top: 0.2rem;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.6rem;
  line-height: 1;
  animation: monthHeadingPop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.month-heading-month {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.4rem, 6.5vw, 4.25rem);
  color: #f2eee4;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
}
.month-heading-year {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: clamp(1.4rem, 3.2vw, 2.2rem);
  color: #e8a33d;
  text-shadow: 0 2px 16px rgba(232, 163, 61, 0.35);
}
@keyframes monthHeadingPop {
  from {
    opacity: 0;
    transform: translateY(0.5rem) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .month-heading-date {
    animation: none;
  }
}
</style>
