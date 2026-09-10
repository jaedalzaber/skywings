'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { RevealGroup } from '@/components/motion/Reveal'
import type { CatalogCategory, CatalogProduct } from '@/data/catalog'

import { ProductCatalogCard } from './ProductCatalogCard'

export type CatalogSelection = { family: string | null; industry: string | null }

/**
 * Long enough that a fast typist is not filtering seventy-five cards on every
 * keystroke, short enough that the grid still feels attached to the field.
 */
const SEARCH_DEBOUNCE_MS = 280

/** Three columns by five rows: a screenful, then a page break. */
const PAGE_SIZE = 15

const SORTS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'A–Z', value: 'az' },
  { label: 'Z–A', value: 'za' },
] as const

type Sort = (typeof SORTS)[number]['value']

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="catalogue-search-icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  )
}

function sortProducts(products: CatalogProduct[], sort: Sort): CatalogProduct[] {
  if (sort === 'featured') return products

  const sorted = [...products]

  if (sort === 'az') return sorted.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'za') return sorted.sort((a, b) => b.title.localeCompare(a.title))

  return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * The catalogue: a category tree on the left, a search and sort bar over a
 * grid of products on the right.
 *
 * Every product is handed over once and filtered in the browser. At this size
 * that is what makes the search instant -- there is no request between a
 * keystroke and the grid -- and it keeps a category change to a repaint rather
 * than a page load. If the catalogue grows past a few hundred products this is
 * the decision to revisit.
 */
export function ProductCatalog(props: {
  categories: CatalogCategory[]
  products: CatalogProduct[]
  selection: CatalogSelection
}) {
  const { categories, products } = props
  /*
   * Deep links from the header's Products menu arrive as ?industry=&family=.
   * Read through the framework's hook rather than the route's searchParams:
   * taking them on the server would opt /products out of cached rendering for
   * a filter this component applies in the browser anyway. A category page
   * passes its selection in as a prop instead, and that always wins.
   */
  const params = useSearchParams()
  const [selection, setSelection] = useState<CatalogSelection>(() =>
    props.selection.industry || props.selection.family
      ? props.selection
      : { family: params.get('family'), industry: params.get('industry') },
  )
  const [sort, setSort] = useState<Sort>('featured')
  const [term, setTerm] = useState('')
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string[]>(() => {
    const industry = props.selection.industry ?? params.get('industry')

    return industry ? [industry] : categories.slice(0, 1).map((category) => category.slug)
  })
  const searchId = useId()
  const sortId = useId()
  const drawerCloseRef = useRef<HTMLButtonElement>(null)

  // The field stays live while the grid waits out the debounce.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(term.trim().toLowerCase())
      setPage(0)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [term])

  useEffect(() => {
    if (!drawerOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    drawerCloseRef.current?.focus()

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const visible = useMemo(() => {
    const filtered = products.filter((product) => {
      if (selection.family && product.familySlug !== selection.family) return false
      if (selection.industry && !product.industrySlugs.includes(selection.industry)) return false

      return !query || product.search.includes(query)
    })

    return sortProducts(filtered, sort)
  }, [products, query, selection, sort])

  /*
   * Clamped rather than reset: a filter that shrinks the set would otherwise
   * strand the viewer on a page that no longer exists, and resetting on every
   * render would fight the pager itself.
   */
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const start = currentPage * PAGE_SIZE
  const shown = visible.slice(start, start + PAGE_SIZE)

  const activeCategory = categories.find((category) => category.slug === selection.industry)
  const activeChild = activeCategory?.children.find((child) => child.slug === selection.family)
  const title = activeChild?.title ?? activeCategory?.title ?? 'All products'

  /*
   * The address bar follows the sidebar so a filtered view can be sent to a
   * colleague, but through history rather than the router: re-rendering the
   * page on the server for a filter the browser has already applied would
   * undo the point of holding every product here.
   */
  const select = useCallback((next: CatalogSelection) => {
    setSelection(next)
    setDrawerOpen(false)
    setPage(0)

    if (typeof window === 'undefined') return

    const params = new URLSearchParams()
    if (next.industry) params.set('industry', next.industry)
    if (next.family) params.set('family', next.family)
    const search = params.toString()

    window.history.replaceState(null, '', `/products${search ? `?${search}` : ''}`)
  }, [])

  const toggle = (slug: string) =>
    setOpen((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    )

  const clearAll = () => {
    setTerm('')
    setQuery('')
    select({ family: null, industry: null })
  }

  const tree = (
    <nav aria-label="Product categories" className="catalogue-tree">
      <p className="catalogue-tree-heading">Categories</p>
      <button
        className="catalogue-tree-all"
        data-active={!selection.industry && !selection.family ? 'true' : undefined}
        onClick={() => select({ family: null, industry: null })}
        type="button"
      >
        All products
        <span className="catalogue-tree-count">{products.length}</span>
      </button>

      {categories.map((category) => {
        const expanded = open.includes(category.slug)

        return (
          <div className="catalogue-tree-group" key={category.slug}>
            <h3 className="catalogue-tree-parent-heading">
              <button
                aria-controls={`catalogue-group-${category.slug}`}
                aria-expanded={expanded}
                className="catalogue-tree-parent"
                data-active={
                  selection.industry === category.slug && !selection.family ? 'true' : undefined
                }
                onClick={() => {
                  toggle(category.slug)
                  select({ family: null, industry: category.slug })
                }}
                type="button"
              >
                <span>{category.title}</span>
                <span aria-hidden="true" className="catalogue-tree-toggle" data-open={expanded} />
              </button>
            </h3>

            {/*
             * Always rendered and collapsed with a 0fr grid row rather than
             * unmounted: the panel eases to its own height with no measured
             * pixel value, and stays out of the tab order while closed.
             */}
            <div
              className="catalogue-tree-panel"
              data-open={expanded ? 'true' : 'false'}
              id={`catalogue-group-${category.slug}`}
            >
              <ul className="catalogue-tree-children">
                {category.children.map((child) => (
                  <li key={child.slug}>
                    <button
                      className="catalogue-tree-child"
                      data-active={selection.family === child.slug ? 'true' : undefined}
                      onClick={() => select({ family: child.slug, industry: category.slug })}
                      tabIndex={expanded ? undefined : -1}
                      type="button"
                    >
                      {child.title}
                      <span className="catalogue-tree-count">{child.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </nav>
  )

  return (
    <>
      {/*
       * The dark band the bar sits over. It carries the title rather than the
       * page shell because the title follows the sidebar, and the sidebar
       * never reloads the page.
       */}
      <section className="catalogue-intro" data-nav-surface="dark">
        <div className="catalogue-intro-inner">
          <nav aria-label="Breadcrumb" className="catalogue-breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-hidden="true" className="catalogue-breadcrumb-sep">
                /
              </li>
              <li>
                {activeCategory ? (
                  <button
                    className="catalogue-breadcrumb-button"
                    onClick={() => select({ family: null, industry: null })}
                    type="button"
                  >
                    Products
                  </button>
                ) : (
                  <span aria-current="page">Products</span>
                )}
              </li>
              {activeCategory ? (
                <>
                  <li aria-hidden="true" className="catalogue-breadcrumb-sep">
                    /
                  </li>
                  <li>
                    {activeChild ? (
                      <button
                        className="catalogue-breadcrumb-button"
                        onClick={() => select({ family: null, industry: activeCategory.slug })}
                        type="button"
                      >
                        {activeCategory.title}
                      </button>
                    ) : (
                      <span aria-current="page">{activeCategory.title}</span>
                    )}
                  </li>
                </>
              ) : null}
              {activeChild ? (
                <>
                  <li aria-hidden="true" className="catalogue-breadcrumb-sep">
                    /
                  </li>
                  <li>
                    <span aria-current="page">{activeChild.title}</span>
                  </li>
                </>
              ) : null}
            </ol>
          </nav>
          <h1 className="catalogue-intro-title">{title}</h1>
        </div>
      </section>

      <div className="catalogue-layout" data-nav-surface="white">
        <aside className="catalogue-sidebar">{tree}</aside>

      <div className="catalogue-main">
        <div className="catalogue-bar">
          <button
            aria-expanded={drawerOpen}
            className="catalogue-filter-button"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            Categories
            <span aria-hidden="true">&#9662;</span>
          </button>

          <div className="catalogue-search" role="search">
            <label className="catalogue-visually-hidden" htmlFor={searchId}>
              Search products
            </label>
            <SearchIcon />
            <input
              autoComplete="off"
              className="catalogue-search-input"
              id={searchId}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search products..."
              type="search"
              value={term}
            />
            {term ? (
              <button
                aria-label="Clear search"
                className="catalogue-search-clear"
                onClick={() => {
                  setTerm('')
                  setQuery('')
                }}
                type="button"
              >
                <span aria-hidden="true">&#215;</span>
              </button>
            ) : null}
          </div>

          <div className="catalogue-sort">
            <label className="catalogue-sort-label" htmlFor={sortId}>
              Sort by
            </label>
            <div className="catalogue-select">
              <select
                id={sortId}
                onChange={(event) => {
                  setSort(event.target.value as Sort)
                  setPage(0)
                }}
                value={sort}
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="catalogue-select-chevron" />
            </div>
          </div>
        </div>

        {visible.length ? (
          /*
           * Keyed on the filter so a category change replays the reveal as a
           * crossfade rather than swapping cards in place under the pointer.
           */
          <>
            <RevealGroup
              amount={0}
              className="catalogue-grid"
              key={`${selection.industry ?? 'all'}-${selection.family ?? 'all'}-${query}-${currentPage}`}
              stagger={0.05}
            >
              {shown.map((product) => (
                <ProductCatalogCard key={product.id} product={product} />
              ))}
            </RevealGroup>

            {/*
             * The tally and the pager share the footer rather than sitting
             * above the grid: both answer "where am I in this set", which is
             * a question you have once you have reached the end of it.
             */}
            <div className="catalogue-footer">
              <p aria-live="polite" className="catalogue-count">
                Showing {start + 1} - {start + shown.length} of {visible.length}{' '}
                {visible.length === 1 ? 'product' : 'products'}
                {activeChild || activeCategory ? ` in ${title}` : null}
              </p>

              {pageCount > 1 ? (
                <nav aria-label="Catalogue pages" className="catalogue-pager">
                  <button
                    aria-label="Previous page"
                    className="catalogue-pager-step"
                    disabled={currentPage === 0}
                    onClick={() => setPage((value) => Math.max(0, value - 1))}
                    type="button"
                  >
                    <span aria-hidden="true">&#8249;</span>
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => (
                    <button
                      aria-current={index === currentPage ? 'page' : undefined}
                      aria-label={`Page ${index + 1}`}
                      className="catalogue-pager-page"
                      data-active={index === currentPage ? 'true' : undefined}
                      key={index}
                      onClick={() => setPage(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    aria-label="Next page"
                    className="catalogue-pager-step"
                    disabled={currentPage >= pageCount - 1}
                    onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                    type="button"
                  >
                    <span aria-hidden="true">&#8250;</span>
                  </button>
                </nav>
              ) : null}
            </div>
          </>
        ) : (
          <div className="catalogue-empty">
            <p className="catalogue-empty-title">No products match that search.</p>
            <p className="catalogue-empty-text">
              Try a broader term, another category, or ask us directly — we fabricate to
              specification as well as to catalogue.
            </p>
            <div className="catalogue-empty-actions">
              {query ? (
                <button
                  className="catalogue-empty-button"
                  onClick={() => {
                    setTerm('')
                    setQuery('')
                  }}
                  type="button"
                >
                  Clear search
                </button>
              ) : null}
              <button className="catalogue-empty-button" onClick={clearAll} type="button">
                View all products
              </button>
              <Link className="catalogue-empty-link" href="/contact">
                Request a quotation
              </Link>
            </div>
          </div>
        )}
      </div>

      {drawerOpen ? (
        <div className="catalogue-drawer" role="dialog" aria-label="Product categories">
          <div className="catalogue-drawer-panel">
            <div className="catalogue-drawer-head">
              <p className="catalogue-drawer-title">Categories</p>
              <button
                aria-label="Close categories"
                className="catalogue-drawer-close"
                onClick={() => setDrawerOpen(false)}
                ref={drawerCloseRef}
                type="button"
              >
                <span aria-hidden="true">&#215;</span>
              </button>
            </div>
            {tree}
          </div>
          <button
            aria-hidden="true"
            className="catalogue-drawer-scrim"
            onClick={() => setDrawerOpen(false)}
            tabIndex={-1}
            type="button"
          />
        </div>
      ) : null}
      </div>
    </>
  )
}
