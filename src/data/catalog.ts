import type {
  BlogPost,
  Brochure,
  Capability,
  Industry,
  Product,
  ProductFamily,
} from '@/payload-types'

import { getPayloadClient } from './payload'
import { relationArrayIncludesSlug, relationSlug } from './relations'

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
    depth: 2,
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
