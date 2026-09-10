import Link from 'next/link'
import type { CSSProperties } from 'react'

import { ProductImage } from '@/components/atoms/ProductImage'
import { RevealItem } from '@/components/motion/Reveal'
import type { CatalogProduct } from '@/data/catalog'

/**
 * A catalogue card: a large light canvas for the product, its name, and the
 * family it is filed under. No price, no badge, no button -- this is a
 * reference shelf for engineers, and the photograph is the content.
 *
 * The whole card is one link, so the hit area matches what the hover state
 * suggests. Hover itself lives in the stylesheet rather than here: it has no
 * state to co-ordinate, and CSS keeps working on a card the script has not
 * reached yet.
 */
export function ProductCatalogCard(props: { product: CatalogProduct }) {
  const { product } = props

  return (
    <RevealItem as="article" className="catalogue-card">
      <Link className="catalogue-card-link" href={`/products/${product.slug}`}>
        <span
          className="catalogue-card-canvas"
          /*
           * The product's own inset when an editor has set one; the site
           * default otherwise. These are renders on no background, so they
           * need room to read as objects rather than as a texture -- and how
           * much room depends on whether the product is wide or small.
           */
          style={
            product.imagePadding === null
              ? undefined
              : ({ '--catalogue-card-pad': `${product.imagePadding}%` } as CSSProperties)
          }
        >
          {/* Padded and fitted whole; the hover view below fills instead. */}
          <span className="catalogue-card-fit">
            <ProductImage
              alt={product.image?.alt ?? `${product.title} product image`}
              sizes="(min-width: 64rem) 22rem, (min-width: 48rem) 40vw, 90vw"
              url={product.image?.url ?? null}
            />
          </span>
          {/*
           * The second view, stacked over the first and revealed on hover.
           * Decorative: it is another angle on a product the card has already
           * named, so announcing it twice would only add noise.
           */}
          {product.hoverImage ? (
            <span aria-hidden="true" className="catalogue-card-hover">
              <ProductImage
                alt=""
                sizes="(min-width: 64rem) 22rem, (min-width: 48rem) 40vw, 90vw"
                url={product.hoverImage.url}
              />
            </span>
          ) : null}
        </span>
        <span className="catalogue-card-body">
          {/* The name alone. The family is how the grid is already grouped, so
              repeating it on every card only competes with the photograph. */}
          <span className="catalogue-card-title">{product.title}</span>
          <span aria-hidden="true" className="catalogue-card-action">
            View product <span className="catalogue-card-arrow">&#8594;</span>
          </span>
        </span>
      </Link>
    </RevealItem>
  )
}
