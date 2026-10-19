<script setup lang="ts">
// גובה קבוע כדי שמודעה שנטענת אחרי הציור הראשון לא תדחוף את העמוד.
// Auto ads (הגדרה בחשבון AdSense) עדיין יכולות להזריק יחידות נוספות.
const props = defineProps<{
  slotId: 'home-mid' | 'provider-mid' | 'monthly-mid'
}>()

const { public: pub } = useRuntimeConfig()

const adUnitId = computed(() => {
  const units: Record<typeof props.slotId, string> = {
    'home-mid': pub.adsenseSlotHome,
    'provider-mid': pub.adsenseSlotProvider,
    'monthly-mid': pub.adsenseSlotMonthly,
  }
  const raw = (units[props.slotId] || '').trim()
  return /^\d+$/.test(raw) ? raw : ''
})

onMounted(() => {
  if (!adUnitId.value || !pub.adsenseEnabled || !pub.adsensePublisherId) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
  } catch {
    /* הסקריפט עדיין לא נטען — הדחיפה הבאה תתפוס */
  }
})
</script>

<template>
  <div
    v-if="adUnitId && pub.adsenseEnabled && pub.adsensePublisherId"
    class="ad-slot my-6"
    :data-slot="slotId"
  >
    <ins
      class="adsbygoogle"
      :data-ad-client="pub.adsensePublisherId"
      :data-ad-slot="adUnitId"
      data-ad-format="auto"
      data-full-width-responsive="false"
    />
  </div>
</template>

<style scoped>
/* Reserved before the ad arrives: a rectangle on a phone, a banner on a desktop. */
.ad-slot,
.ad-slot .adsbygoogle {
  display: block;
  width: 100%;
  height: 250px;
  overflow: hidden;
}
@media (min-width: 768px) {
  .ad-slot,
  .ad-slot .adsbygoogle {
    height: 90px;
  }
}
</style>
