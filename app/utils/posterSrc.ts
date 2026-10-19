/** Cards use TMDB w342. Month tiles pass 185. Stored data may still say w500. */
export function posterSrc(url: string | null | undefined, width = 342): string | undefined {
  if (!url) return undefined
  return url.replace(/\/t\/p\/w\d+\//, `/t/p/w${width}/`)
}
