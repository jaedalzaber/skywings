import { RichText, richTextIsEmpty } from '@/components/atoms/RichText'
import type { Product } from '@/payload-types'

export function ProductOverview(props: { product: Product }) {
  const { product } = props
  const hasDescription = !richTextIsEmpty(product.description)

  return (
    <section className="pdp-overview" aria-label="Product overview">
      {product.breadcrumb ? <p className="pdp-breadcrumb">{product.breadcrumb}</p> : null}

      <div className="pdp-overview-grid">
        <div className="pdp-overview-facts">
          {product.industryLabel || product.categoryLabel ? (
            <div className="pdp-overview-labels">
              {product.industryLabel ? <p>Industry: {product.industryLabel}</p> : null}
              {product.categoryLabel ? <p>Category: {product.categoryLabel}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="pdp-overview-description">
          {hasDescription ? <RichText value={product.description} /> : <p>{product.summary}</p>}
        </div>
      </div>
    </section>
  )
}
