'use client'

import './ProductThumbnailCell.scss'

/**
 * The product's card image, shown at the head of each row in the Products
 * list.
 *
 * Seventy-five rows of "GSE-PMC-P6-052" are hard to tell apart by name alone;
 * a thumbnail is how an editor finds the pallet they mean. It reads the same
 * pair the site's cards do -- the card thumbnail, else the featured image --
 * so what the list shows is what the catalogue will show.
 *
 * A row with neither gets a placeholder rather than a gap, which also makes
 * the products still missing photography visible at a glance.
 */
type MediaLike = {
  alt?: string | null
  thumbnailURL?: string | null
  url?: string | null
}

/*
 * The list view populates its relationships (the Product Family column shows
 * a title, not an id), so these arrive as documents. Narrowed rather than
 * trusted: a row read at depth 0 would hand over a bare id instead.
 */
function imageOf(value: unknown): MediaLike | null {
  return value && typeof value === 'object' ? (value as MediaLike) : null
}

export function ProductThumbnailCell(props: { rowData?: Record<string, unknown> }) {
  const row = props.rowData ?? {}
  const media = imageOf(row.thumbnailImage) ?? imageOf(row.featuredImage)
  // thumbnailURL is the admin's own small size; url is the original.
  const src = media?.thumbnailURL || media?.url || null

  if (!src) {
    return (
      <span className="product-thumb product-thumb--empty" title="No image">
        <svg aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
          <rect height="15" rx="1.5" width="19" x="2.5" y="4.5" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="m3.5 17 5-5 4.5 4.5 3-2.5 5 4" />
        </svg>
      </span>
    )
  }

  return (
    <span className="product-thumb">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin chrome, not a page image */}
      <img alt="" loading="lazy" src={src} />
    </span>
  )
}
