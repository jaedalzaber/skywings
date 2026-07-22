import type { Product } from '@/payload-types'

import { getMediaImage } from '@/data/media'
import { normalizeLightingPreset } from '@/lib/three/lightingPreset'

import { ProductBrochure } from './ProductBrochure'
import { ProductConfigurator } from './ProductConfigurator'
import { ProductGallery, type GalleryImage } from './ProductGallery'
import { ProductHowItWorks } from './ProductHowItWorks'
import type { ProductModel } from './viewer/types'
import { ProductOverview } from './ProductOverview'
import { ProductSpecs } from './ProductSpecs'
import { ProductTechnicalDrawing } from './ProductTechnicalDrawing'
import { RelatedProducts } from './RelatedProducts'

function buildGalleryImages(product: Product): GalleryImage[] {
  const images: GalleryImage[] = []
  const seen = new Set<string>()

  const push = (value: unknown) => {
    const image = getMediaImage(value)
    if (image && !seen.has(image.url)) {
      seen.add(image.url)
      images.push({ alt: image.alt, url: image.url })
    }
  }

  push(product.featuredImage)
  for (const item of product.gallery ?? []) {
    push(item.image)
  }

  return images
}

function buildMobileGalleryImages(product: Product): GalleryImage[] {
  const images: GalleryImage[] = []
  const seen = new Set<string>()

  const push = (value: unknown) => {
    const image = getMediaImage(value)
    if (image && !seen.has(image.url)) {
      seen.add(image.url)
      images.push({ alt: image.alt, url: image.url })
    }
  }

  for (const item of product.mobileGallery ?? []) {
    push(item.image)
  }

  return images
}

function buildModel(product: Product): ProductModel {
  const asset = product.model3D
  if (asset && typeof asset === 'object') {
    const camera = asset.defaultCamera
    return {
      actions: asset.viewerActions ?? ['auto-rotate', 'reset-view'],
      camera: [camera?.x ?? 3, camera?.y ?? 2, camera?.z ?? 4],
      lighting: normalizeLightingPreset(asset.lightingPreset),
      scale: asset.scale ?? 1,
      url: asset.url ?? null,
    }
  }
  return {
    actions: ['auto-rotate', 'reset-view'],
    camera: [3, 2, 4],
    lighting: normalizeLightingPreset(null),
    scale: 1,
    url: null,
  }
}

export function ProductDetail(props: { product: Product; related?: Product[] }) {
  const { product, related = [] } = props
  const images = buildGalleryImages(product)
  const mobileImages = buildMobileGalleryImages(product)
  const groups = product.configurationOptions ?? []

  return (
    <article className="pdp">
      <ProductGallery
        images={images}
        mobileImages={mobileImages}
        model={buildModel(product)}
        title={product.title}
      />

      <div className="pdp-body">
        <ProductOverview product={product} />

        {product.sku ? <p className="pdp-id">ID: {product.sku}</p> : null}

        <ProductHowItWorks product={product} />

        <ProductSpecs product={product} />

        <ProductTechnicalDrawing product={product} />

        <ProductBrochure product={product} />

        {groups.length ? (
          <ProductConfigurator groups={groups} quoteHref={`/contact?product=${product.slug}`} />
        ) : null}

        <RelatedProducts products={related} />
      </div>
    </article>
  )
}
