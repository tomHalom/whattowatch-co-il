export function slugify(name: string, tmdbId: number): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return tmdbId ? `${base}-${tmdbId}` : base
}
