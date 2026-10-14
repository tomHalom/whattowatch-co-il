<script setup lang="ts">
const { public: pub } = useRuntimeConfig()

const { data: months } = await useAsyncData('home-months', () =>
  queryCollection('netflixMonthly').order('slug', 'DESC').all(),
)

const current = computed(() => months.value?.[0])
const archive = computed(() => months.value?.slice(1) ?? [])

// דף הבית מציג תמיד את החודש העדכני ביותר — אין "חודש הבא" אפשרי,
// רק "חודש קודם" שמצביע לחודש הראשון בארכיון (אם קיים).
const prevMonth = computed(() => archive.value[0] ?? null)
const nextMonth = computed(() => null)

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
    { property: 'og:url', content: pub.siteUrl },
  ],
  link: [{ rel: 'canonical', href: pub.siteUrl }],
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
        <div class="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="font-utility text-xs text-sunset-gold">
            {{ $t('home.heroPrefix') }} — {{ current.monthLabel }} {{ current.year }}
          </span>
          <span class="text-xs text-mist-grey/50">|</span>
          <span class="min-w-0 text-xs text-mist-grey/60">נבחר בקפידה על ידי צוות הבינג'יונרים שלנו</span>
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
            to="/#genres"
            class="inline-block rounded-full border border-charcoal-line px-6 py-2.5 text-sm text-mist-grey hover:border-sunset-gold hover:text-sunset-gold transition-colors"
          >
            🎭 חיפוש לפי ז'אנר
          </NuxtLink>
          <NuxtLink
            to="/netflix/genre/israeli"
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

    <!-- ── Month navigation ─────────────────────────────────────────── -->
    <div v-if="current" class="mx-auto max-w-5xl px-4 pt-6">
      <MonthNav :prev-month="prevMonth" :next-month="nextMonth" />
    </div>

    <!-- ── Editorial badge + editor's note ────────────────────────────── -->
    <div v-if="current" class="mx-auto max-w-5xl px-4 pt-8">
      <div class="editorial-banner">
        <span class="editorial-icon">✍️</span>
        <div class="min-w-0">
          <p class="editorial-title">נבחר על ידי צוות הבינג'יונרים המוסמכים שלנו</p>
          <p class="editorial-sub">הרשימה מתעדכנת ב-1 לכל חודש · לוחצים על כרטיסייה לפרטים מלאים + טריילר</p>
        </div>
      </div>
      <div v-if="current.editorsNote" class="editor-note mt-4">
        <span class="editor-note-icon">🌙</span>
        <p><strong>{{ current.editorsNote.label }}</strong> {{ current.editorsNote.body }}</p>
      </div>
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
          :is-new="!current.isFallback && isNewThisMonth(item.firstAirDate, current.slug)"
          @open-modal="openModal(item)"
        />
      </div>
    </div>

    <p v-else class="mx-auto max-w-5xl px-4 py-16 text-center text-mist-grey">
      עדיין לא נוצר תוכן חודשי. הרץ <code class="text-sunset-gold">npm run fetch:netflix</code> כדי לייצר את הרשימה הראשונה.
    </p>

    <!-- ── Archive CTA — this is the whole point of the site: a fresh
         top-10 every month, not just this one. ─────────────────────── -->
    <section v-if="archive.length" class="mx-auto max-w-5xl px-4">
      <NuxtLink to="/netflix" class="archive-cta group">
        <div class="archive-cta-text">
          <span class="archive-cta-kicker">📅 לא רק החודש הזה</span>
          <h2 class="archive-cta-title">לכל חודש יש טופ 10 משלו — גלו את הארכיון המלא</h2>
          <p class="archive-cta-sub">
            {{ archive.length + 1 }} מדריכים חודשיים ועוד נוספים כל חודש, כל אחד עם 10 סדרות נבחרות
          </p>
        </div>
        <div class="archive-cta-months">
          <span v-for="m in archive.slice(0, 4)" :key="m.slug" class="archive-cta-chip">
            {{ m.monthLabel }}
          </span>
        </div>
        <span class="archive-cta-arrow">→</span>
      </NuxtLink>
    </section>

    <!-- ── Ad slot ─────────────────────────────────────────────────── -->
    <div class="mx-auto max-w-5xl px-4">
      <AdSlot slot-id="home-mid" />
    </div>

    <!-- ── Genre navigation ────────────────────────────────────────── -->
    <section id="genres" class="mx-auto max-w-5xl px-4 mt-4 pb-12">
      <h2 class="font-display text-2xl font-bold text-milk-parchment">
        חפש לפי ז'אנר
      </h2>
      <p class="mt-1 text-sm text-mist-grey">סדרות מומלצות לפי הנושא שאתם אוהבים</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <NuxtLink
          v-for="g in genres"
          :key="g.slug"
          :to="`/netflix/genre/${g.slug}`"
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
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(255,255,255,0.65);
  margin: 0.25rem 0 0;
}

.editor-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(232, 163, 61, 0.08), rgba(214, 69, 69, 0.05));
  border: 1px solid rgba(232, 163, 61, 0.25);
  border-radius: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(245, 240, 232, 0.9);
}
.editor-note-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}
.editor-note p {
  margin: 0;
  min-width: 0;
}

/* ─── Archive CTA banner ───────────────────────────────────────── */
.archive-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 1.75rem;
  margin: 1rem 0;
  background: linear-gradient(135deg, rgba(232, 163, 61, 0.1), rgba(28, 27, 39, 0.4));
  border: 1px solid rgba(232, 163, 61, 0.3);
  border-radius: 1rem;
  transition: border-color 0.2s, transform 0.2s;
}
.archive-cta:hover {
  border-color: rgba(232, 163, 61, 0.6);
  transform: translateY(-2px);
}
.archive-cta-text { flex: 1 1 260px; }
.archive-cta-kicker {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #E8A33D;
  text-transform: uppercase;
}
.archive-cta-title {
  margin: 0.35rem 0 0;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.35;
  color: #F2EEE4;
}
.archive-cta-sub {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.55);
}
.archive-cta-months {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.archive-cta-chip {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgba(232, 163, 61, 0.12);
  border: 1px solid rgba(232, 163, 61, 0.25);
  color: #E8A33D;
  font-size: 0.75rem;
  font-weight: 600;
}
.archive-cta-arrow {
  font-size: 1.5rem;
  color: #E8A33D;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.group:hover .archive-cta-arrow {
  transform: translateX(-4px);
}
</style>
