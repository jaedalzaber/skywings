import { buildSearchIndex, searchIndex, suggestQuery } from '@/lib/search/productSearch'

import type { CatalogProduct } from './catalog'
import { compareTitles, pagesFirst } from './productReadiness'

/*
 * The catalogue's state lives in the address: category, search, sort and page
 * are all query parameters, and the server renders exactly the page they name.
 * A reload, a shared link, Back and Forward and a search engine following the
 * pager all land on the same fifteen products.
 *
 * Pure -- no Payload, no request -- so the whole of it can be tested directly.
 */

/** Three columns by five rows: a screenful, then a page break. */
export const CATALOG_PAGE_SIZE = 15

export const CATALOG_SORTS = ['featured', 'newest', 'az', 'za'] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

/** Longer than any real product search; it only bounds what a URL can ask for. */
const MAX_QUERY_LENGTH = 100

export type CatalogSelection = { family: string | null; industry: string | null }

export type CatalogQuery = CatalogSelection & {
  /** 1-based, as it reads in the address. */
  page: number
  q: string
  sort: CatalogSort
}

/** A card as the grid receives it: the search fields stay on the server. */
export type CatalogCard = Omit<CatalogProduct, 'searchFields'>

export type CatalogResult = {
  cards: CatalogCard[]
  /**
   * For a search that finds nothing in the open category: how many it finds
   * across the whole catalogue, so the empty state can offer to widen.
   */
  elsewhere: number
  /** The page actually shown -- the one asked for, held within range. */
  page: number
  pageCount: number
  /** Index of the first card on this page within the whole result. */
  start: number
  /** A corrected spelling that finds something, when nothing matched at all. */
  suggestion: string | null
  total: number
}

type RawParams = Record<string, string | string[] | undefined>

function text(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value
  return (first ?? '').trim()
}

/**
 * The address's parameters as a query. Anything unrecognised falls back to its
 * default rather than failing: an old or hand-edited link still opens the
 * catalogue. `selection` is for a category page, whose category comes from
 * its path and outranks anything in the query string.
 */
export function parseCatalogQuery(params: RawParams, selection?: CatalogSelection): CatalogQuery {
  const sort = text(params.sort)
  const page = Number.parseInt(text(params.page), 10)

  return {
    family: selection ? selection.family : text(params.family) || null,
    industry: selection ? selection.industry : text(params.industry) || null,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    q: text(params.q).slice(0, MAX_QUERY_LENGTH),
    sort: (CATALOG_SORTS as readonly string[]).includes(sort) ? (sort as CatalogSort) : 'featured',
  }
}

/**
 * The address for a catalogue view. Defaults are left out -- page 1, the
 * featured order, no search -- so each view has one address, not several.
 * `pathSelection` is set on a category page, where the category is already in
 * the path and repeating it in the query string would only give the same page
 * a second address.
 */
export function catalogHref(
  basePath: string,
  query: CatalogQuery,
  options: { pathSelection?: boolean } = {},
) {
  const params = new URLSearchParams()

  if (!options.pathSelection) {
    if (query.industry) params.set('industry', query.industry)
    if (query.family) params.set('family', query.family)
  }
  if (query.q) params.set('q', query.q)
  if (query.sort !== 'featured') params.set('sort', query.sort)
  if (query.page > 1) params.set('page', String(query.page))

  const search = params.toString()
  return `${basePath}${search ? `?${search}` : ''}`
}

function sortCards(products: CatalogProduct[], sort: CatalogSort) {
  if (sort === 'featured') return products

  // An order the visitor picked is followed exactly, finished products or not.
  const sorted = [...products]
  if (sort === 'az') return sorted.sort((a, b) => compareTitles(a.title, b.title))
  if (sort === 'za') return sorted.sort((a, b) => compareTitles(b.title, a.title))
  return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * One page of the catalogue for a query: filtered to the category, matched and
 * ranked against the search, sorted, and sliced.
 *
 * The search is scored over every product rather than only the open category,
 * so an empty category can still say whether the search would find something
 * elsewhere. The page is held within range rather than trusted: a link to a
 * page that a smaller result no longer has shows its last page instead.
 */
export function queryCatalog(
  products: CatalogProduct[],
  query: CatalogQuery,
  pageSize = CATALOG_PAGE_SIZE,
): CatalogResult {
  const index = query.q ? buildSearchIndex(products, (product) => product.searchFields) : null
  const matches =
    index && query.q
      ? new Map(searchIndex(index, query.q).map(({ item, score }) => [item.id, score]))
      : null

  const filtered = products.filter(
    (product) =>
      (!query.family || product.familySlug === query.family) &&
      (!query.industry || product.industrySlugs.includes(query.industry)) &&
      (!matches || matches.has(product.id)),
  )

  // While searching, the shelf order gives way to relevance -- still finished
  // products first, as on the shelf -- unless the visitor has picked an order
  // of their own, which always wins.
  const visible =
    matches && query.sort === 'featured'
      ? pagesFirst(
          filtered.sort((a, b) => (matches.get(b.id) ?? 0) - (matches.get(a.id) ?? 0)),
          (product) => product.hasPage,
        )
      : sortCards(filtered, query.sort)

  const elsewhere =
    !visible.length && matches && (query.industry || query.family) ? matches.size : 0
  const suggestion = index && !visible.length && !elsewhere ? suggestQuery(index, query.q) : null

  const total = visible.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(query.page, pageCount)
  const start = (page - 1) * pageSize

  return {
    cards: visible
      .slice(start, start + pageSize)
      .map(({ searchFields: _searchFields, ...card }) => card),
    elsewhere,
    page,
    pageCount,
    start,
    suggestion,
    total,
  }
}

/**
 * Where a request for a page should be sent instead, if anywhere. One address
 * per page: `?page=1`, a page past the end and anything that is not a page
 * number all go to the page actually shown -- a stale link to page nine of a
 * catalogue that now has seven lands on seven, not on an empty grid. Null when
 * the address is already the right one.
 */
export function pageRedirect(
  requested: string | string[] | undefined,
  shown: number,
  canonical: string,
): string | null {
  if (requested === undefined) return null
  const raw = Array.isArray(requested) ? requested[0] : requested
  return shown === 1 || raw !== String(shown) ? canonical : null
}

/**
 * Which page numbers the pager shows: all of them while there are few, then
 * the first, the last and the current one with its neighbours, the runs in
 * between collapsed to a gap. The pager stays one short row however long the
 * catalogue grows.
 */
export function pagerWindow(page: number, pageCount: number): Array<number | 'gap'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const shown = new Set([1, pageCount, page - 1, page, page + 1])
  // Near either end, keep five numbers together rather than one and a gap.
  if (page <= 3) [2, 3, 4].forEach((value) => shown.add(value))
  if (page >= pageCount - 2)
    [pageCount - 3, pageCount - 2, pageCount - 1].forEach((value) => shown.add(value))

  const pages = [...shown].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b)

  return pages.flatMap((value, index) => {
    const gap = index > 0 ? value - pages[index - 1] : 1
    // An ellipsis standing in for a single page takes its room and hides it:
    // show the page instead.
    if (gap === 2) return [value - 1, value]
    return gap > 2 ? (['gap', value] as const) : [value]
  })
}
