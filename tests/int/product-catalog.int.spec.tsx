import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { ProductCatalog } from '@/components/collections/catalog/ProductCatalog'
import type { CatalogCategory, CatalogProduct } from '@/data/catalog'

// The real hook reads the request's params; here the address bar is the source,
// which is also what the component writes to when the sidebar moves.
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const stylesheet = read('src/app/(frontend)/styles.css')
const component = read('src/components/collections/catalog/ProductCatalog.tsx')
const card = read('src/components/collections/catalog/ProductCatalogCard.tsx')
const dataLayer = read('src/data/catalog.ts')
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
  hoverImage: null,
  imagePadding: null,
  image: { alt: `${over.title} image`, url: `/api/media/file/${over.slug}.png` },
  industrySlugs: ['aviation-ground-support-equipment'],
  search: `${over.title} cargo & baggage handling`.toLowerCase(),
  ...over,
})

const products: CatalogProduct[] = [
  product({ id: 1, slug: 'cargo-mail-cart', title: 'Cargo Mail Cart' }),
  product({
    id: 2,
    search: 'open baggage cart cargo & baggage handling powder coating welding',
    slug: 'open-baggage-cart',
    title: 'Open Baggage Cart',
  }),
  product({
    category: 'Conveyors & Loaders',
    createdAt: '2025-06-01T00:00:00.000Z',
    familySlug: 'conveyors-and-loaders',
    id: 3,
    search: 'towable belt loader conveyors & loaders',
    slug: 'towable-belt-loader',
    title: 'Towable Belt Loader',
  }),
  product({
    category: 'Tubular Products',
    familySlug: 'tubular-products',
    id: 4,
    industrySlugs: ['construction-and-infrastructure'],
    search: 'handrails and safety barriers tubular products',
    slug: 'handrails',
    title: 'Handrails And Safety Barriers',
  }),
]

function renderCatalog(selection = { family: null, industry: null }) {
  return render(
    <ProductCatalog categories={categories} products={products} selection={selection} />,
  )
}

const titles = () =>
  Array.from(document.querySelectorAll('.catalogue-card-title')).map((el) => el.textContent)

describe('product catalogue', () => {
  afterEach(() => {
    cleanup()
    // The catalogue writes the selection into the address bar, and reads it
    // back on mount -- so a test that filters would seed the next one.
    window.history.replaceState(null, '', '/products')
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
   * knows the finish or the process, not the product, still lands on it. That
   * only works because the haystack is folded on the server, so the field can
   * stay a substring test on a string that is already in the browser.
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
    vi.useRealTimers()

    const debounce = Number(/const SEARCH_DEBOUNCE_MS = (\d+)/.exec(component)?.[1])
    expect(debounce).toBeGreaterThanOrEqual(250)
    expect(debounce).toBeLessThanOrEqual(350)
    expect(dataLayer).toMatch(/product\.capabilities, product\.applications/)
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
      product({ id: 100 + index, slug: `p-${index}`, title: `Product ${String(index).padStart(2, '0')}` }),
    )
    render(<ProductCatalog categories={categories} products={many} selection={{ family: null, industry: null }} />)

    expect(titles()).toHaveLength(15)
    expect(document.querySelector('.catalogue-count')?.textContent).toContain(
      'Showing 1 - 15 of 20 products',
    )
    const pages = Array.from(document.querySelectorAll('.catalogue-pager-page'))
    expect(pages.map((b) => b.textContent)).toEqual(['1', '2'])
    expect(pages[0].getAttribute('aria-current')).toBe('page')

    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(titles()).toHaveLength(5)
    expect(document.querySelector('.catalogue-count')?.textContent).toContain(
      'Showing 16 - 20 of 20 products',
    )

    // Nothing above the grid competes with the photography.
    expect(document.querySelector('.catalogue-bar ~ .catalogue-count')).toBeNull()
  })

  /*
   * A second view, shown while the pointer is over the card. An editor's own
   * pick when they have made one, otherwise the first gallery image that is
   * not already on the card -- so a product with photographs gets the effect
   * without anyone filing a second copy of them.
   */
  test('shows a second image on hover, from the field or the gallery', () => {
    render(
      <ProductCatalog
        categories={categories}
        products={[
          product({ hoverImage: { alt: '', url: '/api/media/file/second.png' }, id: 90, slug: 'two-views', title: 'Two Views' }),
          product({ id: 91, slug: 'one-view', title: 'One View' }),
        ]}
        selection={{ family: null, industry: null }}
      />,
    )

    const cards = Array.from(document.querySelectorAll('.catalogue-card'))
    expect(cards[0].querySelector('.catalogue-card-hover')).not.toBeNull()
    // Decorative: the card already names the product.
    expect(cards[0].querySelector('.catalogue-card-hover')?.getAttribute('aria-hidden')).toBe('true')
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
    expect(stylesheet).toMatch(/\.catalogue-card-fit \{\s*position: absolute;\s*inset: var\(--catalogue-card-pad\);/s)

    expect(dataLayer).toMatch(/const chosenHover = getMediaImage\(product\.cardHoverImage\)/)
    expect(dataLayer).toMatch(/\.find\(\(candidate\) => candidate && candidate\.url !== image\?\.url\)/)
    expect(stylesheet).toMatch(
      /\.catalogue-card-link:hover \.catalogue-card-hover[^{]*\{\s*opacity: 1;/s,
    )
  })

  /* The site default, overridden per product from the CMS for one that
     crowds its card or looks lost in it. */
  test('insets a card render by the site default, or the product’s own value', () => {
    render(
      <ProductCatalog
        categories={categories}
        products={[
          product({ id: 80, imagePadding: 22, slug: 'wide-one', title: 'Wide One' }),
          product({ id: 81, slug: 'default-one', title: 'Default One' }),
        ]}
        selection={{ family: null, industry: null }}
      />,
    )

    const canvases = Array.from(document.querySelectorAll('.catalogue-card-canvas')) as HTMLElement[]
    expect(canvases[0].style.getPropertyValue('--catalogue-card-pad')).toBe('22%')
    expect(canvases[1].getAttribute('style')).toBeNull()
    expect(dataLayer).toMatch(/imagePadding: product\.cardImagePadding \?\? null/)
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
    expect(stylesheet).toMatch(
      /\.catalogue-layout \{[^}]*padding: clamp\([^)]*\) 0 clamp\(/s,
    )
    expect(stylesheet).not.toMatch(
      /\.catalogue-layout \{[^}]*padding:[^;]*var\(--page-gutter\)/s,
    )
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

    expect(document.querySelector('.catalogue-intro')?.getAttribute('data-nav-surface')).toBe('dark')
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
    expect(stylesheet).toMatch(/\.catalogue-card-link:hover \.catalogue-card-fit img[^{]*\{\s*transform: scale\(1\.04\);/s)
    expect(stylesheet).toMatch(/\.catalogue-card-link:hover \.catalogue-card-body[^{]*\{\s*transform: translateY\(-3px\);/s)
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\.catalogue-card-fit img,/s)
    // A reference shelf, not a shop.
    // Nothing in the rendered card offers to sell anything.
    expect(document.querySelector('.catalogue-grid')?.textContent).not.toMatch(/price|add to|buy|in stock/i)
    expect(document.querySelector('.catalogue-card-link')?.getAttribute('href')).toBe(
      '/products/cargo-mail-cart',
    )
  })

  /*
   * One slug serves a product and a category. Products resolve first because
   * every card, menu and sitemap on the site already points here for them.
   */
  test('answers a category slug only where no product claims it', () => {
    expect(slugRoute).toMatch(/const product = await getProductBySlug\(slug\)/)
    expect(slugRoute).toMatch(/if \(!product\) \{[\s\S]*?findCategory\(view, slug\)/)
    expect(slugRoute).toMatch(/if \(!selection\) \{\s*notFound\(\)/)
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
    expect(stylesheet).toMatch(/@media \(min-width: 64rem\) \{[\s\S]*?\.catalogue-filter-button \{\s*display: none;/)

    fireEvent.click(screen.getByRole('button', { name: /Categories/ }))
    const drawer = screen.getByRole('dialog', { name: 'Product categories' })
    expect(drawer).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Product categories' })).toBeNull()
  })
})
