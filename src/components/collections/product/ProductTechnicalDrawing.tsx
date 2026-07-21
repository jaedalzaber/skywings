import Image from 'next/image'

import type { Product } from '@/payload-types'

import { getMediaImage } from '@/data/media'

import { Collapsible } from './Collapsible'

export function ProductTechnicalDrawing(props: { product: Product }) {
  const { product } = props
  const image = getMediaImage(product.technicalDrawing)

  if (!image) {
    return null
  }

  return (
    <Collapsible title="Technical Drawing">
      <div className="pdp-drawing">
        <Image
          alt={image.alt}
          height={image.height ?? 720}
          sizes="(min-width: 64rem) 62.5rem, 100vw"
          src={image.url}
          width={image.width ?? 1280}
        />
      </div>
    </Collapsible>
  )
}
