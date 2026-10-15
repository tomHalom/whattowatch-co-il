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
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: 'anonymous', href: '/fonts/j8_w6_fAw7jrcalD7oKYNX0QfAnPW7Ll4brkiY-xBg.woff2' },
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: 'anonymous', href: '/fonts/j8_w6_fAw7jrcalD7oKYNX0QfAnPW7Dl4brkiY8.woff2' },
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: 'anonymous', href: '/fonts/BCa2qYENg9Kw1mpLpO0bGM5lfHAAZHhDXE2g-lgVrjaNzC4.woff2' },
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
