// זהה ללוגיקה של app/utils/slugify.ts — כפילות מכוונת כדי לא לגרום
// לתלות בין קוד Node טהור (סקריפטים) לבין קוד Vue/Nuxt.
export function slugify(name, tmdbId) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return tmdbId ? `${base}-${tmdbId}` : base
}
