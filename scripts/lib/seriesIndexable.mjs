/** A series URL is worth indexing only when it has a real synopsis and an editor review. */
export const PLACEHOLDER_OVERVIEW = 'תקציר יתעדכן בקרוב.'

export function seriesIsIndexable(series) {
  if (!series || typeof series !== 'object') return false
  const overview = typeof series.overview === 'string' ? series.overview.trim() : ''
  const review = typeof series.editorReview === 'string' ? series.editorReview.trim() : ''
  if (!overview || overview === PLACEHOLDER_OVERVIEW) return false
  if (!review) return false
  return true
}
