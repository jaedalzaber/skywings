import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { ProductImage } from '@/components/atoms/ProductImage'
import { RevealItem } from '@/components/motion/Reveal'
import { cardImageLayout } from '@/data/cardImageInset'
// The card as the grid receives it -- the search fields stay on the server.
import type { CatalogCard } from '@/data/catalogQuery'

/**
 * A catalogue card: a large light canvas for the product, its name, and the
 * family it is filed under. No price, no badge, no button -- this is a
 * reference shelf for engineers, and the photograph is the content.
 *
 * The whole card is one link, so the hit area matches what the hover state
 * suggests. Hover itself lives in the stylesheet rather than here: it has no
 * state to co-ordinate, and CSS keeps working on a card the script has not
 * reached yet.
 *
 * A product whose page is not written yet gets the same card with no link in
 * it: no hover, no second view, no "View product" -- nothing that promises a
 * page the click could not deliver.
 */
export function ProductCatalogCard(props: { product: CatalogCard }) {
  const { product } = props
  /*
   * The product's own inset when an editor has set one; the site default
   * otherwise. These are renders on no background, so they need room to read
   * as objects rather than as a texture -- and how much room depends on
   * whether the product is wide or small.
   */
  const layout = cardImageLayout(product.imageInset)

  const content: ReactNode = (
    <>
      <span
        className="catalogue-card-canvas"
        data-fill={layout.fill ? 'true' : undefined}
        style={layout.style as CSSProperties | undefined}
      >
        {/* Padded and fitted whole, unless the product is set to fill; the
            hover view below always fills. */}
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
        {product.hasPage && product.hoverImage ? (
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
        {product.hasPage ? (
          <span aria-hidden="true" className="catalogue-card-action">
            View product <span className="catalogue-card-arrow">&#8594;</span>
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <RevealItem as="article" className="catalogue-card">
      {product.hasPage ? (
        <Link className="catalogue-card-link" href={`/products/${product.slug}`}>
          {content}
        </Link>
      ) : (
        <div className="catalogue-card-static">{content}</div>
      )}
    </RevealItem>
  )
}
