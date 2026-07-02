<script setup lang="ts">
// קישורי affiliate נבנים מ-runtime config (env), לעולם לא hardcoded
// בתבנית. providerId מצביע על ספק affiliate מוגדר; אם אין מזהה
// מוגדר עבורו ב-env, הכפתור לא מרונדר בכלל (לא שובר UI, לא מטעה).
const props = defineProps<{
  provider: 'nordvpn' | 'amazon'
  path?: string
  label: string
}>()

const { public: pub } = useRuntimeConfig()

const href = computed(() => {
  if (props.provider === 'nordvpn') {
    if (!pub.affiliateNordvpnId) return null
    return `https://go.nordvpn.net/aff_c?offer_id=${encodeURIComponent(pub.affiliateNordvpnId)}${props.path ? `&url=${encodeURIComponent(props.path)}` : ''}`
  }
  if (props.provider === 'amazon') {
    if (!pub.affiliateAmazonTag) return null
    return `https://www.amazon.com${props.path || ''}?tag=${encodeURIComponent(pub.affiliateAmazonTag)}`
  }
  return null
})
</script>

<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="sponsored noopener noreferrer"
    class="inline-flex items-center gap-1 rounded-full bg-sunset-gold px-4 py-2 text-sm font-semibold text-charcoal-night"
  >
    {{ label }}
    <span class="text-[10px] font-normal opacity-70">({{ $t('affiliate.sponsored') }})</span>
  </a>
</template>
