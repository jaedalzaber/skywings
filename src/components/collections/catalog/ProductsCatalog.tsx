'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { ArrowRightIcon } from '@/components/atoms/icons'

import { ProductShopCard, type ProductLite } from './ProductShopCard'

export type IndustryOption = { slug: string; title: string }

const PAGE_SIZE = 10

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

  const filtered = useMemo(
    () => (industry ? products.filter((product) => product.industrySlugs.includes(industry)) : products),
    [industry, products],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const select = (slug: string | null) => {
    setIndustry(slug)
    setPage(0)
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
        <p className="pcat-empty">No products match this filter yet.</p>
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
