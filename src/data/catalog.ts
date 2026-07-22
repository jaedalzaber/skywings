import type {
  BlogPost,
  Brochure,
  Capability,
  Industry,
  Product,
  ProductFamily,
} from '@/payload-types'

import { getPayloadClient } from './payload'
import { relationArray, relationArrayIncludesSlug, relationId, relationSlug } from './relations'

export type ProductFilters = {
  family?: string
  industry?: string
  q?: string
  type?: string
}

function getText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function matchesSearch(product: Product, query?: string) {
  if (!query) {
    return true
  }

  const haystack = [product.title, product.sku, product.summary]
    .map(getText)
    .join(' ')
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

function matchesFamily(product: Product, family?: string) {
  if (!family) {
    return true
  }

  return relationSlug(product.productFamily) === family
}

function matchesIndustry(product: Product, industry?: string) {
  if (!industry) {
    return true
  }

  return relationArrayIncludesSlug(product.industries, industry)
}

function matchesType(product: Product, type?: string) {
  return type ? product.productType === type : true
}

async function getPublicModelForProduct(product: Product): Promise<Product['model3D'] | null> {
  if (product.model3D) return product.model3D

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'three-d-assets',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    sort: '-updatedAt',
    where: {
      and: [{ products: { contains: product.id } }, { isPublic: { equals: true } }],
    },
  })

  return docs[0] ?? null
}

export async function getCapabilities(): Promise<Capability[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'capabilities',
    depth: 1,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'sortOrder',
  })

  return docs
}

export async function getIndustries(): Promise<Industry[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'industries',
    depth: 1,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'sortOrder',
  })

  return docs
}

export async function getProductFamilies(): Promise<ProductFamily[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'product-families',
    depth: 1,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'sortOrder',
  })

  return docs
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 200,
    overrideAccess: false,
    sort: 'title',
  })

  return docs.filter(
    (product) =>
      matchesSearch(product, filters.q) &&
      matchesFamily(product, filters.family) &&
      matchesIndustry(product, filters.industry) &&
      matchesType(product, filters.type),
  )
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    depth: 3,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const product = docs[0] ?? null
  if (!product) return null

  const model3D = await getPublicModelForProduct(product)

  return model3D ? { ...product, model3D } : product
}

/**
 * Resolve the related products shown on a product detail page. Uses the
 * editor-curated `relatedProducts` when present, otherwise falls back to other
 * products in the same family, then to any other published products.
 */
export async function getRelatedProductsFor(product: Product, limit = 5): Promise<Product[]> {
  const curated = relationArray(product.relatedProducts).filter(
    (item): item is Product => typeof item === 'object' && item !== null,
  )

  if (curated.length) {
    return curated.slice(0, limit)
  }

  const payload = await getPayloadClient()
  const familyId = relationId(product.productFamily)

  if (familyId) {
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: limit + 1,
      overrideAccess: false,
      where: {
        and: [{ productFamily: { equals: familyId } }, { id: { not_equals: product.id } }],
      },
    })

    if (docs.length) {
      return docs.slice(0, limit)
    }
  }

  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: limit + 1,
    overrideAccess: false,
    sort: '-updatedAt',
    where: { id: { not_equals: product.id } },
  })

  return docs.slice(0, limit)
}

export async function getBrochures(): Promise<Brochure[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'brochures',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    sort: 'title',
  })

  return docs
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blog-posts',
    depth: 1,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: '-publishedAt',
  })

  return docs
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blog-posts',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return docs[0] ?? null
}
