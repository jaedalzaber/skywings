'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { HomeIndustryProduct } from '@/data/home'

const fallbackImage = '/images/industries/product-placeholder.png'

function ProductCards(props: {
  ctaHref: string
  duplicate?: boolean
  products: HomeIndustryProduct[]
}) {
  const { ctaHref, duplicate = false, products } = props

  return products.map((product) => (
    <figure className="industries-showcase-product-card" key={`${product.id}-${duplicate}`}>
      <a
        className="industries-showcase-product-link"
        href={product.slug ? `/products/${product.slug}` : ctaHref}
        tabIndex={duplicate ? -1 : undefined}
      >
        <div className="industries-showcase-product-frame">
          <Image
            alt={duplicate ? '' : product.image?.alt || product.title}
            className="industries-showcase-product-image"
            fill
            loading="lazy"
            sizes="(max-width: 767px) 42vw, (max-width: 1439px) 18vw, 16vw"
            src={product.image?.url || fallbackImage}
          />
        </div>
        <figcaption>{product.title}</figcaption>
      </a>
    </figure>
  ))
}

export function IndustryProductRail(props: {
  anchorId?: string
  ctaHref: string
  products: HomeIndustryProduct[]
}) {
  const { anchorId, ctaHref, products } = props
  const railRef = useRef<HTMLDivElement>(null)
  const moves = products.length > 3
  const style = {
    '--industry-product-duration': `${Math.max(20, products.length * 5)}s`,
  } as CSSProperties

  useEffect(() => {
    const rail = railRef.current
    if (!rail || !moves || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        rail.dataset.inView = entry?.isIntersecting ? 'true' : 'false'
      },
      { threshold: 0.1 },
    )

    observer.observe(rail)
    return () => observer.disconnect()
  }, [moves])

  return (
    <div
      className="industries-showcase-product-grid"
      data-in-view={moves ? 'false' : undefined}
      data-moving={moves ? 'true' : undefined}
      id={anchorId}
      ref={railRef}
      style={style}
    >
      <div className="industries-showcase-product-track">
        <div className="industries-showcase-product-set">
          <ProductCards ctaHref={ctaHref} products={products} />
        </div>
        {moves ? (
          <div aria-hidden="true" className="industries-showcase-product-set">
            <ProductCards ctaHref={ctaHref} duplicate products={products} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
