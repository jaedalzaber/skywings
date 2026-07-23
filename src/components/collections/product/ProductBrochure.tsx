import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { DownloadIcon } from '@/components/atoms/icons'
import { getMediaImage } from '@/data/media'
import type { Brochure, Product } from '@/payload-types'

function firstBrochure(product: Product): Brochure | null {
  if (
    product.brochure &&
    typeof product.brochure === 'object' &&
    Boolean(product.brochure.url)
  ) {
    return product.brochure
  }

  const brochure = (product.brochures ?? []).find(
    (item): item is Brochure => typeof item === 'object' && item !== null && Boolean(item.url),
  )
  return brochure ?? null
}

export function ProductBrochure(props: { product: Product }) {
  const { product } = props
  const brochure = firstBrochure(product)
  const coverImage = getMediaImage(brochure?.coverImage)

  if (!brochure?.url) {
    return null
  }

  return (
    <section aria-labelledby="product-brochure-title" className="pdp-brochure">
      <div className="pdp-brochure-copy">
        <h2 className="pdp-section-title" id="product-brochure-title">
          Download Brochure
        </h2>
        <dl className="pdp-brochure-meta">
          {product.sku ? (
            <div>
              <dt>Product ID:</dt>
              <dd>{product.sku}</dd>
            </div>
          ) : null}
          {brochure.pageCount ? (
            <div>
              <dt>Pages:</dt>
              <dd>{brochure.pageCount}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <a
        aria-label={`Download ${brochure.title}`}
        className="pdp-brochure-cover-link"
        download
        href={brochure.url}
        rel="noreferrer"
        target="_blank"
      >
        <span className="pdp-brochure-cover">
          {coverImage ? (
            <Image
              alt={coverImage.alt}
              className="pdp-brochure-cover-image"
              fill
              sizes="(max-width: 767px) 38vw, 12rem"
              src={coverImage.url}
            />
          ) : (
            <span className="pdp-brochure-cover-fallback">{brochure.title}</span>
          )}
          <span className="pdp-brochure-download-icon">
            <DownloadIcon />
          </span>
        </span>
      </a>
    </section>
  )
}
