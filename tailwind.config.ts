import type { Config } from 'tailwindcss'

// ============================================================
// Design Plan — Pass 1 (frontend-design two-pass process)
// ------------------------------------------------------------
// Palette (named, deliberately NOT the generic "near-black +
// neon accent" AI-default): base is a violet-tinted charcoal,
// not pure #000; accent is warm amber-gold, not neon green/red,
// and shifted away from Netflix's exact red.
//
//   charcoal-night   #14131C  — page background
//   charcoal-deep    #1C1B27  — card / surface background
//   charcoal-line    #2C2A3A  — hairline borders/dividers
//   sunset-gold      #E8A33D  — primary accent (signature)
//   amber-ember      #D64545  — secondary accent (rank badges)
//   milk-parchment   #F2EEE4  — primary text on dark
//   mist-grey        #9C97A8  — muted / secondary text
//
// Typography roles:
//   display -> "Frank Ruhl Libre" (Hebrew serif, editorial voice)
//   body    -> "IBM Plex Sans Hebrew" (clean Hebrew hinting)
//   utility -> "IBM Plex Mono" (ranks, dates, badges)
//
// Signature element: the tilted "rank badge" numeral (see
// components/SeriesCard.vue .rank-badge) — used consistently
// as the one bold, memorable visual mark. Everything else stays
// quiet: generous spacing, restrained motion, no decorative
// hairline-grid "broadsheet" look, no bare neon-on-black.
// ============================================================

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'charcoal-night': '#14131C',
        'charcoal-deep': '#1C1B27',
        'charcoal-line': '#2C2A3A',
        'sunset-gold': '#E8A33D',
        'amber-ember': '#D64545',
        'milk-parchment': '#F2EEE4',
        'mist-grey': '#9C97A8',
      },
      fontFamily: {
        display: ['"Frank Ruhl Libre"', 'serif'],
        body: ['"IBM Plex Sans Hebrew"', 'system-ui', 'sans-serif'],
        utility: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
