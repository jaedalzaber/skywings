import type { Product } from '@/payload-types'

import { resolveCardImageInset, type CardImageInset } from './cardImageInset'
import { getMediaImage, type MediaImage } from './media'

export type CardImage = { alt: string; url: string }

/** What a product card needs from the product to show it. */
export type ProductCardImages = {
  /**
   * The second image, shown while the pointer is over the card. An editor's
   * own pick when they have made one, otherwise the first gallery image that
   * is not already the one on the card -- so a product with photographs gets
   * the effect without anyone having to file a second copy of them.
   */
  hoverImage: CardImage | null
  /** The card image: the dedicated thumbnail, else the detail page's photo. */
  image: MediaImage | null
  /**
   * How far the product sits in from each edge of its card, as the editor set
   * it ('Card image padding'). Null takes the card's own default.
   */
  imageInset: CardImageInset | null
}

/**
 * A product's card images, decided once for every card on the site. The
 * catalogue grid and the home page's product rail both read this, so a
 * thumbnail, a hover pick or a padding set in the admin looks the same
 * wherever the product is shown.
 */
export function productCardImages(
  product: Pick<
    Product,
    | 'cardHoverImage'
    | 'cardImagePadding'
    | 'cardImagePaddingBottom'
    | 'cardImagePaddingLeft'
    | 'cardImagePaddingRight'
    | 'cardImagePaddingTop'
    | 'featuredImage'
    | 'gallery'
    | 'thumbnailImage'
  >,
): ProductCardImages {
  const image = getMediaImage(product.thumbnailImage) ?? getMediaImage(product.featuredImage)
  const chosenHover = getMediaImage(product.cardHoverImage)
  const galleryHover = (product.gallery ?? [])
    .map((entry) => getMediaImage(entry.image))
    .find((candidate) => candidate && candidate.url !== image?.url)
  const hover = chosenHover ?? galleryHover ?? null

  return {
    hoverImage: hover ? { alt: hover.alt, url: hover.url } : null,
    image,
    imageInset: resolveCardImageInset(product),
  }
}
