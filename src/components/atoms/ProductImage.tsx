'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ProductImagePlaceholder } from './ProductImagePlaceholder'

/**
 * Product image that falls back to the light placeholder when there is no
 * source or the image fails to load (e.g. missing media file), so a broken
 * image never shows.
 */
export function ProductImage(props: {
  alt: string
  label?: string
  priority?: boolean
  sizes: string
  url: string | null
}) {
  const { alt, label, priority, sizes, url } = props
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return <ProductImagePlaceholder label={label} />
  }

  return (
    <Image
      alt={alt}
      fill
      onError={() => setFailed(true)}
      priority={priority}
      sizes={sizes}
      src={url}
    />
  )
}
