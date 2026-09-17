'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { RevealGroup } from '@/components/motion/Reveal'
import type { CatalogCategory } from '@/data/catalog'
import {
  catalogHref,
  pagerWindow,
  type CatalogQuery,
  type CatalogResult,
  type CatalogSelection,
  type CatalogSort,
} from '@/data/catalogQuery'

import { ProductCatalogCard } from './ProductCatalogCard'

export type { CatalogSelection }

/**
 * Long enough that a fast typist is not sending a request on every keystroke,
 * short enough that the grid still feels attached to the field.
 */
const SEARCH_DEBOUNCE_MS = 280

/*
 * The sort menu is hidden for now, with the hidden attribute rather than left
 * out: it drops out of sight, the tab order and the accessibility tree, while
 * everything behind it keeps working -- a ?sort= link is honoured and the
 * catalogue keeps its default order. Showing it again is this one flag.
 */
const SHOW_SORT = false

const SORTS: { label: string; value: CatalogSort }[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'A–Z', value: 'az' },
  { label: 'Z–A', value: 'za' },
]

type WindowWithLenis = Window & {
  __skywingsLenis?: { scrollTo: (target: HTMLElement, options?: { duration?: number }) => void }
}

/**
 * Brings the top of the catalogue back under the header. Both Lenis and the
 * native fallback honour the element's scroll-margin-top, which is what
 * clears the sticky bar.
 */
function scrollToCatalogueTop(element: HTMLElement | null) {
  if (!element || typeof window === 'undefined') return

  const lenis = (window as WindowWithLenis).__skywingsLenis
  if (lenis) {
    lenis.scrollTo(element, { duration: 0.8 })
    return
  }

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

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

/** A click the browser should handle itself: a new tab, a new window, a download. */
function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

/**
 * The catalogue: a category tree on the left, a search and sort bar over a
 * grid of products on the right.
 *
 * Everything it shows is decided by the address. The route renders the page
 * the query string names -- category, search, sort, page -- and this component
 * only turns each control into a new address: a category or a page is a
 * history entry, so Back returns to it; search and sort replace the current
 * entry, so Back is not spent retracing every keystroke. Navigations run as a
 * transition, so the grid in view dims while the next one is fetched rather
 * than blanking.
 */
export function ProductCatalog(props: {
  /** Where this catalogue lives: /products, or a category's own page. */
  basePath: string
  categories: CatalogCategory[]
  /** Set on a category page, whose category is its path, not its query string. */
  pathSelection?: boolean
  query: CatalogQuery
  result: CatalogResult
  /** Every product in the catalogue, for the tree's "All products" count. */
  totalProducts: number
}) {
  const { basePath, categories, pathSelection = false, query, result, totalProducts } = props
  const selection: CatalogSelection = { family: query.family, industry: query.industry }
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [term, setTerm] = useState(query.q)
  /*
   * The search last put into the address by typing. When the address changes
   * to a search that is not this one -- Back, Forward, a suggestion -- the
   * field follows it; when it is this one, the field is left alone, because
   * the visitor may have typed on while the page was fetched.
   */
  const sentQuery = useRef(query.q)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [open, setOpen] = useState<string[]>(() =>
    query.industry ? [query.industry] : categories.slice(0, 1).map((category) => category.slug),
  )
  const searchId = useId()
  const sortId = useId()
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  /**
   * The address for this view with some of it changed. Leaving a category
   * page's own category goes to /products, since the path would otherwise
   * keep claiming the old one.
   */
  const hrefFor = useCallback(
    (next: Partial<CatalogQuery>) => {
      const merged = { ...query, ...next }
      const leavesPath =
        pathSelection && (merged.industry !== query.industry || merged.family !== query.family)

      return leavesPath
        ? catalogHref('/products', merged)
        : catalogHref(basePath, merged, { pathSelection })
    },
    [basePath, pathSelection, query],
  )

  const navigate = useCallback(
    (next: Partial<CatalogQuery>, options: { replace?: boolean } = {}) => {
      const href = hrefFor(next)
      startTransition(() => {
        if (options.replace) router.replace(href, { scroll: false })
        else router.push(href, { scroll: false })
      })
    },
    [hrefFor, router],
  )

  useEffect(() => {
    if (query.q === sentQuery.current) return
    sentQuery.current = query.q
    setTerm(query.q)
  }, [query.q])

  // The field stays live while the address waits out the debounce.
  useEffect(() => {
    const next = term.trim()
    if (next === sentQuery.current) return

    const timer = window.setTimeout(() => {
      sentQuery.current = next
      navigate({ page: 1, q: next }, { replace: true })
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [navigate, term])

  /** Sets the search at once, skipping the debounce: a suggestion, a clear. */
  const searchNow = (next: string, reset: Partial<CatalogQuery> = {}) => {
    setTerm(next)
    sentQuery.current = next
    navigate({ ...reset, page: 1, q: next }, { replace: true })
  }

  useEffect(() => {
    if (!drawerOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    drawerCloseRef.current?.focus()

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const { cards, elsewhere, page, pageCount, start, suggestion, total } = result

  /*
   * A pager link. A real href, so the page is reachable without script and a
   * new tab opens on it; a plain click is taken over to run as a transition
   * and bring the top of the grid back into view -- the pager sits under the
   * grid, so a new page would otherwise open at its last row.
   *
   * A render function, not a component declared in here: a component made
   * inside render is a new type every render, and React would remount each
   * link -- dropping focus from the one just pressed.
   */
  const pageLink = (link: {
    children: ReactNode
    className: string
    current?: boolean
    label: string
    target: number
  }) => (
    <Link
      aria-current={link.current ? 'page' : undefined}
      aria-label={link.label}
      className={link.className}
      data-active={link.current ? 'true' : undefined}
      href={hrefFor({ page: link.target })}
      onClick={(event) => {
        if (isModifiedClick(event)) return
        event.preventDefault()
        navigate({ page: link.target })
        scrollToCatalogueTop(mainRef.current)
      }}
      key={link.label}
      scroll={false}
    >
      {link.children}
    </Link>
  )

  const activeCategory = categories.find((category) => category.slug === selection.industry)
  const activeChild = activeCategory?.children.find((child) => child.slug === selection.family)
  const title = activeChild?.title ?? activeCategory?.title ?? 'All products'

  /*
   * A category is a new history entry, so Back returns to the one before. The
   * search and the order carry over; the page starts again from the first.
   */
  const select = (next: CatalogSelection) => {
    setDrawerOpen(false)
    navigate({ ...next, page: 1 })
  }

  const toggle = (slug: string) =>
    setOpen((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    )

  const clearAll = () => {
    setDrawerOpen(false)
    searchNow('', { family: null, industry: null })
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
        <span className="catalogue-tree-count">{totalProducts}</span>
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

        {/* Busy while the next view is fetched: the grid in view dims rather
          than blanking, and assistive tech hears that it is updating. */}
        <div
          aria-busy={pending || undefined}
          className="catalogue-main"
          data-pending={pending ? 'true' : undefined}
          ref={mainRef}
        >
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
                placeholder="Search by name, model number or use"
                type="search"
                value={term}
              />
              {term ? (
                <button
                  aria-label="Clear search"
                  className="catalogue-search-clear"
                  onClick={() => searchNow('')}
                  type="button"
                >
                  <span aria-hidden="true">&#215;</span>
                </button>
              ) : null}
            </div>

            <div className="catalogue-sort" hidden={!SHOW_SORT}>
              <label className="catalogue-sort-label" htmlFor={sortId}>
                Sort by
              </label>
              <div className="catalogue-select">
                <select
                  id={sortId}
                  onChange={(event) =>
                    navigate(
                      { page: 1, sort: event.target.value as CatalogSort },
                      { replace: true },
                    )
                  }
                  value={query.sort}
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === 'featured' && query.q ? 'Best match' : option.label}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true" className="catalogue-select-chevron" />
              </div>
            </div>
          </div>

          {cards.length ? (
            /*
             * Keyed on the filter so a category change replays the reveal as a
             * crossfade rather than swapping cards in place under the pointer.
             */
            <>
              <RevealGroup
                amount={0}
                className="catalogue-grid"
                key={`${selection.industry ?? 'all'}-${selection.family ?? 'all'}-${query.q}-${page}`}
                stagger={0.05}
              >
                {cards.map((product) => (
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
                  Showing {start + 1} - {start + cards.length} of {total}{' '}
                  {total === 1 ? 'product' : 'products'}
                  {activeChild || activeCategory ? ` in ${title}` : null}
                </p>

                {pageCount > 1 ? (
                  <nav aria-label="Catalogue pages" className="catalogue-pager">
                    {/* The ends are inert rather than links to themselves. */}
                    {page > 1 ? (
                      pageLink({
                        children: <span aria-hidden="true">&#8249;</span>,
                        className: 'catalogue-pager-step',
                        label: 'Previous page',
                        target: page - 1,
                      })
                    ) : (
                      <span aria-disabled="true" className="catalogue-pager-step">
                        <span aria-hidden="true">&#8249;</span>
                      </span>
                    )}
                    {pagerWindow(page, pageCount).map((entry, index) =>
                      entry === 'gap' ? (
                        <span
                          aria-hidden="true"
                          className="catalogue-pager-gap"
                          key={`gap-${index}`}
                        >
                          &#8230;
                        </span>
                      ) : (
                        pageLink({
                          children: entry,
                          className: 'catalogue-pager-page',
                          current: entry === page,
                          label: `Page ${entry}`,
                          target: entry,
                        })
                      ),
                    )}
                    {page < pageCount ? (
                      pageLink({
                        children: <span aria-hidden="true">&#8250;</span>,
                        className: 'catalogue-pager-step',
                        label: 'Next page',
                        target: page + 1,
                      })
                    ) : (
                      <span aria-disabled="true" className="catalogue-pager-step">
                        <span aria-hidden="true">&#8250;</span>
                      </span>
                    )}
                  </nav>
                ) : null}
              </div>
            </>
          ) : (
            <div className="catalogue-empty">
              <p className="catalogue-empty-title">
                {elsewhere
                  ? `Nothing in ${title} matches that search.`
                  : 'No products match that search.'}
              </p>
              {suggestion ? (
                <p className="catalogue-empty-text">
                  Did you mean{' '}
                  <button
                    className="catalogue-empty-suggestion"
                    onClick={() => searchNow(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                  ?
                </p>
              ) : (
                <p className="catalogue-empty-text">
                  Try a broader term, another category, or ask us directly — we fabricate to
                  specification as well as to catalogue.
                </p>
              )}
              <div className="catalogue-empty-actions">
                {elsewhere ? (
                  <button
                    className="catalogue-empty-button catalogue-empty-button--primary"
                    onClick={() => select({ family: null, industry: null })}
                    type="button"
                  >
                    Show {elsewhere} {elsewhere === 1 ? 'match' : 'matches'} in all products
                  </button>
                ) : null}
                {query.q ? (
                  <button
                    className="catalogue-empty-button"
                    onClick={() => searchNow('')}
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
