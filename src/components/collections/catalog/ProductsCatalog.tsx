'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { ArrowRightIcon } from '@/components/atoms/icons'

import { ProductShopCard, type ProductLite } from './ProductShopCard'

export type IndustryOption = { slug: string; title: string }

const PAGE_SIZE = 10
const SUGGESTION_LIMIT = 6

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="pcat-search-icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function productMatchesSearch(product: ProductLite, query: string) {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return true
  }

  return [product.title, product.sku, product.summary]
    .filter(Boolean)
    .some((value) => normalize(value).includes(normalizedQuery))
}

export function ProductsCatalog(props: {
  eyebrow?: string | null
  heading: string
  industries: IndustryOption[]
  initialIndustry?: string | null
  products: ProductLite[]
}) {
  const { eyebrow, heading, industries, initialIndustry, products } = props
  const [industry, setIndustry] = useState<string | null>(initialIndustry ?? null)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)

  useEffect(() => {
    if (initialIndustry !== undefined || typeof window === 'undefined') {
      return
    }

    const industryParam = new URLSearchParams(window.location.search).get('industry')

    if (industryParam) {
      setIndustry(industryParam)
      setPage(0)
    }
  }, [initialIndustry])

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (!industry || product.industrySlugs.includes(industry)) &&
          productMatchesSearch(product, search),
      ),
    [industry, products, search],
  )

  const suggestions = useMemo(() => {
    const query = normalize(search)

    if (!query) {
      return []
    }

    return products
      .filter((product) => productMatchesSearch(product, query))
      .slice(0, SUGGESTION_LIMIT)
  }, [products, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const select = (slug: string | null) => {
    setIndustry(slug)
    setPage(0)
  }

  const updateSearch = (value: string) => {
    setSearch(value)
    setPage(0)
    setSuggestionsOpen(Boolean(value.trim()))
  }

  const selectSuggestion = (product: ProductLite) => {
    setSearch(product.title)
    setPage(0)
    setSuggestionsOpen(false)
  }

  return (
    <section className="pcat" aria-label="Product catalogue">
      <header className="pcat-header">
        <div className="pcat-heading">
          {eyebrow ? <p className="pcat-eyebrow">{eyebrow}</p> : null}
          <h2 className="pcat-title">{heading}</h2>
        </div>
        <div className="pcat-header-aside">
          <Link className="pcat-browse-all" href="/contact">
            Request a product
          </Link>
          <p className="pcat-count">
            <strong>{products.length}</strong> Products in <strong>{industries.length}</strong>{' '}
            Industries
          </p>
        </div>
      </header>

      <div className="pcat-search" role="search">
        <label className="pcat-search-label" htmlFor="product-search">
          Search products
        </label>
        <div className="pcat-search-box">
          <input
            aria-autocomplete="list"
            aria-controls="product-search-suggestions"
            aria-expanded={suggestionsOpen && suggestions.length > 0}
            className="pcat-search-input"
            id="product-search"
            onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
            onChange={(event) => updateSearch(event.target.value)}
            onFocus={() => setSuggestionsOpen(Boolean(search.trim()))}
            placeholder="Search by product, SKU, or use"
            type="search"
            value={search}
          />
          {search ? (
            <button
              aria-label="Clear product search"
              className="pcat-search-clear"
              onClick={() => updateSearch('')}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
          <SearchIcon />
        </div>
        {suggestionsOpen && suggestions.length ? (
          <div className="pcat-suggestions" id="product-search-suggestions" role="listbox">
            {suggestions.map((product) => (
              <button
                className="pcat-suggestion"
                key={product.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(product)}
                role="option"
                type="button"
              >
                <span>{product.title}</span>
                {product.sku ? <small>{product.sku}</small> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {industries.length ? (
        <div className="pcat-filters" role="tablist" aria-label="Filter by industry">
          <button
            aria-pressed={!industry}
            className="pcat-filter"
            data-active={!industry ? '' : undefined}
            onClick={() => select(null)}
            type="button"
          >
            All
          </button>
          {industries.map((option) => (
            <button
              aria-pressed={industry === option.slug}
              className="pcat-filter"
              data-active={industry === option.slug ? '' : undefined}
              key={option.slug}
              onClick={() => select(option.slug)}
              type="button"
            >
              {option.title}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length ? (
        <div className="pcat-grid">
          {visible.map((product) => (
            <ProductShopCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="pcat-empty">No products match this search yet.</p>
      )}

      {pageCount > 1 ? (
        <div className="pcat-pagination">
          <span className="pcat-page-status">
            {safePage + 1} / {pageCount}
          </span>
          <button
            aria-label="Previous page"
            className="pcat-page-btn"
            disabled={safePage === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            type="button"
          >
            <span className="pcat-arrow-flip">
              <ArrowRightIcon />
            </span>
          </button>
          <button
            aria-label="Next page"
            className="pcat-page-btn"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            type="button"
          >
            <ArrowRightIcon />
          </button>
        </div>
      ) : null}
    </section>
  )
}
