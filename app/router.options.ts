import type { RouterConfig } from '@nuxt/schema'

export default {
  scrollBehavior(to, from, savedPosition) {
    // Opening or closing the series popup only changes the hash.
    if (to.path === from.path && (to.hash === '#series' || from.hash === '#series')) {
      return false
    }
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
} satisfies RouterConfig
