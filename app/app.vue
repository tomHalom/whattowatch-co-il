<script setup lang="ts">
const { public: pub } = useRuntimeConfig()

// useLocaleHead מזריק אוטומטית hreflang alternate links לכל locale
// מוגדר. כרגע רק he פעיל, אז זה סתם self-reference — אבל כשתופעל en
// (ראה nuxt.config.ts i18n.locales), ה-hreflang יתעדכן בלי שינוי קוד.
const localeHead = useLocaleHead()

useHead({
  htmlAttrs: { lang: 'he', dir: 'rtl' },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ...(localeHead.value.link ?? []),
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=IBM+Plex+Sans+Hebrew:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap&subset=hebrew',
    },
  ],
  titleTemplate: (title) => (title ? `${title} | ${pub.siteName}` : pub.siteName),
})

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: pub.siteName,
  url: pub.siteUrl,
  inLanguage: 'he-IL',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${pub.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}))
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
