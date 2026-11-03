<script setup lang="ts">
const props = defineProps<{ slug: 'new' | 'new-seasons' }>()

const { public: pub } = useRuntimeConfig()
const { selected, open, close } = useSeriesModal()

const COPY = {
  new: {
    label: 'חדש על המדף',
    watermark: 'New',
    title: 'חדש על המדף — הסדרות החדשות בנטפליקס',
    description: 'הסדרות החדשות שעלו לנטפליקס החודש, עם תקציר וטריילר. מתעדכן בתחילת כל חודש.',
    stamp: 'חדש על המדף',
    other: { to: '/netflix/new-seasons', label: 'עונות חדשות' },
  },
  'new-seasons': {
    label: 'עונות חדשות',
    watermark: 'Seasons',
    title: 'עונות חדשות בנטפליקס',
    description: 'סדרות שעונה חדשה שלהן עלתה בנטפליקס החודש. מתעדכן בתחילת כל חודש.',
    stamp: 'עונה חדשה',
    other: { to: '/netflix/new', label: 'חדש על המדף' },
  },
} as const

const copy = computed(() => COPY[props.slug])

const { data: shelf } = await useAsyncData(`shelf-${props.slug}`, () =>
  queryCollection('shelves').where('slug', '=', props.slug).first(),
)

const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function hebrewDate(iso?: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const month = HEBREW_MONTHS[Number(m) - 1]
  return month ? `${Number(d)} ב${month} ${y}` : iso
}

const series = computed(() => shelf.value?.series ?? [])
const when = computed(() => (shelf.value ? `${shelf.value.monthLabel} ${shelf.value.year}` : ''))
const span = computed(() => {
  const from = hebrewDate(shelf.value?.windowFrom)
  const to = hebrewDate(shelf.value?.windowTo)
  return from && to ? `${from} עד ${to}` : when.value
})

const intro = computed(() => {
  if (props.slug === 'new') {
    return [
      `סדרות שהפרק הראשון שלהן עלה בין ${span.value || 'תחילת החודש להיום'}. לא עונה נוספת של סדרה שכבר ראיתם, אלא כותר שמתחיל עכשיו.`,
      'הרשימה מתעדכנת בתחילת כל חודש, יחד עם המדריך. לכל כרטיס יש תקציר, טריילר ומשפט של הצוות.',
    ]
  }
  return [
    `סדרות שכבר הכרתם, ועונה חדשה שלהן עלתה בין ${span.value || 'תחילת החודש להיום'}. מספר העונה כתוב על הכרטיס.`,
    'סדרה שממשיכה לשדר פרק כל שבוע, בלי שעונה חדשה עלתה, לא נכנסת. הרשימה מתעדכנת בתחילת כל חודש.',
  ]
})

const top = computed(() => series.value[0])
const topLabel = computed(() => top.value?.nameHe || top.value?.name)

const faqItems = computed(() => {
  const count = series.value.length
  if (props.slug === 'new') {
    return [
      {
        question: 'מה נחשב חדש על המדף?',
        answer: `סדרה שהפרק הראשון שלה עלה בין ${span.value || 'תחילת החודש להיום'}. עונה חדשה של סדרה ישנה יושבת בעמוד נפרד.`,
        link: { to: '/netflix/new-seasons', label: 'לעונות החדשות' },
      },
      {
        question: 'כל כמה זמן הרשימה מתעדכנת?',
        answer: 'בתחילת כל חודש, יחד עם עשר הסדרות המומלצות.',
        link: { to: '/providers/netflix', label: 'למדריך החודשי' },
      },
      {
        question: 'כמה סדרות ברשימה?',
        answer: count
          ? `${count} סדרות חדשות בנטפליקס${topLabel.value ? `. בראש הרשימה: "${topLabel.value}".` : '.'}`
          : 'הרשימה של החודש עדיין נאספת.',
      },
    ]
  }
  return [
    {
      question: 'מה נחשב עונה חדשה?',
      answer: `עונה שעלתה בין ${span.value || 'תחילת החודש להיום'}, לסדרה שכבר שודרה קודם. פרק שבועי של עונה שכבר רצה לא נכנס.`,
    },
    {
      question: 'איך יודעים איזו עונה?',
      answer: 'על הכרטיס כתוב מספר העונה שעלתה, ליד הפוסטר.',
    },
    {
      question: 'כל כמה זמן הרשימה מתעדכנת?',
      answer: 'בתחילת כל חודש, יחד עם עשר הסדרות המומלצות.',
      link: { to: '/providers/netflix', label: 'למדריך החודשי' },
    },
  ]
})

useHead({
  title: copy.value.title,
  meta: [
    { name: 'description', content: copy.value.description },
    { property: 'og:title', content: copy.value.title },
    { property: 'og:description', content: copy.value.description },
  ],
  link: [{ rel: 'canonical', href: `${pub.siteUrl}/netflix/${props.slug}` }],
})

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: copy.value.title,
  description: copy.value.description,
  url: `${pub.siteUrl}/netflix/${props.slug}`,
  inLanguage: 'he-IL',
}), `shelf-${props.slug}-collection`)

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.value.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
}), `shelf-${props.slug}-faq`)

const watermarkUrl = computed(() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 140"><text x="0" y="118" font-family="Georgia,serif" font-size="120" font-weight="700" fill="#E8A33D">${copy.value.watermark}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})
</script>

<template>
  <div>
    <SeriesModal :series="selected" @close="close" />

    <section
      class="shelf-watermark relative overflow-hidden border-b border-charcoal-line bg-charcoal-deep"
      :style="{ '--shelf-watermark': watermarkUrl }"
    >
      <div class="mx-auto max-w-5xl px-4 py-12">
        <Breadcrumbs
          :items="[
            { label: 'בית', to: '/' },
            { label: 'נטפליקס', to: '/providers/netflix' },
            { label: copy.label },
          ]"
        />
        <p class="shelf-stamp mt-4">{{ copy.stamp }}</p>
        <h1 class="mt-4 font-display text-3xl font-black text-milk-parchment md:text-4xl">
          {{ copy.title }}
        </h1>
        <p v-if="when" class="mt-2 text-sm text-sunset-gold">{{ when }}</p>
        <div class="mt-4 max-w-2xl space-y-3 text-base leading-relaxed text-milk-parchment">
          <p v-for="(paragraph, i) in intro" :key="i">{{ paragraph }}</p>
        </div>
        <NuxtLink :to="copy.other.to" class="mt-4 inline-block text-sm text-sunset-gold hover:underline">
          {{ copy.other.label }}
        </NuxtLink>
      </div>
    </section>

    <div class="mx-auto max-w-5xl px-4 py-8">
      <div v-if="series.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SeriesCard
          v-for="item in series"
          :key="item.tmdbId"
          :rank="item.rank"
          :name="item.name"
          :name-he="item.nameHe"
          :overview="item.overview"
          :poster-path="item.posterPath"
          :vote-average="item.voteAverage"
          :genres="item.genres"
          :trailer-youtube-id="item.trailerYoutubeId"
          :editor-review="item.editorReview"
          :badge="slug === 'new' ? 'חדש' : (item.newSeasonNumber ? `עונה ${item.newSeasonNumber}` : undefined)"
          @open-modal="open(item)"
        />
      </div>
      <div v-else class="rounded-xl border border-charcoal-line bg-charcoal-deep px-6 py-12 text-center">
        <p class="font-display text-2xl font-bold text-milk-parchment">הרשימה של החודש עדיין נאספת</p>
        <p class="mt-2 text-mist-grey">
          בינתיים אפשר להתחיל ב<NuxtLink to="/providers/netflix" class="link-quiet">טופ 10 של נטפליקס</NuxtLink>.
        </p>
      </div>
    </div>

    <div class="mx-auto max-w-5xl px-4 pb-12">
      <FAQBlock :items="faqItems" />
    </div>
  </div>
</template>

<style scoped>
.shelf-watermark::before {
  content: '';
  position: absolute;
  inset-inline-end: -1rem;
  top: 1.5rem;
  width: min(46vw, 28rem);
  height: 7rem;
  background-image: var(--shelf-watermark);
  background-repeat: no-repeat;
  background-size: contain;
  background-position: left center;
  opacity: 0.14;
  pointer-events: none;
}
.shelf-stamp {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  background: #e8a33d;
  color: #14131c;
  font-weight: 800;
  font-size: 0.85rem;
  border-radius: 2px;
  border-inline-start: 1.5px dashed rgba(20, 19, 28, 0.45);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  transform: rotate(-2deg);
}
</style>
