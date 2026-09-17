'use client'

import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'

import { ButtonLink } from '@/components/atoms/ButtonLink'
import { ChevronRightIcon } from '@/components/atoms/icons'
import { ProductImage } from '@/components/atoms/ProductImage'
import type { MediaImage } from '@/data/media'

import { groupVariants, Reveal, REVEAL_VIEWPORT, revealVariants } from './Reveal'
import { useDraggableRail } from './useDraggableRail'

export type GalleryProduct = {
  familyId: null | string
  featured: boolean
  /** Whether the card links to a product page; see productReadiness. */
  hasPage: boolean
  id: string
  image: MediaImage | null
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

/** Long enough to read a card, short enough that the rail clearly moves. */
const AUTOPLAY_MS = 4200

/**
 * Filterable product carousel.
 *
 * One rail, dragged: the same GSAP engine the card carousel above it uses
 * (useDraggableRail), so mouse, touch, trackpad and keyboard all move through
 * the same card-edge snap points. It also advances on its own, and waits
 * whenever the reader is using it -- pointer over the rail, focus inside it,
 * a drag in progress, the tab hidden, the section off screen.
 *
 * Filtering happens on the client from the pre-resolved product list; each
 * new set of cards staggers back in and the rail re-measures itself.
 */
export function ProductGallery(props: {
  browse: null | { href: string; label: string; openInNewTab?: boolean | null }
  filters: GalleryFilter[]
  products: GalleryProduct[]
}) {
  const { browse, filters, products } = props
  const reduced = useReducedMotion() ?? false
  const [active, setActive] = useState(ALL)

  const visible = useMemo(() => {
    const filter = filters.find((entry) => entry.id === active)
    if (!filter?.familyId) return products
    return products.filter((product) => product.familyId === filter.familyId)
  }, [active, filters, products])

  const { edges, progress, step, trackRef, viewportRef } = useDraggableRail({
    autoplayMs: AUTOPLAY_MS,
    count: visible.length,
    itemSelector: '.industry-gallery-card',
    resetKey: active,
  })

  const showControls = visible.length > 1

  return (
    <div className="industry-gallery-body">
      {filters.length > 0 ? (
        <Reveal className="industry-gallery-filters" delay={0.1} effect="fade">
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
        <div className="industry-gallery-carousel">
          <motion.div
            className="industry-gallery-viewport"
            initial="hidden"
            ref={viewportRef}
            variants={groupVariants(reduced, 0.07, 0.05)}
            viewport={REVEAL_VIEWPORT}
            whileInView="visible"
          >
            <ul className="industry-gallery-rail" key={active} ref={trackRef}>
              {visible.map((product) => (
                <motion.li
                  className={['industry-gallery-card', product.featured ? 'is-featured' : '']
                    .filter(Boolean)
                    .join(' ')}
                  key={product.id}
                  variants={revealVariants('up', reduced, 0.9)}
                >
                  <CardLink hasPage={product.hasPage} slug={product.slug}>
                    <span className="industry-gallery-card-media">
                      <ProductImage
                        alt={product.image?.alt ?? `${product.title} product image`}
                        sizes="(min-width: 64rem) 20rem, (min-width: 48rem) 40vw, 70vw"
                        url={product.image?.url ?? null}
                      />
                    </span>
                    <span className="industry-gallery-card-body">
                      <h3 className="industry-gallery-card-title">{product.title}</h3>
                      {product.summary ? (
                        <span className="industry-gallery-card-desc">{product.summary}</span>
                      ) : null}
                      {product.hasPage ? (
                        <span className="industry-gallery-card-more">
                          View product
                          <ChevronRightIcon />
                        </span>
                      ) : null}
                    </span>
                  </CardLink>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {showControls ? (
            <div className="industry-gallery-controls">
              {/* How far along the rail is, and how much is left. */}
              <span aria-hidden="true" className="industry-gallery-progress">
                <span style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} />
              </span>
              <span className="industry-gallery-buttons">
                <button
                  aria-label="Previous products"
                  className="industry-gallery-control is-prev"
                  disabled={edges.atStart}
                  onClick={() => step(-1)}
                  type="button"
                >
                  <ChevronRightIcon />
                </button>
                <button
                  aria-label="Next products"
                  className="industry-gallery-control is-next"
                  disabled={edges.atEnd}
                  onClick={() => step(1)}
                  type="button"
                >
                  <ChevronRightIcon />
                </button>
              </span>
            </div>
          ) : null}
        </div>
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
 * The card's frame: a link to the product's page when it has one, otherwise
 * the same frame with nothing to follow.
 */
function CardLink(props: { children: ReactNode; hasPage: boolean; slug: string }) {
  const { children, hasPage, slug } = props

  return hasPage ? (
    <Link className="industry-gallery-card-link" draggable={false} href={`/products/${slug}`}>
      {children}
    </Link>
  ) : (
    <div className="industry-gallery-card-link" data-static="true">
      {children}
    </div>
  )
}
