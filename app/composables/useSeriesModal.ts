/**
 * State for the "click a card → open details modal" pattern shared by
 * every page that renders a grid of SeriesCard (home, monthly archive,
 * provider top-10, genre pages, search). Keeps each page's <script>
 * to a one-liner instead of re-declaring the same ref/open/close.
 */
export function useSeriesModal<T = Record<string, unknown>>() {
  const selected = ref<T | null>(null)

  function open(item: T) {
    selected.value = item
  }
  function close() {
    selected.value = null
  }

  return { selected, open, close }
}
