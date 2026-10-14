export default defineNuxtPlugin(() => {
  const { public: pub } = useRuntimeConfig()
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
})
