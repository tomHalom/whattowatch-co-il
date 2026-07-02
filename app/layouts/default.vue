<script setup lang="ts">
const { public: pub } = useRuntimeConfig()
const year = new Date().getFullYear()
const mobileMenuOpen = ref(false)

const genres = [
  { slug: 'drama',       label: 'דרמה' },
  { slug: 'comedy',      label: 'קומדיה' },
  { slug: 'action',      label: 'אקשן' },
  { slug: 'thriller',    label: 'מתח' },
  { slug: 'romance',     label: 'רומנטי' },
  { slug: 'documentary', label: 'דוקומנטרי' },
  { slug: 'kids',        label: 'ילדים' },
  { slug: 'anime',       label: 'אנימה' },
  { slug: 'israeli',     label: '🇮🇱 ישראלי' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- ── Header ──────────────────────────────────────────────────── -->
    <header class="sticky top-0 z-50 border-b border-charcoal-line bg-charcoal-night/90 backdrop-blur-sm">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <span
            class="inline-block h-7 w-7 rounded-md bg-sunset-gold text-charcoal-night font-display font-black text-sm flex items-center justify-center leading-none group-hover:scale-105 transition-transform"
          >W</span>
          <span class="font-display text-base font-bold text-milk-parchment hidden sm:block">{{ pub.siteName }}</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-5 text-sm">
          <NuxtLink
            to="/netflix"
            class="text-mist-grey hover:text-sunset-gold transition-colors"
            active-class="text-sunset-gold"
          >
            ארכיון נטפליקס
          </NuxtLink>
          <NuxtLink
            to="/providers/netflix"
            class="text-mist-grey hover:text-sunset-gold transition-colors"
            active-class="text-sunset-gold"
          >
            נטפליקס
          </NuxtLink>

          <!-- Genres dropdown -->
          <div class="relative group">
            <button class="flex items-center gap-1 text-mist-grey hover:text-sunset-gold transition-colors">
              ז'אנרים <span class="text-xs opacity-60">▾</span>
            </button>
            <div
              class="absolute left-0 top-full mt-2 w-40 rounded-lg border border-charcoal-line bg-charcoal-deep shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50"
            >
              <NuxtLink
                v-for="g in genres"
                :key="g.slug"
                :to="`/netflix/zanre/${g.slug}`"
                class="block px-4 py-2 text-sm text-mist-grey hover:text-sunset-gold hover:bg-charcoal-line/40 first:rounded-t-lg last:rounded-b-lg transition-colors"
              >
                {{ g.label }}
              </NuxtLink>
            </div>
          </div>
        </nav>

        <!-- Mobile menu toggle -->
        <button
          class="md:hidden text-mist-grey hover:text-sunset-gold transition-colors"
          :aria-label="mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span class="text-xl">{{ mobileMenuOpen ? '✕' : '☰' }}</span>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t border-charcoal-line px-4 py-3 space-y-2">
        <NuxtLink to="/netflix" class="block text-sm text-mist-grey py-1" @click="mobileMenuOpen = false">ארכיון נטפליקס</NuxtLink>
        <NuxtLink to="/providers/netflix" class="block text-sm text-mist-grey py-1" @click="mobileMenuOpen = false">נטפליקס</NuxtLink>
        <div class="border-t border-charcoal-line pt-2">
          <p class="text-xs text-mist-grey/60 mb-1">ז'אנרים</p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="g in genres"
              :key="g.slug"
              :to="`/netflix/zanre/${g.slug}`"
              class="text-xs text-mist-grey bg-charcoal-line rounded-full px-3 py-1"
              @click="mobileMenuOpen = false"
            >
              {{ g.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <!-- ── Footer ──────────────────────────────────────────────────── -->
    <footer class="border-t border-charcoal-line mt-16">
      <div class="mx-auto max-w-5xl px-4 py-10 text-sm text-mist-grey">
        <div class="grid gap-6 sm:grid-cols-3">
          <div>
            <p class="font-display font-bold text-milk-parchment mb-2">{{ pub.siteName }}</p>
            <p class="text-xs leading-relaxed">המדריך החודשי לסדרות הכי מומלצות בנטפליקס — מתעדכן אוטומטית כל חודש.</p>
          </div>
          <div>
            <p class="font-semibold text-milk-parchment/80 mb-2 text-xs uppercase tracking-wider">ז'אנרים</p>
            <div class="flex flex-wrap gap-x-3 gap-y-1">
              <NuxtLink
                v-for="g in genres"
                :key="g.slug"
                :to="`/netflix/zanre/${g.slug}`"
                class="link-quiet text-xs"
              >{{ g.label }}</NuxtLink>
            </div>
          </div>
          <div>
            <p class="font-semibold text-milk-parchment/80 mb-2 text-xs uppercase tracking-wider">מידע</p>
            <div class="flex flex-col gap-1">
              <NuxtLink to="/privacy" class="link-quiet text-xs">{{ $t('footer.privacy') }}</NuxtLink>
              <NuxtLink to="/terms" class="link-quiet text-xs">{{ $t('footer.terms') }}</NuxtLink>
            </div>
          </div>
        </div>
        <p class="mt-8 border-t border-charcoal-line pt-4 text-xs text-mist-grey/50">
          © {{ year }} {{ pub.siteName }} — {{ $t('footer.rights') }}
        </p>
      </div>
    </footer>
  </div>
</template>
