import type {
  BlogPost,
  Brochure,
  Capability,
  Industry,
  Product,
  ProductFamily,
} from '@/payload-types'

import { cachedQuery } from './cache'
import { getPayloadClient } from './payload'
import { relationArray, relationArrayIncludesSlug, relationId, relationSlug } from './relations'
import { TAGS } from './tags'

export type ProductFilters = {
  family?: string
  industry?: string
  q?: string
  type?: string
}

const productWithoutLayoutSelect = {
  layout: false,
} as const

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

export const getCapabilities = cachedQuery(
  async function fetchCapabilities(): Promise<Capability[]> {
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
  },
  ['capabilities'],
  [TAGS.capabilities, TAGS.media],
)

export const getIndustries = cachedQuery(
  async function fetchIndustries(): Promise<Industry[]> {
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
  },
  ['industries'],
  [TAGS.industries, TAGS.media],
)

export const getProductFamilies = cachedQuery(
  async function fetchProductFamilies(): Promise<ProductFamily[]> {
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
  },
  ['product-families'],
  [TAGS.products],
)

export const getProducts = cachedQuery(
  async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: 200,
      overrideAccess: false,
      select: productWithoutLayoutSelect,
      sort: 'title',
    })

    return docs.filter(
      (product) =>
        matchesSearch(product, filters.q) &&
        matchesFamily(product, filters.family) &&
        matchesIndustry(product, filters.industry) &&
        matchesType(product, filters.type),
    )
  },
  ['products'],
  [TAGS.products, TAGS.industries, TAGS.media],
)

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    depth: 3,
    draft: false,
    limit: 1,
    overrideAccess: false,
    select: productWithoutLayoutSelect,
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

export function getProductBySlug(slug: string): Promise<Product | null> {
  return cachedQuery(
    fetchProductBySlug,
    ['product-by-slug', slug],
    [TAGS.products, TAGS.product(slug), TAGS.media, TAGS.brochures, TAGS.threeD],
  )(slug)
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
      select: productWithoutLayoutSelect,
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
    select: productWithoutLayoutSelect,
    sort: '-updatedAt',
    where: { id: { not_equals: product.id } },
  })

  return docs.slice(0, limit)
}

export const getBrochures = cachedQuery(
  async function fetchBrochures(): Promise<Brochure[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'brochures',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'title',
    })

    return docs
  },
  ['brochures'],
  [TAGS.brochures, TAGS.media],
)

export const getBlogPosts = cachedQuery(
  async function fetchBlogPosts(): Promise<BlogPost[]> {
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
  },
  ['blog-posts'],
  [TAGS.blog, TAGS.media],
)

async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
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

export function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return cachedQuery(
    fetchBlogPostBySlug,
    ['blog-post-by-slug', slug],
    [TAGS.blog, TAGS.post(slug), TAGS.media],
  )(slug)
}

export const getAllProductSlugs = cachedQuery(
  async function fetchAllProductSlugs(): Promise<string[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
  },
  ['all-product-slugs'],
  [TAGS.products],
)

export const getAllBlogSlugs = cachedQuery(
  async function fetchAllBlogSlugs(): Promise<string[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'blog-posts',
      depth: 0,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
  },
  ['all-blog-slugs'],
  [TAGS.blog],
)
