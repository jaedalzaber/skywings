import Link from 'next/link'

import { ProductImage } from '@/components/atoms/ProductImage'
import type { Product } from '@/payload-types'

import { productCardImages } from '@/data/productCardImages'
import { hasProductPage } from '@/data/productReadiness'

export function RelatedProducts(props: { products: Product[] }) {
  const { products } = props

  if (!products.length) {
    return null
  }

  return (
    <section className="pdp-related" aria-label="Related products">
      <h2 className="pdp-section-title pdp-related-title">Related Products</h2>
      <ul className="pdp-related-grid">
        {products.map((product) => {
          /*
           * The card image every other product card uses: the thumbnail, else
           * the featured image. This read the featured image alone, and most
           * products have only a thumbnail -- so the related row was a line of
           * placeholders under a product whose shelf-mates all have renders.
           */
          const { image } = productCardImages(product)
          const hasPage = hasProductPage(product)
          const body = (
            <>
              <span className="pdp-related-media">
                <ProductImage
                  alt={image?.alt ?? `${product.title} product image`}
                  sizes="(min-width: 64rem) 12rem, 45vw"
                  url={image?.url ?? null}
                />
              </span>
              <span className="pdp-related-name">{product.title}</span>
            </>
          )

          // Only a product with a page of its own is a link.
          return (
            <li
              className="pdp-related-card"
              data-static={hasPage ? undefined : 'true'}
              key={product.id}
            >
              {hasPage ? (
                <Link href={`/products/${product.slug}`}>{body}</Link>
              ) : (
                <div className="pdp-related-link">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
