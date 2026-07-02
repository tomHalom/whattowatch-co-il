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
npm run fetch:netflix   # יוצר תוכן חודשי — עובד גם בלי TMDB_API_KEY (תוכן דמו)
npm run generate:sitemap && npm run generate:rss && npm run generate:llms
npm run dev              # http://localhost:3000
```

בלי `TMDB_API_KEY`, `fetch:netflix` ייצר תוכן דמו ריאליסטי (10 כותרים
ידועים, בלי טריילר/דירוג אמיתי) כך שהאתר עולה ועובד מיידית.

## ✅ Checklist — מה נדרש ממך לפני עלייה לפרודקשן

הפרויקט **רץ ועובד מקומית עכשיו** בלי אף אחד מהפריטים הבאים. הם
נדרשים רק לתוכן אמיתי / דיפלוי בפועל / הכנסה ממונטיזציה:

- [ ] **TMDB_API_KEY** — מפתח חינמי ב-https://www.themoviedb.org/settings/api,
      להוסיף ל-`.env` (מקומי) ול-GitHub Secrets (לאוטומציה החודשית).
- [ ] **רכישת הדומיין** `whattowatch.co.il` בפועל אצל רשם מוסמך (ISOC.org.il).
- [ ] **חיבור הדומיין ב-Vercel** (Project Settings → Domains) + הגדרת
      `NUXT_PUBLIC_SITE_URL=https://whattowatch.co.il`.
- [ ] **חשבון Vercel** מקושר ל-GitHub repo (הדרך הפשוטה ביותר לדיפלוי
      אוטומטי — ראה "דיפלוי" למטה).
- [ ] **Google AdSense** — הגשת בקשה לאישור האתר, ואז הגדרת
      `NUXT_PUBLIC_ADSENSE_ENABLED=true` ו-`NUXT_PUBLIC_ADSENSE_PUBLISHER_ID`.
      עד לאישור, `AdSlot.vue` מרנדר placeholder שקט (CLS-safe).
- [ ] **חשבונות Affiliate** (NordVPN, Amazon) — להוסיף מזהים ל-
      `NUXT_PUBLIC_AFFILIATE_NORDVPN_ID` / `NUXT_PUBLIC_AFFILIATE_AMAZON_TAG`.
      בלי מזהה מוגדר, `AffiliateLink.vue` פשוט לא מרנדר את הכפתור.
- [ ] **עוסק מורשה / פרטי חברה** בעמודי [privacy](app/pages/privacy.vue)
      ו-[terms](app/pages/terms.vue) (מסומן ב-TODO).

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
2. בניית `public/sitemap.xml`, `public/feed.xml`, `public/llms.txt`
3. קומיט + push לריפו
4. `npm run generate` (SSG)
5. דיפלוי ל-Vercel — **מכובה כברירת מחדל** (ראה "דיפלוי" למטה)

Secrets נדרשים ב-GitHub (Settings → Secrets and variables → Actions):
`TMDB_API_KEY`, ובמידה ומפעילים את שלב הדיפלוי הידני גם
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Variable
`DEPLOY_ON_UPDATE=true` מפעיל את שלב ה-deploy המפורש בוורקפלואו.

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
| `npm run generate` | בניית SSG לפרודקשן (`.output/public`) |
| `npm run fetch:netflix` | שליפת/רענון התוכן החודשי |
| `npm run monthly:update` | fetch + sitemap + rss + llms.txt (מה שהוורקפלואו מריץ) |
