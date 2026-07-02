<script setup lang="ts">
// מיקום מודעה מוגדר-חוץ (configurable), לעולם לא hardcoded. שומר
// שטח מראש (min-height) כדי לא לגרום ל-layout shift (CLS) כשהמודעה
// נטענת. אם AdSense לא מאושר/מופעל — מרונדר placeholder שקט בלבד.
const props = withDefaults(
  defineProps<{
    slotId: string
    format?: 'auto' | 'rectangle' | 'horizontal'
  }>(),
  { format: 'auto' },
)

const { public: pub } = useRuntimeConfig()
const adRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!pub.adsenseEnabled || !pub.adsensePublisherId) return
  useHead({
    script: [
      {
        key: 'adsbygoogle-lib',
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pub.adsensePublisherId}`,
        async: true,
        crossorigin: 'anonymous',
      },
    ],
  })
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
  } catch {
    /* AdSense עדיין לא נטען — לא קריטי, ה-script יתפוס בטעינה הבאה */
  }
})
</script>

<template>
  <div ref="adRef" class="my-6 flex min-h-[100px] items-center justify-center" :data-slot="slotId">
    <ins
      v-if="pub.adsenseEnabled && pub.adsensePublisherId"
      class="adsbygoogle block w-full"
      :style="'display:block'"
      :data-ad-client="pub.adsensePublisherId"
      :data-ad-slot="slotId"
      :data-ad-format="format"
      data-full-width-responsive="true"
    />
    <div
      v-else
      class="w-full rounded border border-dashed border-charcoal-line py-8 text-center text-xs text-mist-grey"
    >
      מקום מודעה ({{ slotId }})
    </div>
  </div>
</template>
