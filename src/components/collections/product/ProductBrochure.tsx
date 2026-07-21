import { DownloadIcon } from '@/components/atoms/icons'
import type { Brochure, Product } from '@/payload-types'

function firstBrochure(product: Product): Brochure | null {
  const brochure = (product.brochures ?? []).find(
    (item): item is Brochure => typeof item === 'object' && item !== null && Boolean(item.url),
  )
  return brochure ?? null
}

export function ProductBrochure(props: { product: Product }) {
  const { product } = props
  const brochure = firstBrochure(product)

  if (!brochure?.url) {
    return null
  }

  return (
    <div className="pdp-brochure">
      <a
        className="pdp-brochure-link"
        download
        href={brochure.url}
        rel="noreferrer"
        target="_blank"
      >
        <span className="pdp-section-title">Download Brochure</span>
        <DownloadIcon className="pdp-brochure-icon" />
      </a>
    </div>
  )
}
