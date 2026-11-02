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
  intro: [string, string]
}

const GENRE_META: Record<string, GenreMeta> = {
  drama: {
    label: 'דרמה', labelEn: 'Drama', keywords: 'סדרות דרמה בנטפליקס, דרמה נטפליקס',
    description: 'דרמה בנטפליקס שנשארים איתה בגלל הדמויות, לא בגלל פיתול בכל פרק.',
    intro: [
      'דרמה טובה כאן היא לא סדרה עצובה. היא סדרה שנשארים איתה בגלל הדמויות. אם אתם מחפשים הפתעה בכל פרק, עדיף לעבור למתח.',
      'הרשימה כוללת רק סדרות זמינות עכשיו. לכל כרטיס יש תקציר, טריילר ומשפט של הצוות: למה דווקא היא שווה ערב שלם.',
    ],
  },
  comedy: {
    label: 'קומדיה', labelEn: 'Comedy', keywords: 'סדרות קומדיה בנטפליקס, קומדיה נטפליקס',
    description: 'קומדיות בנטפליקס לערב עייף, בלי כל מה שרק מתויג כמצחיק.',
    intro: [
      'קומדיה בנטפליקס מתפצלת לשניים: פרקים קצרים לערב עייף, וסדרות ארוכות שצוחקות גם כשכואב. לא כל מה שמתויג קומדיה באמת מצחיק.',
      'הרשימה קצרה בכוונה. אם אתם צופים בעברית, שווה גם להציץ בסדרות הישראליות. השאר הוא מה שלא הרגיש מאולץ.',
    ],
  },
  action: {
    label: 'אקשן', labelEn: 'Action', keywords: 'סדרות אקשן בנטפליקס, אקשן נטפליקס',
    description: 'סדרות אקשן בנטפליקס עם דמות שאפשר לעקוב אחריה, לא רק מרדפים.',
    intro: [
      'אקשן שווה צפייה כשיש דמות שאכפת לכם ממנה בין המרדפים. בלי זה נשאר רעש. כאן מעדיפים סדרות שאפשר לעקוב אחריהן יותר מעונה אחת.',
      'לפני שמתחילים, בדקו כמה עונות יש בכרטיס. שש עונות הן התחייבות אחרת מעונה אחת.',
    ],
  },
  thriller: {
    label: 'מתח', labelEn: 'Thriller', keywords: 'סדרות מתח בנטפליקס, thriller נטפליקס',
    description: 'סדרות מתח בנטפליקס שהפיתול שלהן מרגיש הוגן, לא תעלול של הפרק האחרון.',
    intro: [
      'מתח טוב שומר סוד בלי לרמות. אנחנו מחפשים סדרות שהפיתול מובן בדיעבד, לא כאלה שממציאות חוקים חדשים בפרק האחרון.',
      'אם אתם רגישים לאלימות, קראו את התקציר לפני הטריילר. לא כל סדרה כאן מתאימה לצפייה משפחתית.',
    ],
  },
  romance: {
    label: 'רומנטי', labelEn: 'Romance', keywords: 'סדרות רומנטיות בנטפליקס, רומנסה נטפליקס',
    description: 'סדרות רומנטיות בנטפליקס לפי מצב הרוח, לא רק לפי הדירוג.',
    intro: [
      'רומנטיקה כאן היא לא רק נשיקה בפרק האחרון. יש סדרות על זוגיות ארוכה, ויש כאלה על התחלה. בחרו לפי הערב, לא לפי המספר לבדו.',
      'הדירוג של הצופים אומר אם הסדרה אהובה. המשפט של הצוות אומר אם היא שווה לשבת מולה, או רק נעימה ברקע.',
    ],
  },
  documentary: {
    label: 'דוקומנטרי', labelEn: 'Documentary', keywords: 'דוקומנטרי בנטפליקס, סרטי תיעוד נטפליקס',
    description: 'דוקומנטריים בנטפליקס שמשאירים שאלה, לא רק עובדה.',
    intro: [
      'דוקומנטרי טוב משאיר שאלה, לא רק עובדה. בנטפליקס הז׳אנר רחב: פשע, אנשים וטבע באותה מדף, ולכן הרשימה לא מתיימרת להיות מכלול אחד.',
      'לפעמים פרק אחד מספיק. אין חובה לסיים עונה שלמה כדי לקבל ערב טוב.',
    ],
  },
  kids: {
    label: 'ילדים', labelEn: 'Kids', keywords: 'סדרות ילדים בנטפליקס, אנימציה ילדים',
    description: 'סדרות לילדים בנטפליקס שמחזיקות גם את המבוגר שיושב ליד.',
    intro: [
      'סדרה לילדים צריכה להחזיק גם את המבוגר שיושב ליד. מעדיפים הרפתקה ברורה וקצב שאפשר לעצור בין פרקים.',
      'בדקו את גיל הצפייה בנטפליקס לפני שלוחצים play. הרשימה כאן היא המלצה, לא סיווג גיל.',
    ],
  },
  anime: {
    label: 'אנימה', labelEn: 'Anime', keywords: 'אנימה נטפליקס, anime netflix ישראל',
    description: 'אנימה בנטפליקס למתחילים ולמי שכבר בפנים, עם השם העברי והמקורי.',
    intro: [
      'אנימה בנטפליקס היא לא מדף אחד. יש פעולה ארוכה ויש סיפור שקט. אם אתם חדשים בז׳אנר, התחילו במה שהצוות סימן כקל לכניסה, לא במה שהכי ארוך.',
      'השם העברי והשם המקורי מופיעים יחד, כדי למצוא את הטריילר הנכון ולא סדרה אחרת עם שם דומה.',
    ],
  },
  israeli: {
    label: 'סדרות ישראליות', labelEn: 'Israeli', keywords: 'סדרות ישראליות בנטפליקס, פאודה נטפליקס, שטיסל נטפליקס',
    description: 'סדרות ישראליות שבדקנו שהן זמינות בנטפליקס, לא רק שהן ישראליות.',
    intro: [
      'הסדרות הישראליות בנטפליקס הן לא תוספת בשוליים. פאודה ושטיסל כבר הראו שסיפור מכאן רץ בעולם, ועדיין יש סדרות שמדברים עליהן קודם בעברית.',
      'בודקים שהסדרה זמינה בנטפליקס, לא רק שהיא ישראלית. רשימת שמות בלי זמינות לא עוזרת בערב שבת.',
    ],
  },
}

const FALLBACK_META: GenreMeta = {
  label: genre,
  labelEn: genre,
  description: `סדרות ${genre} בנטפליקס.`,
  keywords: `${genre} נטפליקס`,
  intro: [`סדרות ${genre} שזמינות בנטפליקס, עם תקציר וטריילר לכל אחת.`, 'הרשימה מתעדכנת עם המדריך החודשי, ולא כוללת סדרה שאין עליה המלצה.'],
}
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
        <div class="mt-4 max-w-2xl space-y-3 text-base leading-relaxed text-milk-parchment">
          <p v-for="(paragraph, i) in meta.intro" :key="i">{{ paragraph }}</p>
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
        <p class="font-display text-2xl font-bold text-milk-parchment">הרשימה לז׳אנר הזה עדיין לא מוכנה</p>
        <p class="mt-2 text-mist-grey">
          בינתיים אפשר להתחיל ב<NuxtLink to="/providers/netflix" class="link-quiet">טופ 10 של נטפליקס</NuxtLink>.
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
