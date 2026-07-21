import Image from 'next/image'

import type { Product } from '@/payload-types'

import { getMediaImage } from '@/data/media'

export function ProductHowItWorks(props: { product: Product }) {
  const { product } = props
  const image = getMediaImage(product.howItWorks?.image)

  // Optional section — only rendered when an image has been uploaded.
  if (!image) {
    return null
  }

  const heading = product.howItWorks?.heading || 'How it works'

  return (
    <section className="pdp-how" aria-label={heading}>
      <div className="pdp-how-media">
        <Image
          alt={image.alt}
          height={image.height ?? 720}
          sizes="(min-width: 64rem) 62.5rem, 100vw"
          src={image.url}
          width={image.width ?? 1280}
        />
      </div>
      {product.howItWorks?.caption ? (
        <p className="pdp-how-caption">{product.howItWorks.caption}</p>
      ) : null}
    </section>
  )
}
