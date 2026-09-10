'use client'

import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ButtonLink } from '@/components/atoms/ButtonLink'
import { ProductImage } from '@/components/atoms/ProductImage'
import type { MediaImage } from '@/data/media'

import { groupVariants, Reveal, REVEAL_VIEWPORT, revealVariants } from './Reveal'

export type GalleryProduct = {
  familyId: null | string
  featured: boolean
  id: string
  image: MediaImage | null
  sku: null | string
  slug: string
  summary: null | string
  title: string
}

export type GalleryFilter = {
  familyId: null | string
  id: string
  label: string
}

const ALL = '__all__'

/**
 * Filterable product rail with a raised, centred "featured" card.
 *
 * The featured card is moved to the middle of the visible set and the rail is
 * scrolled so it sits centred on screen, which is what gives the design its
 * spotlight composition without any absolute positioning. Filtering happens
 * entirely on the client from the pre-resolved product list, and each new
 * set of cards staggers back in.
 */
export function ProductGallery(props: {
  browse: null | { href: string; label: string; openInNewTab?: boolean | null }
  filters: GalleryFilter[]
  products: GalleryProduct[]
}) {
  const { browse, filters, products } = props
  const reduced = useReducedMotion() ?? false
  const [active, setActive] = useState(ALL)
  const railRef = useRef<HTMLUListElement>(null)

  const visible = useMemo(() => {
    const filter = filters.find((entry) => entry.id === active)
    const subset =
      filter && filter.familyId
        ? products.filter((product) => product.familyId === filter.familyId)
        : products

    return spotlight(subset)
  }, [active, filters, products])

  useEffect(() => {
    const rail = railRef.current
    const featured = rail?.querySelector<HTMLElement>('.industry-gallery-card.is-featured')
    if (!rail || !featured) return

    const target = featured.offsetLeft + featured.offsetWidth / 2 - rail.clientWidth / 2
    rail.scrollTo({ behavior: 'auto', left: Math.max(0, target) })
  }, [visible])

  return (
    <div className="industry-gallery-body">
      {filters.length > 0 ? (
        <Reveal
          className="industry-gallery-filters"
          delay={0.1}
          effect="fade"
        >
          <div aria-label="Filter products" role="group">
            <button aria-pressed={active === ALL} onClick={() => setActive(ALL)} type="button">
              All
            </button>
            {filters.map((filter) => (
              <button
                aria-pressed={active === filter.id}
                key={filter.id}
                onClick={() => setActive(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </Reveal>
      ) : null}

      {visible.length > 0 ? (
        <motion.ul
          className="industry-gallery-rail"
          initial="hidden"
          key={active}
          ref={railRef}
          variants={groupVariants(reduced, 0.07, 0.05)}
          viewport={REVEAL_VIEWPORT}
          whileInView="visible"
        >
          {visible.map((product) => (
            <motion.li
              className={['industry-gallery-card', product.featured ? 'is-featured' : '']
                .filter(Boolean)
                .join(' ')}
              key={product.id}
              variants={revealVariants(product.featured ? 'scale' : 'up', reduced, 0.9)}
            >
              <Link className="industry-gallery-card-link" href={`/products/${product.slug}`}>
                <h3 className="industry-gallery-card-title">{product.title}</h3>
                <span className="industry-gallery-card-media">
                  <ProductImage
                    alt={product.image?.alt ?? `${product.title} product image`}
                    sizes="(min-width: 48rem) 24rem, 70vw"
                    url={product.image?.url ?? null}
                  />
                </span>
                {product.summary ? (
                  <span className="industry-gallery-card-desc">{product.summary}</span>
                ) : null}
                {product.sku ? (
                  <span className="industry-gallery-card-sku">{product.sku}</span>
                ) : null}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <p className="industry-gallery-empty">No products in this category yet.</p>
      )}

      {browse ? (
        <Reveal className="industry-actions industry-gallery-action" delay={0.2}>
          <ButtonLink href={browse.href} openInNewTab={browse.openInNewTab}>
            {browse.label}
          </ButtonLink>
        </Reveal>
      ) : null}
    </div>
  )
}

/**
 * Puts exactly one featured card at the centre of the list. If the editor
 * flagged none, the middle card is promoted; if several, the first wins.
 */
function spotlight(products: GalleryProduct[]): GalleryProduct[] {
  if (products.length === 0) return products

  const flaggedIndex = products.findIndex((product) => product.featured)
  const middle = Math.floor(products.length / 2)
  const sourceIndex = flaggedIndex === -1 ? middle : flaggedIndex

  const rest = products
    .filter((_, index) => index !== sourceIndex)
    .map((product) => ({ ...product, featured: false }))
  const star = { ...products[sourceIndex], featured: true }

  rest.splice(middle, 0, star)

  return rest
}
