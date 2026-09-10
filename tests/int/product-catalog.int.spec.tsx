import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  ProductCatalog,
  type CatalogSelection,
} from '@/components/collections/catalog/ProductCatalog'
import type { CatalogCategory, CatalogProduct } from '@/data/catalog'
import { parseCatalogQuery, queryCatalog } from '@/data/catalogQuery'

/*
 * The catalogue is driven by its address: every control navigates, and the
 * route renders what the new address names. The Route harness below plays the
 * route's part -- it holds the address, parses it and runs the same
 * queryCatalog the page does -- and the mocked router moves that address. So
 * these specs still go from a keystroke to the grid, through the URL.
 */
const router = {
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}
vi.mock('next/navigation', () => ({ useRouter: () => router }))

let goTo: (href: string) => void = () => {}

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const stylesheet = read('src/app/(frontend)/styles.css')
const component = read('src/components/collections/catalog/ProductCatalog.tsx')
const card = read('src/components/collections/catalog/ProductCatalogCard.tsx')
const dataLayer = read('src/data/catalog.ts')
const cardImages = read('src/data/productCardImages.ts')
const slugRoute = read('src/app/(frontend)/products/[slug]/page.tsx')

const categories: CatalogCategory[] = [
  {
    children: [
      { count: 2, slug: 'cargo-and-baggage-handling', title: 'Cargo & Baggage Handling' },
      { count: 1, slug: 'conveyors-and-loaders', title: 'Conveyors & Loaders' },
    ],
    count: 3,
    slug: 'aviation-ground-support-equipment',
    title: 'Aviation Ground Support Equipment',
  },
  {
    children: [{ count: 1, slug: 'tubular-products', title: 'Tubular Products' }],
    count: 1,
    slug: 'construction-and-infrastructure',
    title: 'Construction & Infrastructure',
  },
]

const product = (over: Partial<CatalogProduct> & { id: number; slug: string; title: string }) => ({
  category: 'Cargo & Baggage Handling',
  createdAt: '2024-01-01T00:00:00.000Z',
  familySlug: 'cargo-and-baggage-handling',
  hasPage: true,
  hoverImage: null,
  imageInset: null,
  image: { alt: `${over.title} image`, url: `/api/media/file/${over.slug}.png` },
  industrySlugs: ['aviation-ground-support-equipment'],
  searchFields: {
    code: null,
    context: '',
    family: over.category ?? 'Cargo & Baggage Handling',
    summary: '',
    title: over.title,
  },
  ...over,
})

const products: CatalogProduct[] = [
  product({ id: 1, slug: 'cargo-mail-cart', title: 'Cargo Mail Cart' }),
  product({
    id: 2,
    searchFields: {
      code: 'GSE-OBC-021',
      context: 'Powder coating Welding & Assembly',
      family: 'Cargo & Baggage Handling',
      summary: 'Open-sided baggage cart.',
      title: 'Open Baggage Cart',
    },
    slug: 'open-baggage-cart',
    title: 'Open Baggage Cart',
  }),
  product({
    category: 'Conveyors & Loaders',
    createdAt: '2025-06-01T00:00:00.000Z',
    familySlug: 'conveyors-and-loaders',
    id: 3,
    slug: 'towable-belt-loader',
    title: 'Towable Belt Loader',
  }),
  product({
    category: 'Tubular Products',
    familySlug: 'tubular-products',
    id: 4,
    industrySlugs: ['construction-and-infrastructure'],
    slug: 'handrails',
    title: 'Handrails And Safety Barriers',
  }),
]

/** The route, in miniature: an address in, a rendered page out. */
function Route(props: {
  catalog: CatalogProduct[]
  initial: string
  selection?: CatalogSelection
}) {
  const [href, setHref] = useState(props.initial)
  // Handed out once mounted: the router mock and Back/Forward specs move this.
  useEffect(() => {
    goTo = setHref
  }, [])
  const url = new URL(href, 'http://localhost')
  const pathSelection = url.pathname !== '/products'
  const query = parseCatalogQuery(
    Object.fromEntries(url.searchParams),
    pathSelection ? props.selection : undefined,
  )

  return (
    <ProductCatalog
      basePath={url.pathname}
      categories={categories}
      pathSelection={pathSelection}
      query={query}
      result={queryCatalog(props.catalog, query)}
      totalProducts={props.catalog.length}
    />
  )
}

function renderCatalog(initial = '/products', catalog: CatalogProduct[] = products) {
  return render(<Route catalog={catalog} initial={initial} />)
}

/** The address the catalogue last asked for, and whether it pushed or replaced. */
const lastNavigation = () => {
  const calls = [
    ...router.push.mock.calls.map(([href], i) => ({
      href,
      kind: 'push',
      order: router.push.mock.invocationCallOrder[i],
    })),
    ...router.replace.mock.calls.map(([href], i) => ({
      href,
      kind: 'replace',
      order: router.replace.mock.invocationCallOrder[i],
    })),
  ].sort((a, b) => a.order - b.order)
  const last = calls[calls.length - 1]
  return last ? { href: last.href, kind: last.kind } : null
}

const titles = () =>
  Array.from(document.querySelectorAll('.catalogue-card-title')).map((el) => el.textContent)

describe('product catalogue', () => {
  beforeEach(() => {
    router.push.mockImplementation((href: string) => goTo(href))
    router.replace.mockImplementation((href: string) => goTo(href))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('opens on every product, with the tree built from what is actually filed', () => {
    renderCatalog()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('All products')
    expect(titles()).toHaveLength(products.length)
    expect(document.querySelector('.catalogue-count')?.textContent).toContain('4 products')

    const tree = within(document.querySelector('.catalogue-tree') as HTMLElement)
    for (const category of categories) {
      expect(tree.getByRole('button', { name: new RegExp(category.title) })).toBeTruthy()
    }
    // A family with nothing filed under it never reaches the sidebar.
    expect(dataLayer).toMatch(/\(perFamily\.get\(family\.slug\) \?\? 0\) > 0/)
    expect(dataLayer).toMatch(/\.filter\(\(category\) => category\.count > 0\)/)
  })

  test('narrows to a category from the sidebar, and says so in the title and breadcrumb', () => {
    renderCatalog()

    fireEvent.click(screen.getByRole('button', { name: /Conveyors & Loaders/ }))

    // A new history entry, so Back returns to the view before.
    expect(lastNavigation()).toEqual({
      href: '/products?industry=aviation-ground-support-equipment&family=conveyors-and-loaders',
      kind: 'push',
    })
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Conveyors & Loaders')
    expect(titles()).toEqual(['Towable Belt Loader'])
    const crumbs = Array.from(document.querySelectorAll('.catalogue-breadcrumb li'))
      .map((li) => li.textContent?.trim())
      .filter((text) => text && text !== '/')
    expect(crumbs).toEqual([
      'Home',
      'Products',
      'Aviation Ground Support Equipment',
      'Conveyors & Loaders',
    ])
  })

  /*
   * The point of the search is that it reaches past the name: a visitor who
   * knows the finish or the process, not the product, still lands on it. The
   * search goes into the address once typing pauses, and the route matches it
   * on the server -- so a search is a link that can be shared. The matching
   * rules themselves are pinned in product-search.int.spec.ts.
   */
  test('searches past the name, on a debounce short enough to feel attached', () => {
    vi.useFakeTimers()
    renderCatalog()

    fireEvent.change(document.querySelector('.catalogue-search-input') as HTMLElement, {
      target: { value: 'powder coating' },
    })
    // Still every card while the debounce runs: the field is live, the grid waits.
    expect(titles()).toHaveLength(products.length)

    act(() => vi.advanceTimersByTime(400))
    expect(titles()).toEqual(['Open Baggage Cart'])
    // Into the address, replacing the entry: Back is not spent on keystrokes.
    expect(lastNavigation()).toEqual({ href: '/products?q=powder+coating', kind: 'replace' })
    vi.useRealTimers()

    const debounce = Number(/const SEARCH_DEBOUNCE_MS = (\d+)/.exec(component)?.[1])
    expect(debounce).toBeGreaterThanOrEqual(250)
    expect(debounce).toBeLessThanOrEqual(350)
    expect(dataLayer).toMatch(/product\.capabilities, product\.applications/)
  })

  const searchFor = (value: string) => {
    fireEvent.change(document.querySelector('.catalogue-search-input') as HTMLElement, {
      target: { value },
    })
    act(() => vi.advanceTimersByTime(400))
  }

  /* A buyer with a model number off a drawing types it however it is written. */
  test('finds a product by its model number, and ranks it first', () => {
    vi.useFakeTimers()
    renderCatalog()

    searchFor('obc021')
    expect(titles()).toEqual(['Open Baggage Cart'])

    // While searching, the default order reads as what it now is.
    const select = document.querySelector('.catalogue-select select') as HTMLSelectElement
    expect(select.options[0].textContent).toBe('Best match')
    vi.useRealTimers()

    expect(
      (document.querySelector('.catalogue-search-input') as HTMLInputElement).placeholder,
    ).toMatch(/model number/i)
  })

  /*
   * A search inside a category that finds nothing there, but does elsewhere,
   * says so and offers to widen -- rather than a dead end that makes the
   * visitor retype the same thing after clearing the filter themselves.
   */
  test('offers the matches outside the open category', () => {
    vi.useFakeTimers()
    renderCatalog('/products?industry=construction-and-infrastructure&family=tubular-products')

    searchFor('baggage')
    expect(titles()).toEqual([])
    const widen = screen.getByRole('button', { name: /Show 2 matches in all products/ })

    fireEvent.click(widen)
    // The name outranks the family: one has the word in its title, the other
    // only in the family it is filed under.
    expect(titles()).toEqual(['Open Baggage Cart', 'Cargo Mail Cart'])
    vi.useRealTimers()
  })

  /*
   * A long word with a slip in it is simply found. A short one is not fuzzed
   * -- one letter off a four-letter word is usually another word -- so it is
   * offered as a correction instead, and only if the correction finds
   * something.
   */
  test('forgives a slip in a long word, and suggests one for a short word', () => {
    vi.useFakeTimers()
    renderCatalog()

    searchFor('hnadrails')
    expect(titles()).toEqual(['Handrails And Safety Barriers'])

    searchFor('mial')
    expect(titles()).toEqual([])
    const suggestion = document.querySelector('.catalogue-empty-suggestion') as HTMLElement
    expect(suggestion.textContent).toBe('mail')

    fireEvent.click(suggestion)
    expect(titles()).toEqual(['Cargo Mail Cart'])
    expect((document.querySelector('.catalogue-search-input') as HTMLInputElement).value).toBe(
      'mail',
    )
    vi.useRealTimers()
  })

  test('offers a way out when nothing matches', () => {
    vi.useFakeTimers()
    renderCatalog()

    fireEvent.change(document.querySelector('.catalogue-search-input') as HTMLElement, {
      target: { value: 'submarine' },
    })
    act(() => vi.advanceTimersByTime(400))
    vi.useRealTimers()

    expect(document.querySelector('.catalogue-empty')).not.toBeNull()
    expect(titles()).toHaveLength(0)
    expect(
      Array.from(document.querySelectorAll('.catalogue-empty-button')).map((b) => b.textContent),
    ).toEqual(['Clear search', 'View all products'])

    // The field's own clear carries the same name, so scope to the panel.
    const empty = within(document.querySelector('.catalogue-empty') as HTMLElement)
    fireEvent.click(empty.getByRole('button', { name: 'Clear search' }))
    expect(titles()).toHaveLength(products.length)
  })

  /*
   * Five rows, then a page break, with the tally and the pager together under
   * the grid -- both answer "where am I in this set", which is a question you
   * have once you have reached the end of it rather than before you start.
   */
  test('pages the grid at five rows and tallies it underneath', () => {
    const many = Array.from({ length: 20 }, (_, index) =>
      product({
        id: 100 + index,
        slug: `p-${index}`,
        title: `Product ${String(index).padStart(2, '0')}`,
      }),
    )
    renderCatalog('/products', many)

    expect(titles()).toHaveLength(15)
    expect(document.querySelector('.catalogue-count')?.textContent).toContain(
      'Showing 1 - 15 of 20 products',
    )
    const pages = Array.from(document.querySelectorAll('.catalogue-pager-page'))
    expect(pages.map((b) => b.textContent)).toEqual(['1', '2'])
    expect(pages[0].getAttribute('aria-current')).toBe('page')

    // Real links, so a page is reachable without script and opens in a new tab.
    const second = screen.getByRole('link', { name: 'Page 2' })
    expect(second.getAttribute('href')).toBe('/products?page=2')

    fireEvent.click(second)
    expect(lastNavigation()).toEqual({ href: '/products?page=2', kind: 'push' })
    expect(titles()).toHaveLength(5)
    expect(document.querySelector('.catalogue-count')?.textContent).toContain(
      'Showing 16 - 20 of 20 products',
    )

    // Nothing above the grid competes with the photography.
    expect(document.querySelector('.catalogue-bar ~ .catalogue-count')).toBeNull()
  })

  // The pager sits under the grid; without this a new page opens at its last row.
  test('scrolls back to the top of the catalogue when the page changes', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const many = Array.from({ length: 20 }, (_, index) =>
      product({
        id: 100 + index,
        slug: `p-${index}`,
        title: `Product ${String(index).padStart(2, '0')}`,
      }),
    )
    renderCatalog('/products', many)

    fireEvent.click(screen.getByRole('link', { name: 'Next page' }))

    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(scrollIntoView.mock.contexts[0]).toBe(document.querySelector('.catalogue-main'))
  })

  /*
   * A second view, shown while the pointer is over the card. An editor's own
   * pick when they have made one, otherwise the first gallery image that is
   * not already on the card -- so a product with photographs gets the effect
   * without anyone filing a second copy of them.
   */
  test('shows a second image on hover, from the field or the gallery', () => {
    renderCatalog('/products', [
      product({
        hoverImage: { alt: '', url: '/api/media/file/second.png' },
        id: 90,
        slug: 'two-views',
        title: 'Two Views',
      }),
      product({ id: 91, slug: 'one-view', title: 'One View' }),
    ])

    const cards = Array.from(document.querySelectorAll('.catalogue-card'))
    expect(cards[0].querySelector('.catalogue-card-hover')).not.toBeNull()
    // Decorative: the card already names the product.
    expect(cards[0].querySelector('.catalogue-card-hover')?.getAttribute('aria-hidden')).toBe(
      'true',
    )
    expect(cards[1].querySelector('.catalogue-card-hover')).toBeNull()

    /*
     * The two images are treated differently on purpose: the first is a
     * render on no background, so it is inset and fitted whole -- cropping it
     * would cut the product -- while the second is a photograph and fills the
     * card edge to edge.
     */
    expect(stylesheet).toMatch(/\.catalogue-card-fit img \{[^}]*object-fit: contain;/s)
    expect(stylesheet).toMatch(/\.catalogue-card-hover img \{[^}]*object-fit: cover;/s)
    expect(stylesheet).toMatch(/\.catalogue-card-canvas \{[^}]*--catalogue-card-pad: \d+%;/s)
    expect(stylesheet).toMatch(
      /\.catalogue-card-fit \{[^}]*inset: var\(--catalogue-card-pad-top, var\(--catalogue-card-pad\)\)\s*var\(--catalogue-card-pad-right, var\(--catalogue-card-pad\)\)\s*var\(--catalogue-card-pad-bottom, var\(--catalogue-card-pad\)\)\s*var\(--catalogue-card-pad-left, var\(--catalogue-card-pad\)\);/s,
    )

    // Decided once, in the helper both the catalogue and the home rail read.
    expect(cardImages).toMatch(/const chosenHover = getMediaImage\(product\.cardHoverImage\)/)
    expect(cardImages).toMatch(
      /\.find\(\(candidate\) => candidate && candidate\.url !== image\?\.url\)/,
    )
    expect(dataLayer).toMatch(/productCardImages\(product\)/)
    expect(stylesheet).toMatch(
      /\.catalogue-card-link:hover \.catalogue-card-hover[^{]*\{\s*opacity: 1;/s,
    )
  })

  /* The site default, overridden per product -- and per side -- from the CMS
     for one that crowds its card, looks lost in it, or should meet an edge. */
  test('insets a card render by the site default, or the product’s own values', () => {
    const all = (value: number) => ({ bottom: value, left: value, right: value, top: value })
    renderCatalog('/products', [
      product({ id: 80, imageInset: all(22), slug: 'wide-one', title: 'Wide One' }),
      product({ id: 81, slug: 'default-one', title: 'Default One' }),
      product({ id: 82, imageInset: all(0), slug: 'full-bleed', title: 'Full Bleed' }),
      product({
        id: 83,
        imageInset: { bottom: 0, left: null, right: null, top: null },
        slug: 'standing',
        title: 'Standing',
      }),
    ])

    const canvases = Array.from(
      document.querySelectorAll('.catalogue-card-canvas'),
    ) as HTMLElement[]
    expect(canvases[0].style.getPropertyValue('--catalogue-card-pad-top')).toBe('22%')
    expect(canvases[0].style.getPropertyValue('--catalogue-card-pad-left')).toBe('22%')
    expect(canvases[0].getAttribute('data-fill')).toBeNull()
    expect(canvases[1].getAttribute('style')).toBeNull()

    // 0 everywhere fills the card rather than letterboxing inside it.
    expect(canvases[2].getAttribute('data-fill')).toBe('true')
    expect(stylesheet).toMatch(
      /\.catalogue-card-canvas\[data-fill='true'\] \.catalogue-card-fit img \{\s*object-fit: cover;/s,
    )

    // One side at 0: only that side moves, and the image is pulled onto it.
    expect(canvases[3].style.getPropertyValue('--catalogue-card-pad-bottom')).toBe('0%')
    expect(canvases[3].style.getPropertyValue('--catalogue-card-pad-top')).toBe('')
    expect(canvases[3].style.getPropertyValue('--catalogue-card-align')).toBe('center bottom')
    expect(canvases[3].getAttribute('data-fill')).toBeNull()

    expect(cardImages).toMatch(/imageInset: resolveCardImageInset\(product\)/)
    expect(read('src/collections/Products.ts')).toMatch(
      /name: 'cardImagePadding',[\s\S]*?type: 'number',/,
    )
  })

  test('shows the name and nothing else on a card', () => {
    renderCatalog()

    expect(document.querySelector('.catalogue-card-category')).toBeNull()
    expect(document.querySelector('.catalogue-card-body')?.textContent).toBe(
      'Cargo Mail CartView product →',
    )
  })

  /*
   * The catalogue sits on the page container the bar and every other section
   * use. .site-shell already provides it, so a gutter here would inset the
   * grid a second time and leave it narrower than everything around it.
   */
  test('sits on the shared page container, not a second gutter inside it', () => {
    expect(stylesheet).toMatch(/\.catalogue-layout \{[^}]*padding: clamp\([^)]*\) 0 clamp\(/s)
    expect(stylesheet).not.toMatch(/\.catalogue-layout \{[^}]*padding:[^;]*var\(--page-gutter\)/s)
  })

  test('sorts by name and by age, leaving featured as the shelf order', () => {
    renderCatalog()
    const select = document.querySelector('.catalogue-select select') as HTMLSelectElement

    expect(Array.from(select.options).map((option) => option.textContent)).toEqual([
      'Featured',
      'Newest',
      'A–Z',
      'Z–A',
    ])
    expect(titles()).toEqual(products.map((item) => item.title))

    fireEvent.change(select, { target: { value: 'az' } })
    expect(lastNavigation()).toEqual({ href: '/products?sort=az', kind: 'replace' })
    expect(titles()[0]).toBe('Cargo Mail Cart')

    fireEvent.change(select, { target: { value: 'za' } })
    expect(titles()[0]).toBe('Towable Belt Loader')

    fireEvent.change(select, { target: { value: 'newest' } })
    expect(titles()[0]).toBe('Towable Belt Loader')
  })

  /*
   * The bar has to go dark over this page, which it only does by sitting over
   * a section that declares itself dark -- so the band is pulled up under it
   * rather than starting below it, which also closes the seam between them.
   */
  test('runs the dark band up under the bar so the bar goes dark with it', () => {
    renderCatalog()

    expect(document.querySelector('.catalogue-intro')?.getAttribute('data-nav-surface')).toBe(
      'dark',
    )
    expect(document.querySelector('.catalogue-layout')?.getAttribute('data-nav-surface')).toBe(
      'white',
    )
    expect(stylesheet).toMatch(
      /\.catalogue-intro \{[^}]*margin-block-start: calc\(-1 \* var\(--header-height\)\);/s,
    )
    expect(stylesheet).toMatch(
      /\.catalogue-intro \{[^}]*padding: calc\(var\(--header-height\) \+ clamp\(/s,
    )
  })

  /*
   * `.catalog-card` is already the site's card, bordered and on a surface
   * tint. These cards are borderless by design, so they carry their own
   * namespace rather than quietly restyling every other card on the site.
   */
  test('keeps its own class namespace, clear of the shared card', () => {
    for (const source of [component, card]) {
      expect(source).not.toMatch(/className="catalog-(card|grid|tree|intro)/)
    }
    expect(stylesheet).toMatch(/\.catalog-card,\s*\n\.list-article/)
    expect(stylesheet).not.toMatch(/\.catalogue-card \{[^}]*border:/s)
  })

  test('animates the card in, and hovers it without a shop button', () => {
    renderCatalog()

    // The grid is keyed on the filter, so a category change replays as a crossfade.
    expect(component).toMatch(/key=\{`\$\{selection\.industry \?\? 'all'\}/)
    expect(component).toMatch(/stagger=\{0\.05\}/)
    expect(document.querySelector('.catalogue-grid')?.hasAttribute('data-reveal')).toBe(true)

    // Hover belongs to the stylesheet: no state, and it works before hydration.
    expect(stylesheet).toMatch(
      /\.catalogue-card-link:hover \.catalogue-card-fit img[^{]*\{\s*transform: scale\(1\.04\);/s,
    )
    expect(stylesheet).toMatch(
      /\.catalogue-card-link:hover \.catalogue-card-body[^{]*\{\s*transform: translateY\(-3px\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[^@]*\.catalogue-card-fit img,/s,
    )
    // A reference shelf, not a shop.
    // Nothing in the rendered card offers to sell anything.
    expect(document.querySelector('.catalogue-grid')?.textContent).not.toMatch(
      /price|add to|buy|in stock/i,
    )
    expect(document.querySelector('.catalogue-card-link')?.getAttribute('href')).toBe(
      '/products/cargo-mail-cart',
    )
  })

  /*
   * A product whose page is not written yet keeps its card, but nothing on it
   * promises a page: no link, no "View product", no second view on hover.
   */
  test('shows a product with no page as a still card', () => {
    renderCatalog('/products', [
      product({
        hasPage: false,
        hoverImage: { alt: '', url: '/api/media/file/cowl-2.png' },
        id: 9,
        slug: 'cowl-pylon-ladders',
        title: 'Cowl Pylon Ladders',
      }),
    ])

    const card = document.querySelector('.catalogue-card')
    expect(card?.textContent).toContain('Cowl Pylon Ladders')
    expect(card?.querySelector('a')).toBeNull()
    expect(card?.querySelector('.catalogue-card-static')).not.toBeNull()
    expect(card?.querySelector('.catalogue-card-action')).toBeNull()
    expect(card?.querySelector('.catalogue-card-hover')).toBeNull()
  })

  /*
   * One slug serves a product and a category. Products resolve first because
   * every card, menu and sitemap on the site already points here for them.
   */
  test('answers a category slug only where no finished product claims it', () => {
    expect(slugRoute).toMatch(/const product = await getProductBySlug\(slug\)/)
    expect(slugRoute).toMatch(
      /if \(product && hasProductPage\(product\)\) \{[\s\S]*?<ProductDetail[\s\S]*?findCategory\(view, slug\)/,
    )
    expect(slugRoute).toMatch(/if \(!selection\) \{[\s\S]*?notFound\(\)/)
  })

  /*
   * An unfinished product forwards to its shelf -- but never to its own
   * address, which is what a family sharing its slug would make of it.
   */
  test('forwards an unfinished product to its shelf without looping', () => {
    expect(slugRoute).toMatch(
      /redirect\(family && family !== slug \? `\/products\/\$\{family\}` : '\/products'\)/,
    )
  })

  test('hides the sidebar behind a drawer until there is room beside the grid', () => {
    renderCatalog()

    expect(stylesheet).toMatch(/\.catalogue-sidebar \{\s*display: none;/s)
    expect(stylesheet).toMatch(
      /@media \(min-width: 64rem\) \{[\s\S]*?\.catalogue-sidebar \{[^}]*display: block;/,
    )
    // Held under the bar while the grid scrolls past it, and capped so a long
    // tree scrolls inside itself rather than running off the screen.
    expect(stylesheet).toMatch(
      /\.catalogue-sidebar \{[^}]*position: sticky;\s*top: calc\(var\(--header-height\) \+ 1rem\);/s,
    )
    expect(stylesheet).toMatch(/\.catalogue-sidebar \{[^}]*max-height: calc\(100svh/s)

    /*
     * Every category carries the rule above it. On the row below instead, it
     * stopped at an open parent's heading and left the next category sitting
     * straight under the last child with nothing setting it off.
     */
    expect(stylesheet).toMatch(/\.catalogue-tree-group \{\s*border-top: 1px solid #ececec;/s)
    expect(stylesheet).not.toMatch(
      /\.catalogue-tree-all,\s*\.catalogue-tree-parent \{[^}]*border-bottom/s,
    )
    expect(stylesheet).toMatch(
      /\.catalogue-tree-parent\[aria-expanded='true'\] \{\s*border-bottom: 1px solid #ececec;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 64rem\) \{[\s\S]*?\.catalogue-filter-button \{\s*display: none;/,
    )

    fireEvent.click(screen.getByRole('button', { name: /Categories/ }))
    const drawer = screen.getByRole('dialog', { name: 'Product categories' })
    expect(drawer).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Product categories' })).toBeNull()
  })

  /*
   * A reload or a shared link has only the address to go on, so the address
   * has to carry all of it: category, search, order and page.
   */
  test('opens on exactly the view its address names', () => {
    renderCatalog('/products?industry=aviation-ground-support-equipment&q=cart&sort=za')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Aviation Ground Support Equipment',
    )
    expect((document.querySelector('.catalogue-search-input') as HTMLInputElement).value).toBe(
      'cart',
    )
    expect((document.querySelector('.catalogue-select select') as HTMLSelectElement).value).toBe(
      'za',
    )
    expect(titles()).toEqual(['Open Baggage Cart', 'Cargo Mail Cart'])
    // Nothing is asked of the router just to show what was loaded.
    expect(router.push).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  // Back and Forward change the address under the page; the field follows.
  test('brings a search from Back or Forward into the field', () => {
    renderCatalog('/products?q=cart')

    act(() => goTo('/products?q=mail'))
    expect((document.querySelector('.catalogue-search-input') as HTMLInputElement).value).toBe(
      'mail',
    )
    expect(titles()).toEqual(['Cargo Mail Cart'])

    act(() => goTo('/products'))
    expect((document.querySelector('.catalogue-search-input') as HTMLInputElement).value).toBe('')
    expect(titles()).toHaveLength(products.length)
  })

  const many = (industry = 'aviation-ground-support-equipment') =>
    Array.from({ length: 35 }, (_, index) =>
      product({
        id: 200 + index,
        industrySlugs: [industry],
        slug: `m-${index}`,
        title: `Model ${String(index).padStart(2, '0')}`,
      }),
    )

  test('keeps the search and the order in every page link, and leaves the ends inert', () => {
    renderCatalog('/products?q=model&sort=az', many())

    expect(screen.getByRole('link', { name: 'Page 2' }).getAttribute('href')).toBe(
      '/products?q=model&sort=az&page=2',
    )
    // Page 1 has no page before it: shown, but not a link to itself.
    expect(screen.queryByRole('link', { name: 'Previous page' })).toBeNull()
    expect(document.querySelector('.catalogue-pager-step[aria-disabled="true"]')).not.toBeNull()

    fireEvent.click(screen.getByRole('link', { name: 'Page 3' }))
    expect(document.querySelector('.catalogue-count')?.textContent).toContain(
      'Showing 31 - 35 of 35 products',
    )
    expect(screen.queryByRole('link', { name: 'Next page' })).toBeNull()
  })

  /* A new tab, a new window: the browser's to open, at the page's own address. */
  test('leaves a modified click on a page link to the browser', () => {
    renderCatalog('/products', many())

    fireEvent.click(screen.getByRole('link', { name: 'Page 2' }), { ctrlKey: true })
    expect(router.push).not.toHaveBeenCalled()
    expect(titles()[0]).toBe('Model 00')
  })

  /*
   * A category page carries its category in the path, so its pages do not
   * repeat it in the query string -- and choosing another category leaves for
   * the catalogue proper rather than keeping the old path.
   */
  test('pages a category page under its own path, and leaves it for another category', () => {
    render(
      <Route
        catalog={many()}
        initial="/products/aviation-ground-support-equipment"
        selection={{ family: null, industry: 'aviation-ground-support-equipment' }}
      />,
    )

    expect(screen.getByRole('link', { name: 'Page 2' }).getAttribute('href')).toBe(
      '/products/aviation-ground-support-equipment?page=2',
    )

    fireEvent.click(screen.getByRole('button', { name: /Tubular Products/ }))
    expect(lastNavigation()).toEqual({
      href: '/products?industry=construction-and-infrastructure&family=tubular-products',
      kind: 'push',
    })
  })

  /*
   * The catalogue is rendered by the route for the address it is given, so
   * the HTML carries the products and the pager's links. It used to read the
   * address in the browser behind a Suspense fallback of null -- the server
   * sent an empty catalogue, and nothing for a crawler to follow.
   */
  test('is rendered by the route from its address, not read in the browser', () => {
    const route = read('src/app/(frontend)/products/page.tsx')

    expect(route).toMatch(/props\.searchParams/)
    expect(route).toMatch(/queryCatalog\(view\.products, query\)/)
    expect(route).not.toMatch(/Suspense/)
    expect(component).not.toMatch(/useSearchParams/)
    // A product page stays prerendered: it returns before the query is read,
    // which only the category branch below it does.
    const productBranch = slugRoute.slice(
      0,
      slugRoute.indexOf('const view = await getCatalogView()'),
    )
    expect(productBranch).toMatch(/if \(product && hasProductPage\(product\)\) \{[\s\S]*?return \(/)
    expect(productBranch).not.toMatch(/props\.searchParams/)
    expect(slugRoute).toMatch(
      /const view = await getCatalogView\(\)[\s\S]*?const params = await props\.searchParams/,
    )
  })
})
