/**
 * Injects a JSON-LD <script type="application/ld+json"> tag for the
 * current page. Accepts a plain object or a getter so callers can pass
 * reactive/computed schema (e.g. built from page data). `id` must be
 * stable and unique per call site (multiple schema blocks can coexist
 * on one page, e.g. ItemList + FAQPage + BreadcrumbList).
 */
export function useJsonLd(
  schema: Record<string, unknown> | (() => Record<string, unknown>),
  id = 'default',
) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        key: `jsonld-${id}`,
        innerHTML: () => JSON.stringify(typeof schema === 'function' ? schema() : schema),
      },
    ],
  })
}
