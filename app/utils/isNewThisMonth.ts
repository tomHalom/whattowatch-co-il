const MONTH_SLUG = /^\d{4}-\d{2}$/

export function isNewThisMonth(
  firstAirDate: string | null | undefined,
  monthSlug: string | null | undefined,
): boolean {
  if (typeof monthSlug !== 'string' || !MONTH_SLUG.test(monthSlug)) return false
  if (typeof firstAirDate !== 'string') return false
  return firstAirDate.slice(0, 7) === monthSlug
}
