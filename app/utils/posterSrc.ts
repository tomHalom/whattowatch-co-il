/** Cards use TMDB w342. Stored data may still say w500. */
export function posterSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  return url.replace('/t/p/w500/', '/t/p/w342/')
}
