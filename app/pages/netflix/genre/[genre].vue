<script setup lang="ts">
const route = useRoute()
const genre = route.params.genre as string
const { public: pub } = useRuntimeConfig()
const { selected, open, close } = useSeriesModal()

interface GenreMeta {
  label: string
  labelEn: string
  description: string
  keywords: string
}

const GENRE_META: Record<string, GenreMeta> = {
  drama:       { label: 'דרמה',             labelEn: 'Drama',       description: 'הסדרות הדרמטיות הכי מומלצות בנטפליקס — דמויות עמוקות ועלילות מרגשות.',        keywords: 'סדרות דרמה בנטפליקס, דרמה נטפליקס' },
  comedy:      { label: 'קומדיה',           labelEn: 'Comedy',      description: 'הסדרות הקומדיות הכי מצחיקות בנטפליקס — לצחוק ולהירגע.',                       keywords: 'סדרות קומדיה בנטפליקס, קומדיה נטפליקס' },
  action:      { label: 'אקשן',             labelEn: 'Action',      description: 'הסדרות אקשן הכי מרתקות בנטפליקס — מלאות בפעולה ואדרנלין.',                    keywords: 'סדרות אקשן בנטפליקס, אקשן נטפליקס' },
  thriller:    { label: 'מתח',              labelEn: 'Thriller',    description: 'סדרות מתח בנטפליקס שאסור להחמיץ — פיתולים ורגעי לחץ.',                       keywords: 'סדרות מתח בנטפליקס, thriller נטפליקס' },
  romance:     { label: 'רומנטי',           labelEn: 'Romance',     description: 'הסדרות הרומנטיות הכי יפות בנטפליקס — אהבה ורגשות.',                           keywords: 'סדרות רומנטיות בנטפליקס, רומנסה נטפליקס' },
  documentary: { label: 'דוקומנטרי',        labelEn: 'Documentary', description: 'הדוקומנטריים הכי מרתקים בנטפליקס — טבע, פשע ואנשים.',                        keywords: 'דוקומנטרי בנטפליקס, סרטי תיעוד נטפליקס' },
  kids:        { label: 'ילדים',            labelEn: 'Kids',        description: 'הסדרות הכי טובות לילדים בנטפליקס — אנימציות והרפתקאות.',                       keywords: 'סדרות ילדים בנטפליקס, אנימציה ילדים' },
  anime:       { label: 'אנימה',            labelEn: 'Anime',       description: 'הסדרות אנימה הכי טובות בנטפליקס — מיפן ומהעולם.',                            keywords: 'אנימה נטפליקס, anime netflix ישראל' },
  israeli:     { label: 'סדרות ישראליות',  labelEn: 'Israeli',     description: 'סדרות ישראליות בנטפליקס — פאודה, שטיסל ועוד.',                              keywords: 'סדרות ישראליות בנטפליקס, פאודה נטפליקס, שטיסל נטפליקס' },
}

const FALLBACK_META: GenreMeta = { label: genre, labelEn: genre, description: `סדרות ${genre} בנטפליקס.`, keywords: `${genre} נטפליקס` }
const meta = computed(() => GENRE_META[genre] ?? FALLBACK_META)

// תוכן ייעודי לכל ז'אנר (content/genres/{slug}.json) — לא נגזר
// מהרשימות החודשיות, כי לא לכל ז'אנר יש genre ID תואם ב-TMDB ל-TV
// (אין "Thriller"/"Romance" נפרדים), ולא כל ז'אנר בהכרח מופיע בטופ 10
// של חודש נתון. ראה scripts/fetchGenreShowcases.mjs.
const { data: showcase } = await useAsyncData(`genre-${genre}-showcase`, () =>
  queryCollection('genreShowcases').where('slug', '=', genre).first(),
)

const series = computed(() => showcase.value?.series ?? [])

// לא כל סדרה שמוצגת בעמוד ז'אנר בהכרח הופיעה גם בטופ 10 חודשי
// (fetchGenreShowcases.mjs שולף מבריכת מועמדים רחבה יותר) — אז לפני
// שמקשרים לעמוד הפרטים שלה (/providers/netflix/series/...) צריך
// לאמת שהיא קיימת שם בכלל, אחרת מקבלים 404.
const { data: allMonths } = await useAsyncData('genre-all-months-index', () =>
  queryCollection('netflixMonthly').all(),
)
const validTmdbIds = computed(() => new Set((allMonths.value ?? []).flatMap((m) => m.series.map((s) => s.tmdbId))))

const pageTitle = computed(() =>
  genre === 'israeli'
    ? 'סדרות ישראליות בנטפליקס — המדריך המלא'
    : `סדרות ${meta.value.label} בנטפליקס — המומלצות ביותר`,
)

useHead({
  title: pageTitle.value,
  meta: [
    { name: 'description',   content: meta.value.description },
    { name: 'keywords',      content: meta.value.keywords },
    { property: 'og:title',       content: pageTitle.value },
    { property: 'og:description', content: meta.value.description },
    { property: 'og:type',        content: 'website' },
  ],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/netflix/genre/${genre}` }],
})

// תשובות שמתבססות על הנתונים האמיתיים של העמוד — לא הפניה כללית
// ל"ראו למעלה". אם אין תוכן (showcase לא נוצר), חוזרים לתשובה כללית
// אבל עדיין לא שקרית.
const top = computed(() => series.value[0])
const topLink = computed(() => {
  if (!top.value || !validTmdbIds.value.has(top.value.tmdbId)) return undefined
  return { to: `/providers/netflix/series/${slugify(top.value.name, top.value.tmdbId)}`, label: `לכל הפרטים על "${top.value.nameHe || top.value.name}"` }
})
const faqItems = computed<Array<{ question: string; answer: string; link?: { to: string; label: string } }>>(() => {
  const topLabel = top.value ? (top.value.nameHe || top.value.name) : null
  const count = series.value.length

  if (genre === 'israeli') {
    return [
      {
        question: 'מה הסדרה הישראלית הטובה ביותר בנטפליקס?',
        answer: topLabel
          ? `לפי הדירוגים שלנו כרגע, "${topLabel}" מככבת במקום הראשון — אבל שטיסל ופאודה קרובות מאוד.`
          : 'פאודה ושטיסל הן מבין הסדרות הישראליות המצליחות ביותר בנטפליקס.',
        link: topLink.value,
      },
      {
        question: 'האם פאודה ושטיסל עדיין בנטפליקס?',
        answer: 'שתיהן זמינות בנטפליקס נכון לעדכון האחרון של הרשימה שלנו — אימות אוטומטי מול נתוני נטפליקס האמיתיים, לא רק הנחה.',
      },
      {
        question: `כמה סדרות ישראליות מופיעות ברשימה שלנו?`,
        answer: `${count || 'מספר'} סדרות ישראליות שאימתנו כזמינות בנטפליקס בפועל, לא רק סדרות ישראליות באופן כללי.`,
      },
      {
        question: 'איך בוחרים אילו סדרות ישראליות להציג?',
        answer: 'אנחנו מאמתים זמינות אמיתית בנטפליקס (לא רק שהסדרה ישראלית) ומדרגים לפי פופולריות — כך שלא תמצאו כאן סדרה שירדה מהשירות.',
      },
    ]
  }

  return [
    {
      question: `מה סדרת ה${meta.value.label} הטובה ביותר בנטפליקס כרגע?`,
      answer: topLabel
        ? `לפי הרשימה שלנו, "${topLabel}" היא הסדרה המובילה בז'אנר ${meta.value.label} בנטפליקס כרגע.`
        : `אנחנו מעדכנים את רשימת ${meta.value.label} הטובות ביותר בנטפליקס באופן שוטף.`,
      link: topLink.value,
    },
    {
      question: `כמה סדרות ${meta.value.label} מופיעות ברשימה?`,
      answer: `${count || 'מספר'} סדרות ${meta.value.label} שאימתנו כזמינות בנטפליקס, מדורגות לפי פופולריות ודירוג.`,
    },
    {
      question: "איך מוצאים סדרות לפי ז'אנר בנטפליקס?",
      answer: `בדף הזה תמצאו רשימה מדורגת של סדרות ${meta.value.label} שזמינות בנטפליקס בפועל — לחצו על כרטיסייה לפרטים מלאים וטריילר.`,
      link: { to: '/#genres', label: "לכל הז'אנרים בעמוד הבית" },
    },
  ]
})

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: pageTitle.value,
  description: meta.value.description,
  url: `${pub.siteUrl}/netflix/genre/${genre}`,
  inLanguage: 'he-IL',
}), `genre-${genre}-collection`)

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.value.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
}), `genre-${genre}-faq`)

const OTHER_GENRES = [
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
const otherGenres = computed(() => OTHER_GENRES.filter((g) => g.slug !== genre))

const watermarkUrl = computed(() => {
  const label = meta.value.labelEn.replace(/[<>&"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 140"><text x="0" y="118" font-family="Georgia,serif" font-size="120" font-weight="700" fill="#E8A33D">${label}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})
</script>

<template>
  <div>
    <SeriesModal :series="selected" @close="close" />

    <section
      class="genre-watermark relative overflow-hidden border-b border-charcoal-line bg-charcoal-deep"
      :style="{ '--genre-watermark': watermarkUrl }"
    >
      <div class="mx-auto max-w-5xl px-4 py-12">
        <Breadcrumbs
          :items="[
            { label: 'בית', to: '/' },
            { label: 'נטפליקס', to: '/providers/netflix' },
            { label: meta.label },
          ]"
        />
        <h1 class="mt-4 font-display text-3xl font-black text-milk-parchment md:text-4xl">
          <template v-if="genre === 'israeli'">
            🇮🇱 סדרות ישראליות בנטפליקס — המדריך המלא
          </template>
          <template v-else>
            סדרות {{ meta.label }} בנטפליקס — המומלצות ביותר
          </template>
        </h1>
        <p class="mt-3 max-w-xl text-mist-grey leading-relaxed">{{ meta.description }}</p>
        <div
          v-if="genre === 'israeli'"
          class="mt-4 rounded-lg border border-sunset-gold/20 bg-sunset-gold/5 px-4 py-3 text-sm text-mist-grey"
        >
          <strong class="text-sunset-gold">נישת תוכן ישראלי:</strong>
          פאודה, שטיסל ועוד — התוכן הישראלי שכובש את העולם דרך נטפליקס.
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-5xl px-4 py-8">
      <div v-if="series.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SeriesCard
          v-for="item in series"
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
          @open-modal="open(item)"
        />
      </div>
      <div v-else class="rounded-xl border border-charcoal-line bg-charcoal-deep px-6 py-12 text-center">
        <p class="font-display text-2xl font-bold text-milk-parchment">עדיין לא הגיעו</p>
        <p class="mt-2 text-mist-grey">
          הרץ <code class="text-sunset-gold">npm run fetch:genres</code> כדי לייצר את הרשימה, או בקר
          ב<NuxtLink to="/providers/netflix" class="link-quiet">נטפליקס</NuxtLink> לגלות את כל הסדרות.
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-5xl px-4 pb-12">
      <FAQBlock :items="faqItems" />
    </div>

    <section class="border-t border-charcoal-line mx-auto max-w-5xl px-4 py-10">
      <h2 class="font-display text-xl font-bold text-milk-parchment">ז'אנרים נוספים</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink
          v-for="g in otherGenres"
          :key="g.slug"
          :to="`/netflix/genre/${g.slug}`"
          class="rounded-full border border-charcoal-line px-4 py-1.5 text-sm text-mist-grey hover:border-sunset-gold hover:text-sunset-gold transition-colors"
        >{{ g.label }}</NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.genre-watermark::before {
  content: "";
  position: absolute;
  left: 1rem;
  top: 50%;
  width: min(14rem, 40vw);
  height: 4rem;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.14;
  background: var(--genre-watermark) left center / contain no-repeat;
}
</style>
