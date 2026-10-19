# WhatToWatch.co.il

פלטפורמת המלצות סטרימינג עברית-ראשונה (RTL), בדגש על נטפליקס, עם
ארכיטקטורה תומכת-ספקים (provider-agnostic), מדריך "טופ 10" חודשי
אוטומטי, SEO/AEO מובנה, ומונטיזציה (AdSense + Affiliate) מוכנה.

## Stack

Nuxt 4 · Vue 3 · TypeScript · Tailwind CSS · @nuxt/content (Collections)
· @nuxt/image · @nuxtjs/i18n · Pinia · VueUse · TMDB API · GitHub Actions
· Vercel.

## התחלה מהירה (Local Dev)

```bash
npm install
npm run fetch:netflix     # יוצר את החודש הנוכחי — עובד גם בלי טוקן (תוכן דמו)
npm run backfill:months   # אופציונלי: יוצר ארכיון של 12 חודשים אחורה
npm run generate:sitemap && npm run generate:rss && npm run generate:llms
npm run dev                # http://localhost:3000
```

בלי `TMDB_READ_ACCESS_TOKEN`, `fetch:netflix`/`backfill:months` ייצרו
תוכן דמו ריאליסטי (10 כותרים ידועים, בלי טריילר/פוסטר אמיתיים) כך
שהאתר עולה ועובד מיידית. עם הטוקן מוגדר — תוכן אמיתי מ-TMDB, כולל
פוסטרים, טריילרים, מספר עונות וביקורת עורך לכל סדרה.

## ✅ Checklist — מה נדרש ממך לפני עלייה לפרודקשן

הפרויקט **רץ ועובד מקומית עכשיו** בלי אף אחד מהפריטים הבאים. הם
נדרשים רק לתוכן אמיתי / דיפלוי בפועל / הכנסה ממונטיזציה:

- [ ] **TMDB_READ_ACCESS_TOKEN** — Read Access Token (JWT) מ-https://www.themoviedb.org/settings/api
      (לשונית "API Read Access Token" — הטוקן הארוך שמתחיל ב-`eyJ`).
      להוסיף ל-`.env` מקומית + ל-GitHub Secrets (שם: `TMDB_READ_ACCESS_TOKEN`) לאוטומציה.
- [ ] **GEMINI_API_KEY** (אופציונלי, **חינמי לגמרי**) — מפתח חינמי
      מ-https://aistudio.google.com/app/apikey, בלי כרטיס אשראי.
      בלעדיו, "ביקורת הבינג'יונרים" חוזרת לתבניות כלליות. איתו, כל
      סדרה מקבלת ביקורת אמיתית: שליפת ביקורת משתמשים/מבקרים אמיתית
      מ-TMDB וסיכומה בעברית בקול האתר (ראה `buildEditorReview` +
      `summarizeReviewWithGemini` ב-`scripts/fetchTopSeries.mjs`).
      להוסיף ל-`.env` מקומית + ל-GitHub Secrets לאוטומציה.
- [ ] **רכישת הדומיין** `whattowatch.co.il` בפועל אצל רשם מוסמך (ISOC.org.il).
- [ ] **חיבור הדומיין ב-Vercel** (Project Settings → Domains) + הגדרת
      `NUXT_PUBLIC_SITE_URL=https://whattowatch.co.il`.
- [ ] **חשבון Vercel** מקושר ל-GitHub repo (הדרך הפשוטה ביותר לדיפלוי
      אוטומטי — ראה "דיפלוי" למטה).
- [ ] **Google AdSense** — `NUXT_PUBLIC_ADSENSE_ENABLED=true` ו-
      `NUXT_PUBLIC_ADSENSE_PUBLISHER_ID` טוענים את סקריפט `ca-pub-` (בדיקת האתר
      של Google) וכותבים `ads.txt` ב-`npm run generate`. זה לא מצייר מודעה.
      מודעה על המסך דורשת יחידה ידנית. ברירת המחדל בקוד:
      `8873679273` בדף הבית (מתחת לבאנר הארכיון),
      `5293526919` בעמוד ספק (מתחת לטופ 10),
      `1625744648` בעמוד חודש (מתחת לטופ 10).
      `NUXT_PUBLIC_ADSENSE_SLOT_HOME` / `_PROVIDER` / `_MONTHLY` דורסים אותן.
      Auto ads נשארים כבויים בחשבון AdSense —
      התצוגה המקדימה של Google מציגה רק אותם, לא את היחידות האלה.
- [ ] **חשבונות Affiliate** (NordVPN, Amazon) — להוסיף מזהים ל-
      `NUXT_PUBLIC_AFFILIATE_NORDVPN_ID` / `NUXT_PUBLIC_AFFILIATE_AMAZON_TAG`.
      בלי מזהה מוגדר, `AffiliateLink.vue` פשוט לא מרנדר את הכפתור.
- [ ] **עוסק מורשה / פרטי חברה** בעמודי [privacy](app/pages/privacy.vue)
      ו-[terms](app/pages/terms.vue) (מסומן ב-TODO).

## Affiliate — מה קיים, מה לא, ואיך משלימים את זה

**הקישור "צפה בנטפליקס" במודל (`SeriesModal.vue`) הוא קישור עומק רגיל,
לא affiliate.** אין בו מזהה שותפים, ואין ממנו הכנסה. `rel="sponsored"`
הוסר ממנו בכוונה — לתייג קישור לא-ממומן כ"ממומן" הוא הטעיה (גם כלפי
משתמשים וגם כלפי Google).

**למה אין affiliate לנטפליקס עצמה**: בשונה מ-NordVPN/Amazon, לנטפליקס
אין תוכנית affiliate פתוחה עם הרשמה עצמאית. יש ל-Netflix "Netflix
Partner Program" שרץ בפועל דרך רשתות שותפים מוכרות (למשל Impact או
Partnerize/Rakuten) ודורש **אישור ידני מראש**, בדרך כלל רק לאתרים עם
תנועה קיימת. כדי לקבל affiliate אמיתי לנטפליקס:
1. להגיע לתנועה/היסטוריה בסיסית באתר (Netflix לא מאשרת אתרים חדשים ריקים).
2. להגיש בקשה דרך הרשת השותפים הרלוונטית (חיפוש "Netflix affiliate program" מראה איזו רשת פעילה כרגע — זה משתנה).
3. לאחר אישור, מחליפים את ה-`href` ב-`SeriesModal.vue` בקישור עם מזהה השותפים שהתקבל, ומחזירים `rel="sponsored"`.

**התשתית ל-affiliate שכן קיימת ועובדת היום**: קומפוננטת
[`AffiliateLink.vue`](app/components/AffiliateLink.vue) — תומכת כרגע
ב-NordVPN ו-Amazon, מוגדרת דרך `NUXT_PUBLIC_AFFILIATE_NORDVPN_ID` /
`NUXT_PUBLIC_AFFILIATE_AMAZON_TAG` ב-`.env` (ראה `.env.example`). היא
כבר מוטמעת בעמוד סדרה בודדת ([`series/[slug].vue`](app/pages/providers/[provider]/series/[slug].vue)).
בלי מזהה מוגדר — הכפתור פשוט לא מרנדר (לא שובר UI). כדי להוסיף ספק
affiliate נוסף: להרחיב את ה-`provider` prop והלוגיקה ב-`AffiliateLink.vue`
עצמו, ולהוסיף משתנה env תואם — קישורים לעולם לא hardcoded בתבניות.

## מבנה תוכן — הוספת ספק סטרימינג חדש

הארכיטקטורה provider-agnostic: הוספת ספק = קובץ JSON חדש, בלי שינוי
קוד.

1. צור `content/providers/{slug}.json` (ראה `netflix.json` / `disney-plus.json` כדוגמה).
2. (אופציונלי, להפעלת מדריך חודשי) הוסף סקריפט שליפה בסגנון
   `scripts/fetchTopSeries.mjs`, שכותב ל-`content/{slug}/{YYYY-MM}.he.md`
   ומעדכן את `content.config.ts` עם קולקציה תואמת (schema זהה ל-`netflixMonthly`).
3. עמודי `/providers/{slug}`, `/providers/{slug}/top-10` ו-
   `/providers/{slug}/series/{slug}` עובדים אוטומטית לכל ספק קיים.

## אוטומציה חודשית

`.github/workflows/monthly-update.yml` רץ ב-1 לכל חודש (03:00 UTC),
או ידנית מ-GitHub Actions UI (`workflow_dispatch`):

1. שליפת TMDB → `content/netflix/{YYYY-MM}.he.md` + `public/data/netflix/{YYYY-MM}.json`
   (כולל ביקורת עורך אמיתית לכל סדרה אם `GEMINI_API_KEY` מוגדר —
   ראה "ביקורת הבינג'יונרים" למטה)
2. בניית `public/sitemap.xml`, `public/feed.xml`, `public/llms.txt`
3. קומיט + push לריפו
4. `npm run generate` (SSG)
5. דיפלוי ל-Vercel — **מכובה כברירת מחדל** (ראה "דיפלוי" למטה)

Secrets נדרשים ב-GitHub (Settings → Secrets and variables → Actions):
`TMDB_READ_ACCESS_TOKEN`, אופציונלית `GEMINI_API_KEY` (ראה למטה, חינמי),
ובמידה ומפעילים את שלב הדיפלוי הידני גם `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Variable `DEPLOY_ON_UPDATE=true`
מפעיל את שלב ה-deploy המפורש בוורקפלואו.

## ביקורת הבינג'יונרים — איך זה עובד בפועל

לכל סדרה ברשימה החודשית יש שדה `editorReview` — משפט-שניים בעברית
בקול האתר. יש לזה שני מקורות אפשריים:

1. **ביקורת אמיתית (כש-`GEMINI_API_KEY` מוגדר)**: הסקריפט שולף
   ביקורת משתמשים/מבקרים אמיתית מ-TMDB (`GET /tv/{id}/reviews`),
   ומעביר אותה ל-Gemini (`gemini-flash-lite-latest` כברירת מחדל —
   alias שמתעדכן אוטומטית ולא מתיישן, **tier חינמי לגמרי**, בלי כרטיס
   אשראי; ניתן לקבע גרסה מפורשת עם `GEMINI_MODEL`)
   עם הנחיה לסכם את התחושה האמיתית של הביקורת למשפט-שניים בעברית,
   בגוף ראשון-רבים, בלי לצטט מילה-במילה ובלי לחשוף שזו ביקורת
   שנשלפה מהאינטרנט. **התוכן מבוסס בפועל על קבלה קריטית אמיתית**, לא
   מפוברק — אבל מנוסח מחדש בקול האתר, לא מצוטט כפי שהוא.
2. **תבנית כללית (fallback)**: כשאין `GEMINI_API_KEY`, כשאין
   ביקורות אמיתיות לכותר הזה ב-TMDB (נפוץ לתוכן לא-אנגלי/פחות מוכר),
   או שקריאת ה-API נכשלת — נופל בשקט ל-`buildTemplateEditorReview`
   (מאגר משפטים לפי ז'אנר). זה קורה אוטומטית, בלי לשבור את הבנייה
   החודשית.

עלות: קריאה אחת ל-TMDB reviews + קריאה אחת ל-Gemini, לכל סדרה שבאמת
יש לה ביקורת (מקסימום 10 בחודש) — **0 ₪** ב-tier החינמי.

## דיפלוי ל-Vercel

**מומלץ (הדרך הפשוטה)**: חבר את ה-repo ל-Vercel דרך ה-GitHub
Integration (vercel.com/new → Import Git Repository). מרגע זה, כל
push ל-main יוצר production deployment, וכל PR מקבל preview deployment
— אין צורך בשלב ה-deploy הידני שבוורקפלואו (השאר `DEPLOY_ON_UPDATE`
לא-מוגדר).

**חלופה (CLI-first, ל-CI שמריץ deploy בעצמו)**:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

**Environment Variables ב-Vercel** (Project Settings → Environment
Variables) — להעביר את כל המשתנים מ-`.env.example`.

**Rollback**: Vercel Dashboard → Deployments → בחר דיפלוי קודם תקין →
"Promote to Production". אין צורך ב-git revert.

**מוניטורינג**: Vercel Analytics + Speed Insights מופעלים
מ-Project Settings → Analytics (חינמי לפרויקטים קטנים). מומלץ להוסיף
`@vercel/analytics` + `@vercel/speed-insights` כתלות ולרשום כ-plugin
ב-`app/plugins/` כשהחשבון מוכן.

## בדיקות

```bash
npm run test:unit   # Vitest — בודק שסקריפט השליפה מייצר Markdown/JSON תקינים
npm run typecheck
```

## פקודות עיקריות

| פקודה | מה עושה |
|---|---|
| `npm run dev` | שרת פיתוח |
| `npm run generate` | robots/ads.txt + sitemap/rss/llms, ואז בניית SSG (`.output/public`) |
| `npm run fetch:netflix` | שליפת/רענון התוכן החודשי |
| `npm run monthly:update` | fetch + sitemap + rss + llms.txt (מה שהוורקפלואו מריץ) |
