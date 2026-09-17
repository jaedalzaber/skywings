import type { Product, ProductGalleryBlock } from '@/payload-types'

import { getMediaImage } from '@/data/media'
import { hasProductPage, pagesFirst } from '@/data/productReadiness'
import { relationId } from '@/data/relations'

import { ProductGallery, type GalleryFilter, type GalleryProduct } from './ProductGallery'
import { Reveal } from './Reveal'
import { MultilineHeading, SectionShell } from './SectionShell'
import { hasLink, headingId } from './shared'

/**
 * Resolves gallery entries against the Products collection on the server so
 * the client component receives plain, serialisable cards. Entries whose
 * product has been unpublished or deleted are dropped rather than rendered
 * as empty cards.
 */
export function ProductGallerySection(props: { block: ProductGalleryBlock }) {
  const { block } = props
  const id = headingId(block.id, 'industry-gallery')

  const listed: GalleryProduct[] = []

  block.items.forEach((item, index) => {
    if (typeof item.product !== 'object' || !item.product) {
      return
    }

    const product = item.product as Product
    const image =
      getMediaImage(item.imageOverride) ??
      getMediaImage(product.thumbnailImage) ??
      getMediaImage(product.featuredImage)

    listed.push({
      familyId: relationId(product.productFamily),
      featured: Boolean(item.featured),
      hasPage: hasProductPage(product),
      id: item.id ?? `${product.id}-${index}`,
      image,
      slug: product.slug,
      summary: product.summary ?? null,
      title: product.title,
    })
  })

  // Finished products lead; the editor's order holds within each group.
  const products = pagesFirst(listed, (product) => product.hasPage)

  if (products.length === 0) {
    return null
  }

  const filters: GalleryFilter[] = (block.filters ?? [])
    .filter((filter) => filter.label?.trim())
    .map((filter, index) => ({
      familyId: relationId(filter.productFamily),
      id: filter.id ?? `${filter.label}-${index}`,
      label: filter.label,
    }))

  const browse = hasLink(block.browseAction) ? block.browseAction : null

  return (
    <SectionShell
      anchorId={block.anchorId}
      className="industry-gallery"
      labelledBy={id}
      theme={block.theme}
    >
      <Reveal className="industry-gallery-head">
        <MultilineHeading className="industry-gallery-heading" id={id} value={block.heading} />
        {block.description ? (
          <p className="industry-gallery-description">{block.description}</p>
        ) : null}
      </Reveal>

      <ProductGallery
        browse={
          browse
            ? { href: browse.href, label: browse.label, openInNewTab: browse.openInNewTab }
            : null
        }
        filters={filters}
        products={products}
      />
    </SectionShell>
  )
}
