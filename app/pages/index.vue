<script setup lang="ts">
const { public: pub } = useRuntimeConfig()

const { data: months } = await useAsyncData('home-months', () =>
  queryCollection('netflixMonthly').order('slug', 'DESC').all(),
)

const current = computed(() => months.value?.[0])
const archive = computed(() => months.value?.slice(1) ?? [])

// ─── Modal state ────────────────────────────────────────────────
const selectedSeries = ref<null | (typeof current.value extends null | undefined ? never : (typeof current.value)['series'][number])>(null)

function openModal(item: NonNullable<typeof selectedSeries.value>) {
  selectedSeries.value = item
}
function closeModal() {
  selectedSeries.value = null
}

const genres = [
  { slug: 'drama',       label: 'דרמה',       icon: '🎭' },
  { slug: 'thriller',    label: 'מתח',         icon: '😱' },
  { slug: 'comedy',      label: 'קומדיה',      icon: '😂' },
  { slug: 'action',      label: 'אקשן',        icon: '💥' },
  { slug: 'romance',     label: 'רומנטי',      icon: '❤️' },
  { slug: 'documentary', label: 'דוקומנטרי',   icon: '🎞️' },
  { slug: 'kids',        label: 'ילדים',       icon: '🧒' },
  { slug: 'anime',       label: 'אנימה',       icon: '⚔️' },
  { slug: 'israeli',     label: 'ישראלי',      icon: '🇮🇱' },
]

useHead({
  title: 'מה לצפות בנטפליקס — הסדרות הכי מומלצות',
  meta: [
    {
      name: 'description',
      content: `גלה את הסדרות הכי מומלצות בנטפליקס לחודש ${current.value?.monthLabel ?? ''} — טופ 10 מעודכן, טריילרים, דירוגים וז'אנרים. נבחר בקפידה על ידי צוות הבינג'יונרים שלנו.`,
    },
    { property: 'og:title', content: 'מה לצפות בנטפליקס — נטפליקס טופ 10 החודש' },
    { property: 'og:type', content: 'website' },
  ],
})

if (current.value) {
  useJsonLd(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `10 הסדרות הכי מומלצות בנטפליקס — ${current.value!.monthLabel} ${current.value!.year}`,
      itemListElement: current.value!.series.map((s) => ({
        '@type': 'ListItem',
        position: s.rank,
        name: s.name,
        url: `${pub.siteUrl}/providers/netflix/series/${slugify(s.name, s.tmdbId)}`,
      })),
    }),
    'home-itemlist',
  )
}
</script>

<template>
  <div>
    <!-- ── Modal ──────────────────────────────────────────────────────── -->
    <SeriesModal
      :series="selectedSeries"
      @close="closeModal"
    />

    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <section v-if="current" class="relative overflow-hidden border-b border-charcoal-line bg-charcoal-deep">
      <div class="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-utility text-xs tracking-widest text-sunset-gold uppercase">
            {{ $t('home.heroPrefix') }} — {{ current.monthLabel }} {{ current.year }}
          </span>
          <span class="text-xs text-mist-grey/50">|</span>
          <span class="text-xs text-mist-grey/60">נבחר בקפידה על ידי צוות הבינג'יונרים שלנו</span>
        </div>
        <h1 class="mt-3 font-display text-3xl font-black leading-tight text-milk-parchment md:text-5xl max-w-2xl">
          מה לצפות בנטפליקס — הסדרות הכי מומלצות לחודש {{ current.monthLabel }}
        </h1>
        <p class="mt-3 max-w-xl text-mist-grey leading-relaxed">
          {{ current.aiSummary }}
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink
            :to="`/netflix/${current.slug}`"
            class="inline-block rounded-full bg-sunset-gold px-6 py-2.5 font-semibold text-charcoal-night hover:bg-amber-400 transition-colors"
          >
            {{ $t('home.heroCta') }}
          </NuxtLink>
          <NuxtLink
            to="/netflix/zanre/israeli"
            class="inline-block rounded-full border border-charcoal-line px-6 py-2.5 text-sm text-mist-grey hover:border-sunset-gold hover:text-sunset-gold transition-colors"
          >
            🇮🇱 סדרות ישראליות
          </NuxtLink>
        </div>
      </div>

      <!-- Decorative large background text -->
      <span
        aria-hidden="true"
        class="absolute left-4 top-1/2 -translate-y-1/2 font-display font-black text-[clamp(8rem,20vw,16rem)] text-sunset-gold/5 leading-none pointer-events-none select-none"
      >TOP10</span>
    </section>

    <!-- ── Editorial badge + AI summary ─────────────────────────────── -->
    <div v-if="current" class="mx-auto max-w-5xl px-4 pt-8">
      <div class="editorial-banner">
        <span class="editorial-icon">✍️</span>
        <div>
          <p class="editorial-title">נבחר על ידי צוות הבינג'יונרים המוסמכים שלנו</p>
          <p class="editorial-sub">הרשימה מתעדכנת ב-1 לכל חודש · לוחצים על כרטיסייה לפרטים מלאים + טריילר</p>
        </div>
      </div>
      <AiSummaryBlock
        :text="`נטפליקס טופ 10 — ${current.monthLabel} ${current.year}: ${current.aiSummary}`"
        class="mt-4"
      />
    </div>

    <!-- ── Top 10 grid ─────────────────────────────────────────────── -->
    <div v-if="current" class="mx-auto max-w-5xl px-4 py-8">
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SeriesCard
          v-for="item in current.series"
          :key="item.tmdbId + item.name"
          :rank="item.rank"
          :name="item.name"
          :name-he="item.nameHe"
          :overview="item.overview"
          :poster-path="item.posterPath"
          :vote-average="item.voteAverage"
          :genres="item.genres"
          :trailer-youtube-id="item.trailerYoutubeId"
          :editor-review="item.editorReview"
          @open-modal="openModal(item)"
        />
      </div>
    </div>

    <p v-else class="mx-auto max-w-5xl px-4 py-16 text-center text-mist-grey">
      עדיין לא נוצר תוכן חודשי. הרץ <code class="text-sunset-gold">npm run fetch:netflix</code> כדי לייצר את הרשימה הראשונה.
    </p>

    <!-- ── Ad slot ─────────────────────────────────────────────────── -->
    <div class="mx-auto max-w-5xl px-4">
      <AdSlot slot-id="home-mid" />
    </div>

    <!-- ── Genre navigation ────────────────────────────────────────── -->
    <section class="mx-auto max-w-5xl px-4 mt-4 pb-12">
      <h2 class="font-display text-2xl font-bold text-milk-parchment">
        חפש לפי ז'אנר
      </h2>
      <p class="mt-1 text-sm text-mist-grey">סדרות מומלצות לפי הנושא שאתם אוהבים</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <NuxtLink
          v-for="g in genres"
          :key="g.slug"
          :to="`/netflix/zanre/${g.slug}`"
          class="flex items-center gap-2 rounded-lg border border-charcoal-line bg-charcoal-deep px-4 py-2.5 text-sm text-mist-grey hover:border-sunset-gold hover:text-sunset-gold transition-all duration-200"
        >
          <span>{{ g.icon }}</span>
          <span>{{ g.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- ── Archive ─────────────────────────────────────────────────── -->
    <section v-if="archive.length" class="border-t border-charcoal-line mx-auto max-w-5xl px-4 py-10">
      <h2 class="font-display text-2xl font-bold text-milk-parchment">
        {{ $t('home.archiveTitle') }}
      </h2>
      <MonthPicker class="mt-4" :months="archive" />
    </section>
  </div>
</template>

<style scoped>
.editorial-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, rgba(230,60,40,0.06), rgba(255,140,0,0.04));
  border: 1px solid rgba(230,60,40,0.18);
  border-radius: 0.75rem;
}
.editorial-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}
.editorial-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(245,240,232,0.9);
  margin: 0;
}
.editorial-sub {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.4);
  margin: 0.2rem 0 0;
  font-family: monospace;
}
</style>
