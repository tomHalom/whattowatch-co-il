<script setup lang="ts">
// יחידה ידנית נרנדרת רק כשיש מזהה מספרי מ-AdSense.
// בלי מזהה, Auto ads (הפלאגין) מטפל במודעות — בלי תיבת placeholder.
const props = withDefaults(
  defineProps<{
    slotId: 'home-mid' | 'provider-mid' | 'monthly-mid'
    format?: 'auto' | 'rectangle' | 'horizontal'
  }>(),
  { format: 'auto' },
)

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
    class="my-6 flex min-h-[100px] items-center justify-center"
    :data-slot="slotId"
  >
    <ins
      class="adsbygoogle block w-full"
      :style="'display:block'"
      :data-ad-client="pub.adsensePublisherId"
      :data-ad-slot="adUnitId"
      :data-ad-format="format"
      data-full-width-responsive="true"
    />
  </div>
</template>
