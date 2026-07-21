'use client'

import Image from 'next/image'
import { useState } from 'react'

import { MediaWireframe } from '@/components/atoms/MediaWireframe'

export type GalleryImage = { alt: string; url: string }

export function ProductGallery(props: { images: GalleryImage[]; title: string }) {
  const { images, title } = props
  const [active, setActive] = useState(0)
  const main = images[active] ?? images[0] ?? null

  return (
    <section aria-label={`${title} images`} className="pdp-hero">
      <div className="pdp-hero-media">
        {main ? (
          <Image
            alt={main.alt}
            fill
            priority
            sizes="(min-width: 64rem) 62.5rem, 100vw"
            src={main.url}
          />
        ) : (
          <MediaWireframe label="product visual" />
        )}
      </div>

      <div className="pdp-hero-bar">
        <h1 className="pdp-hero-title">{title}</h1>

        {images.length > 1 ? (
          <div className="pdp-hero-thumbs" role="tablist" aria-label="Product views">
            {images.map((image, index) => (
              <button
                aria-label={`Show view ${index + 1}`}
                aria-selected={index === active}
                className="pdp-thumb"
                data-active={index === active ? '' : undefined}
                key={image.url + index}
                onClick={() => setActive(index)}
                role="tab"
                type="button"
              >
                <Image alt={image.alt} fill sizes="8rem" src={image.url} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
