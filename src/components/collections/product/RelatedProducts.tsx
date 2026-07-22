import Link from 'next/link'

import { ProductImage } from '@/components/atoms/ProductImage'
import type { Product } from '@/payload-types'

import { getMediaImage } from '@/data/media'

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
          const image = getMediaImage(product.featuredImage)

          return (
            <li className="pdp-related-card" key={product.id}>
              <Link href={`/products/${product.slug}`}>
                <span className="pdp-related-media">
                  <ProductImage
                    alt={image?.alt ?? `${product.title} product image`}
                    sizes="(min-width: 64rem) 12rem, 45vw"
                    url={image?.url ?? null}
                  />
                </span>
                <span className="pdp-related-name">{product.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
