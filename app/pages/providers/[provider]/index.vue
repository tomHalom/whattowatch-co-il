<script setup lang="ts">
const route = useRoute()
const providerSlug = route.params.provider as string
const { public: pub } = useRuntimeConfig()
const { selected, open, close } = useSeriesModal()

const { data: provider } = await useAsyncData(`provider-${providerSlug}`, () =>
  queryCollection('providers').where('slug', '=', providerSlug).first(),
)

if (!provider.value) {
  throw createError({ statusCode: 404, statusMessage: 'ספק לא נמצא' })
}

// כרגע רק לנטפליקס יש תוכן חודשי אמיתי — לספקים עתידיים חוזרים ל-fallback הריק.
const { data: allMonths } = await useAsyncData(`provider-${providerSlug}-all-months`, () => {
  if (providerSlug !== 'netflix') return Promise.resolve([])
  return queryCollection('netflixMonthly').order('slug', 'DESC').all()
})

// עמוד הספק מציג תמיד את החודש העדכני ביותר — בלי עמוד /top-10 נפרד.
// אין "חודש הבא" אפשרי (זה כבר החדש ביותר), רק "חודש קודם".
const latestMonth = computed(() => allMonths.value?.[0] ?? null)
const prevMonth = computed(() => allMonths.value?.[1] ?? null)
const nextMonth = computed(() => null)

const GENRE_LINKS = [
  { slug: 'drama', label: 'דרמה', icon: '🎭' },
  { slug: 'thriller', label: 'מתח', icon: '😱' },
  { slug: 'comedy', label: 'קומדיה', icon: '😂' },
  { slug: 'action', label: 'אקשן', icon: '💥' },
  { slug: 'romance', label: 'רומנטי', icon: '❤️' },
  { slug: 'documentary', label: 'דוקומנטרי', icon: '🎞️' },
  { slug: 'kids', label: 'ילדים', icon: '🧒' },
  { slug: 'anime', label: 'אנימה', icon: '⚔️' },
  { slug: 'israeli', label: 'ישראלי', icon: '🇮🇱' },
]

const faqItems = computed(() => {
  if (!latestMonth.value) return []
  const top = latestMonth.value.series[0]
  const topLabel = top ? top.nameHe || top.name : null
  return [
    {
      question: `איך בוחרים אילו סדרות מומלצות ב${provider.value!.name} בכל חודש?`,
      answer: topLabel
        ? `צוות הבינג'יונרים המוסמכים שלנו סוקר, צופה ומדרג כל חודש מחדש לפי פופולריות, ביקורות ומה שבאמת שווה את הזמן שלכם — לחודש ${latestMonth.value.monthLabel} הבחירה המובילה היא "${topLabel}".`
        : 'צוות הבינג\'יונרים המוסמכים שלנו סוקר, צופה ומדרג כל חודש מחדש לפי פופולריות, ביקורות ומה שבאמת שווה את הזמן שלכם.',
      link: top ? { to: `/providers/netflix/series/${slugify(top.name, top.tmdbId)}`, label: `לכל הפרטים על "${topLabel}"` } : undefined,
    },
    {
      question: `כל כמה זמן מתעדכן המדריך ל${provider.value!.name}?`,
      answer: 'בכל תחילת חודש אנחנו מפרסמים טופ 10 חדש, כולל טריילרים, דירוגים וביקורת עורך אישית לכל סדרה — ישר בעמוד הזה.',
    },
    {
      question: `איך מוצאים סדרות ב${provider.value!.name} לפי ז'אנר?`,
      answer: 'בעמוד הזה תמצאו קישורים לכל הז\'אנרים המובילים — דרמה, קומדיה, אקשן, מתח ועוד — כל אחד עם רשימה מדורגת ומאומתת משלו.',
      link: { to: `/providers/${providerSlug}#genres`, label: "לרשימת הז'אנרים בעמוד הזה" },
    },
    {
      question: 'יש גם סדרות ישראליות?',
      answer: 'בהחלט — יש לנו מדריך ייעודי לסדרות ישראליות עם פאודה, שטיסל ועוד, מאומתות כזמינות בפועל.',
      link: { to: '/netflix/genre/israeli', label: 'לכל הסדרות הישראליות בנטפליקס' },
    },
  ]
})

const pageTitle = computed(() =>
  latestMonth.value
    ? `10 הסדרות הכי מומלצות ב${provider.value!.name} — ${latestMonth.value.monthLabel} ${latestMonth.value.year}`
    : provider.value!.seoTitle,
)

useHead({
  title: pageTitle.value,
  meta: [{ name: 'description', content: provider.value.seoDescription }],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/providers/${providerSlug}` }],
})

if (latestMonth.value) {
  useJsonLd(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: pageTitle.value,
      itemListElement: latestMonth.value!.series.map((s) => ({
        '@type': 'ListItem',
        position: s.rank,
        name: s.name,
        url: `${pub.siteUrl}/providers/${providerSlug}/series/${slugify(s.name, s.tmdbId)}`,
      })),
    }),
    'provider-itemlist',
  )
  useJsonLd(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.value.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    }),
    'provider-faq',
  )
}
</script>

<template>
  <div v-if="provider" class="mx-auto max-w-5xl px-4 py-10">
    <SeriesModal :series="selected" @close="close" />

    <Breadcrumbs :items="[{ label: 'בית', to: '/' }, { label: provider.name }]" />

    <template v-if="latestMonth">
      <MonthHeading class="mt-4" :kicker="`10 הסדרות הכי מומלצות ב${provider.name}`" :month-label="latestMonth.monthLabel" :year="latestMonth.year" />

      <MonthNav class="mt-5" :prev-month="prevMonth" :next-month="nextMonth" />

      <p v-if="latestMonth.isFallback" class="mt-4 rounded bg-charcoal-line px-3 py-2 text-xs text-mist-grey">
        זהו תוכן דמו (fallback) — הרץ <code>npm run fetch:netflix</code> עם TMDB_READ_ACCESS_TOKEN מוגדר לנתונים אמיתיים.
      </p>

      <ContentRenderer :value="latestMonth" class="prose prose-invert mt-6 max-w-none" />

      <div v-if="latestMonth.editorsNote" class="editor-note mt-6">
        <span class="editor-note-icon">🌙</span>
        <p><strong>{{ latestMonth.editorsNote.label }}</strong> {{ latestMonth.editorsNote.body }}</p>
      </div>

      <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SeriesCard
          v-for="item in latestMonth.series"
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
          :is-new="!latestMonth.isFallback && isNewThisMonth(item.firstAirDate, latestMonth.slug)"
          @open-modal="open(item)"
        />
      </div>

      <AdSlot slot-id="provider-mid" />

      <!-- ── חיפוש לפי ז'אנר ─────────────────────────────────────────── -->
      <section id="genres" class="mt-10">
        <h2 class="font-display text-xl font-bold text-milk-parchment">חפש לפי ז'אנר</h2>
        <div class="mt-4 flex flex-wrap gap-3">
          <NuxtLink
            v-for="g in GENRE_LINKS"
            :key="g.slug"
            :to="`/netflix/genre/${g.slug}`"
            class="flex items-center gap-2 rounded-lg border border-charcoal-line bg-charcoal-deep px-4 py-2.5 text-sm text-mist-grey hover:border-sunset-gold hover:text-sunset-gold transition-all duration-200"
          >
            <span>{{ g.icon }}</span>
            <span>{{ g.label }}</span>
          </NuxtLink>
        </div>
      </section>

      <FAQBlock class="mt-10" :items="faqItems" />

      <!-- ── חודשים נוספים ────────────────────────────────────────────── -->
      <section v-if="allMonths?.length" class="mt-10">
        <h2 class="font-display text-xl font-bold text-milk-parchment">חודשים נוספים</h2>
        <MonthPicker class="mt-4" :months="allMonths" :current-slug="latestMonth.slug" />
      </section>
    </template>
    <template v-else>
      <div class="mt-8 max-w-xl">
        <p class="coming-soon-stamp">בקרוב</p>
        <h1 class="mt-4 font-display text-3xl font-bold text-milk-parchment">{{ provider.name }}</h1>
        <p class="mt-3 text-base leading-relaxed text-milk-parchment">
          אנחנו עדיין צופים ובוחרים. בקרוב יופיע כאן המדריך החודשי: עשר הסדרות ששוות את הערב ב{{ provider.name }}, עם טריילר וביקורת קצרה לכל אחת.
        </p>
        <p class="mt-4 text-sm leading-relaxed text-mist-grey">
          עד שהמדריך יעלה, אפשר להתחיל ב<NuxtLink to="/providers/netflix" class="link-quiet">טופ 10 של נטפליקס</NuxtLink>.
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
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
}
.coming-soon-stamp {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  background: var(--clr-gold);
  color: var(--clr-bg);
  font-weight: 700;
  font-size: 0.85rem;
  line-height: 1.2;
  border-radius: 2px;
  border-inline-start: 1.5px dashed rgba(20, 19, 28, 0.45);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
  transform: rotate(-2deg);
  transform-origin: center;
}
</style>
