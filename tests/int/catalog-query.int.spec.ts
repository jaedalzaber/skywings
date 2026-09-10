import { describe, expect, test } from 'vitest'

import type { CatalogProduct } from '@/data/catalog'
import {
  CATALOG_PAGE_SIZE,
  catalogHref,
  pageRedirect,
  pagerWindow,
  parseCatalogQuery,
  queryCatalog,
  type CatalogQuery,
} from '@/data/catalogQuery'

const product = (id: number, over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  category: 'Family',
  createdAt: `2024-01-${String((id % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
  familySlug: 'family',
  hasPage: true,
  hoverImage: null,
  id,
  image: null,
  imageInset: null,
  industrySlugs: ['industry'],
  searchFields: { code: null, context: '', family: 'Family', summary: '', title: `Item ${id}` },
  slug: `item-${id}`,
  title: `Item ${String(id).padStart(2, '0')}`,
  ...over,
})

const catalogue = Array.from({ length: 40 }, (_, index) => product(index + 1))
const base: CatalogQuery = { family: null, industry: null, page: 1, q: '', sort: 'featured' }

describe('parseCatalogQuery', () => {
  test('reads every part of the view from the address', () => {
    expect(
      parseCatalogQuery({
        family: 'rails',
        industry: 'infra',
        page: '3',
        q: '  cart ',
        sort: 'za',
      }),
    ).toEqual({ family: 'rails', industry: 'infra', page: 3, q: 'cart', sort: 'za' })
  })

  // An old or hand-edited link still opens the catalogue rather than failing.
  test('falls back to the default for anything it does not recognise', () => {
    expect(parseCatalogQuery({ page: 'abc', sort: 'price' })).toEqual(base)
    expect(parseCatalogQuery({ page: '0' }).page).toBe(1)
    expect(parseCatalogQuery({ page: '-4' }).page).toBe(1)
    // A repeated parameter takes its first value.
    expect(parseCatalogQuery({ page: ['2', '5'] }).page).toBe(2)
    // A search is bounded, whatever a URL asks for.
    expect(parseCatalogQuery({ q: 'x'.repeat(500) }).q).toHaveLength(100)
  })

  test("takes a category page's category from its path, over the query string", () => {
    expect(
      parseCatalogQuery({ industry: 'other' }, { family: null, industry: 'aviation' }).industry,
    ).toBe('aviation')
  })
})

describe('catalogHref', () => {
  // One address per view: defaults are left out rather than spelled out.
  test('writes only what differs from the default view', () => {
    expect(catalogHref('/products', base)).toBe('/products')
    expect(catalogHref('/products', { ...base, page: 1, sort: 'featured' })).toBe('/products')
    expect(
      catalogHref('/products', {
        family: 'rails',
        industry: 'infra',
        page: 2,
        q: 'safety barrier',
        sort: 'az',
      }),
    ).toBe('/products?industry=infra&family=rails&q=safety+barrier&sort=az&page=2')
  })

  test('leaves the category out where the path already carries it', () => {
    expect(
      catalogHref(
        '/products/infra',
        { ...base, industry: 'infra', page: 2 },
        { pathSelection: true },
      ),
    ).toBe('/products/infra?page=2')
  })

  // What the parser reads back is what was written.
  test('round-trips through the parser', () => {
    const query: CatalogQuery = { family: 'f', industry: 'i', page: 4, q: 'a & b', sort: 'newest' }
    const url = new URL(catalogHref('/products', query), 'http://localhost')
    expect(parseCatalogQuery(Object.fromEntries(url.searchParams))).toEqual(query)
  })
})

describe('queryCatalog', () => {
  test('slices the result into pages of fifteen', () => {
    expect(CATALOG_PAGE_SIZE).toBe(15)

    const first = queryCatalog(catalogue, base)
    expect(first).toMatchObject({ page: 1, pageCount: 3, start: 0, total: 40 })
    expect(first.cards).toHaveLength(15)

    const last = queryCatalog(catalogue, { ...base, page: 3 })
    expect(last).toMatchObject({ page: 3, start: 30 })
    expect(last.cards.map((card) => card.id)).toEqual(catalogue.slice(30).map((item) => item.id))
  })

  // A link to a page the result no longer has shows the last page, not nothing.
  test('holds a page past the end within range', () => {
    expect(queryCatalog(catalogue, { ...base, page: 9 })).toMatchObject({ page: 3, start: 30 })
    // An empty result is still one page, not zero.
    expect(queryCatalog([], { ...base, page: 2 })).toMatchObject({
      cards: [],
      page: 1,
      pageCount: 1,
      total: 0,
    })
  })

  test('sends the grid cards without their search fields', () => {
    const [card] = queryCatalog(catalogue, base).cards
    expect(card).not.toHaveProperty('searchFields')
    expect(card).toHaveProperty('slug', 'item-1')
  })

  test('filters to the category, then pages what is left', () => {
    const mixed = catalogue.map((item) =>
      item.id % 2 ? item : { ...item, familySlug: 'other', industrySlugs: ['elsewhere'] },
    )
    const result = queryCatalog(mixed, { ...base, industry: 'industry' })
    expect(result.total).toBe(20)
    expect(result.pageCount).toBe(2)
    expect(result.cards.every((card) => card.industrySlugs.includes('industry'))).toBe(true)
  })

  test('orders by name and by age when asked', () => {
    expect(queryCatalog(catalogue, { ...base, sort: 'za' }).cards[0].title).toBe('Item 40')
    expect(queryCatalog(catalogue, { ...base, sort: 'az' }).cards[0].title).toBe('Item 01')
  })

  // Model numbers inside names compare as numbers: LD2 before LD11.
  test('orders names with numbers in them the way a person would', () => {
    const containers = ['LD11', 'LD3-45', 'LD2', 'LD3', 'LD1', 'LD26'].map((type, index) =>
      product(index + 1, { title: `${type} ULD Container` }),
    )
    expect(
      queryCatalog(containers, { ...base, sort: 'az' }).cards.map((card) => card.title),
    ).toEqual(
      ['LD1', 'LD2', 'LD3', 'LD3-45', 'LD11', 'LD26'].map((type) => `${type} ULD Container`),
    )
  })

  /*
   * A finished product leads a search result as it leads the shelf -- relevance
   * orders each group. An order the visitor picks is followed exactly.
   */
  test('puts products with a page ahead in search results, not in a chosen order', () => {
    const ladders = [
      product(1, {
        searchFields: { code: null, context: '', family: '', summary: '', title: 'Ladder' },
        title: 'Ladder',
        hasPage: false,
      }),
      product(2, {
        searchFields: { code: null, context: '', family: '', summary: 'a ladder', title: 'Stand' },
        title: 'Stand',
        hasPage: true,
      }),
    ]

    const ranked = queryCatalog(ladders, { ...base, q: 'ladder' }).cards.map((card) => card.title)
    expect(ranked).toEqual(['Stand', 'Ladder'])

    const chosen = queryCatalog(ladders, { ...base, q: 'ladder', sort: 'az' }).cards
    expect(chosen.map((card) => card.title)).toEqual(['Ladder', 'Stand'])
  })
})

describe('pageRedirect', () => {
  const canonical = '/products?page=3'

  test('leaves an address alone when it already names the page shown', () => {
    expect(pageRedirect(undefined, 1, '/products')).toBeNull()
    expect(pageRedirect('3', 3, canonical)).toBeNull()
  })

  // One address per page.
  test('sends page 1, a page past the end and a non-number to the page shown', () => {
    expect(pageRedirect('1', 1, '/products')).toBe('/products')
    expect(pageRedirect('9', 3, canonical)).toBe(canonical)
    expect(pageRedirect('abc', 1, '/products')).toBe('/products')
    expect(pageRedirect('03', 3, canonical)).toBe(canonical)
  })
})

describe('pagerWindow', () => {
  test('shows every page while there are few', () => {
    expect(pagerWindow(1, 1)).toEqual([1])
    expect(pagerWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  // One short row however long the catalogue grows.
  test('folds the runs between the ends and the current page into gaps', () => {
    expect(pagerWindow(1, 12)).toEqual([1, 2, 3, 4, 'gap', 12])
    expect(pagerWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12])
    expect(pagerWindow(12, 12)).toEqual([1, 'gap', 9, 10, 11, 12])
    // A gap of one page is just that page.
    expect(pagerWindow(4, 12)).toEqual([1, 2, 3, 4, 5, 'gap', 12])
  })
})
