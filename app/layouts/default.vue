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
  { slug: 'halloween',   label: '🎃 האלווין' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- ── Header ──────────────────────────────────────────────────── -->
    <header class="sticky top-0 z-50 border-b border-charcoal-line bg-charcoal-night/90 backdrop-blur-sm">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <!-- Logo: a gold lounge facing a small set, same mark as the favicon. -->
        <NuxtLink
          to="/"
          class="flex items-center gap-2 group"
          title="נולד בלילה אחד גדול של בינג' — ותודה לתום שלא הלך לישון 🌙"
        >
          <svg
            viewBox="0 0 40 40"
            class="h-8 w-8 shrink-0 transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            <defs>
              <filter id="logo-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#logo-glow)">
              <rect x="4.2" y="20.4" width="18.6" height="8.4" rx="2.2" fill="#E8A33D" />
              <rect x="3.2" y="13.2" width="6.2" height="15" rx="2.4" fill="#E8A33D" />
              <rect x="5.4" y="28.4" width="3.1" height="3" rx="0.7" fill="#E8A33D" />
              <rect x="16.6" y="28.4" width="3.1" height="3" rx="0.7" fill="#E8A33D" />
              <path d="M27.4 11.2 L29.2 14.6 M35.2 11 L33.4 14.6" stroke="#E8A33D" stroke-width="1.5" stroke-linecap="round" />
              <rect x="24.6" y="14.8" width="12.4" height="9.4" rx="1.6" fill="#E8A33D" />
              <rect x="26.2" y="16.3" width="9.2" height="6.4" rx="0.7" fill="#D64545" />
              <rect x="28.8" y="24.2" width="4" height="1.7" rx="0.4" fill="#E8A33D" />
              <rect x="27.2" y="25.6" width="7.2" height="1.5" rx="0.4" fill="#C4842A" />
            </g>
          </svg>
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
                :to="`/netflix/genre/${g.slug}`"
                class="block px-4 py-2 text-sm hover:text-sunset-gold hover:bg-charcoal-line/40 first:rounded-t-lg last:rounded-b-lg transition-colors"
                :class="g.slug === 'halloween' ? 'font-bold text-milk-parchment' : 'text-mist-grey'"
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
          <p class="text-xs text-mist-grey mb-1">ז'אנרים</p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="g in genres"
              :key="g.slug"
              :to="`/netflix/genre/${g.slug}`"
              class="rounded-full bg-charcoal-line px-3 py-1 text-xs"
              :class="g.slug === 'halloween' ? 'font-bold text-milk-parchment' : 'text-mist-grey'"
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
            <p class="text-xs leading-relaxed">המדריך החודשי לסדרות הכי מומלצות בנטפליקס — נבחר בקפידה על ידי הצוות בכל חודש.</p>
          </div>
          <div>
            <p class="font-semibold text-milk-parchment/80 mb-2 text-xs uppercase tracking-wider">ז'אנרים</p>
            <div class="flex flex-wrap gap-x-3 gap-y-2">
              <NuxtLink
                v-for="g in genres"
                :key="g.slug"
                :to="`/netflix/genre/${g.slug}`"
                class="link-quiet inline-flex min-h-6 items-center py-1 text-xs"
                :class="g.slug === 'halloween' ? 'font-bold text-milk-parchment' : ''"
              >{{ g.label }}</NuxtLink>
            </div>
          </div>
          <div>
            <p class="font-semibold text-milk-parchment/80 mb-2 text-xs uppercase tracking-wider">מידע</p>
            <div class="flex flex-col gap-2">
              <NuxtLink to="/netflix/new" class="link-quiet inline-flex min-h-6 items-center text-xs">חדש על המדף</NuxtLink>
              <NuxtLink to="/netflix/new-seasons" class="link-quiet inline-flex min-h-6 items-center text-xs">עונות חדשות</NuxtLink>
              <NuxtLink to="/about" class="link-quiet inline-flex min-h-6 items-center text-xs">{{ $t('footer.about') }}</NuxtLink>
              <NuxtLink to="/privacy" class="link-quiet inline-flex min-h-6 items-center text-xs">{{ $t('footer.privacy') }}</NuxtLink>
              <NuxtLink to="/terms" class="link-quiet inline-flex min-h-6 items-center text-xs">{{ $t('footer.terms') }}</NuxtLink>
            </div>
          </div>
        </div>
        <p class="mt-8 border-t border-charcoal-line pt-4 text-xs text-mist-grey">
          © {{ year }} {{ pub.siteName }} — {{ $t('footer.rights') }}
        </p>
      </div>
    </footer>
  </div>
</template>
