import type {
  BlogPost,
  Brochure,
  Capability,
  Industry,
  Machine,
  Product,
  ProductFamily,
} from '@/payload-types'

import { cachedQuery } from './cache'
import type { CardImageInset } from './cardImageInset'
import { productCardImages } from './productCardImages'
import { getPayloadClient } from './payload'
import {
  relationArray,
  relationArrayIncludesSlug,
  relationId,
  relationSlug,
  relationTitle,
} from './relations'
import { industryRank } from './productTaxonomy'
import { compareTitles, hasProductPage, pagesFirst } from './productReadiness'
import { TAGS } from './tags'
import type { SearchFields } from '@/lib/search/productSearch'

export type ProductFilters = {
  family?: string
  industry?: string
  q?: string
  type?: string
}

const productWithoutLayoutSelect = {
  layout: false,
} as const

/*
 * Description and gallery stay in, though no card shows them: together they
 * decide whether a card links to a page at all (see productReadiness).
 */
const productListSelect = {
  accessories: false,
  applications: false,
  breadcrumb: false,
  brochure: false,
  brochures: false,
  capabilities: false,
  categoryLabel: false,
  configurationOptions: false,
  dimensions: false,
  finishes: false,
  howItWorks: false,
  industryLabel: false,
  keySpecs: false,
  layout: false,
  loadCapacity: false,
  materials: false,
  mobileGallery: false,
  model3D: false,
  relatedCaseStudies: false,
  relatedProducts: false,
  specifications: false,
  surfaceTreatment: false,
  technicalDrawing: false,
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

function hasImage(value: unknown) {
  return Boolean(relationId(value))
}

function hasCardThumbnail(product: Product) {
  return hasImage(product.thumbnailImage)
}

/** Either image will carry a card; the thumbnail is only preferred. */
function hasCardImage(product: Product) {
  return hasImage(product.thumbnailImage) || hasImage(product.featuredImage)
}

/** Finished products first, then those with their own card image, then by name. */
function sortProductsForListing(products: Product[]) {
  return [...products].sort((a, b) => {
    const pageRank = Number(hasProductPage(b)) - Number(hasProductPage(a))
    if (pageRank !== 0) return pageRank

    const imageRank = Number(hasCardThumbnail(b)) - Number(hasCardThumbnail(a))
    if (imageRank !== 0) return imageRank

    return compareTitles(a.title, b.title)
  })
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

/*
 * The shop floor, for the capabilities page. Depth 1 resolves each machine's
 * photograph; the capability relationship comes back populated too, but only
 * its id is read -- the page groups machines under the process they belong to.
 */
export const getMachines = cachedQuery(
  async function fetchMachines(): Promise<Machine[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'machines',
      depth: 1,
      draft: false,
      limit: 200,
      overrideAccess: false,
      sort: 'sortOrder',
    })

    return docs
  },
  ['machines'],
  [TAGS.machines, TAGS.capabilities, TAGS.media],
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

    // Aviation first, the editor's order underneath it.
    return [...docs].sort((a, b) => industryRank(a.slug) - industryRank(b.slug))
  },
  ['industries-v2'],
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

export type ProductNavigationItem = {
  children: { href: string; label: string }[]
  href: string
  label: string
}

/**
 * Products dropdown: industries at the top level, each expanding to the
 * product families that name it in `industryFocus`.
 *
 * Industries with no families are dropped rather than rendered as an empty
 * branch -- four of the nine currently have none, and a menu entry that opens
 * into nothing reads as a broken link.
 */
/* The order comes from getIndustries now, which pins the same industries to
   the front of every listing on the site rather than only this menu. */

export const getProductNavigation = cachedQuery(
  async function fetchProductNavigation(): Promise<ProductNavigationItem[]> {
    const [industries, families] = await Promise.all([getIndustries(), getProductFamilies()])

    return industries
      .map((industry) => ({
        children: families
          .filter((family) => relationArrayIncludesSlug(family.industryFocus, industry.slug))
          .map((family) => ({
            href: `/products?industry=${industry.slug}&family=${family.slug}`,
            label: family.title,
          })),
        href: `/products?industry=${industry.slug}`,
        label: industry.title,
      }))
      .filter((item) => item.children.length > 0)
  },
  ['product-navigation'],
  [TAGS.products, TAGS.industries],
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
      select: productListSelect,
      sort: 'title',
    })

    return sortProductsForListing(
      docs.filter(
        (product) =>
          hasCardThumbnail(product) &&
          matchesSearch(product, filters.q) &&
          matchesFamily(product, filters.family) &&
          matchesIndustry(product, filters.industry) &&
          matchesType(product, filters.type),
      ),
    )
  },
  // v2: the read carries gallery and description, which decide hasProductPage.
  ['products', 'readiness-v2'],
  [TAGS.products, TAGS.industries, TAGS.media],
)

/** A card in the catalogue grid. */
export type CatalogProduct = {
  /** The family it is filed under, set under the name on the card. */
  category: string | null
  createdAt: string
  familySlug: string | null
  /**
   * Whether the card links to a product page. Without one it still takes its
   * place on the shelf, as a picture and a name, but leads nowhere.
   */
  hasPage: boolean
  id: number
  /**
   * The second image, shown while the pointer is over the card. An editor's
   * own pick when they have made one, otherwise the first gallery image that
   * is not already the one on the card -- so a product with photographs gets
   * the effect without anyone having to file a second copy of them.
   */
  hoverImage: { alt: string; url: string } | null
  image: { alt: string; url: string } | null
  /**
   * How far the product sits in from each edge of its card, as a percentage.
   * Null takes the site default: these are renders on no background, so they
   * need room to read as objects rather than as a texture, and how much room
   * depends on the product.
   */
  imageInset: CardImageInset | null
  industrySlugs: string[]
  /**
   * What the search field matches on, kept apart by where it came from --
   * name, model number, family, context, summary -- so the browser can rank a
   * match on the model number above a passing mention in a summary. Gathered
   * here once rather than on each keystroke.
   */
  searchFields: SearchFields
  slug: string
  title: string
}

export type CatalogCategoryChild = { count: number; slug: string; title: string }

/** A sidebar group: an industry and the families filed under it. */
export type CatalogCategory = {
  children: CatalogCategoryChild[]
  count: number
  slug: string
  title: string
}

export type CatalogView = {
  categories: CatalogCategory[]
  products: CatalogProduct[]
}

/*
 * Wider than the listing select: the catalogue searches across capabilities
 * and applications, so those relationships have to come back with the cards.
 * Everything a detail page needs and a card does not is still excluded --
 * bar the description, which decides whether the card links to that page.
 */
const catalogSelect = {
  accessories: false,
  breadcrumb: false,
  brochure: false,
  brochures: false,
  configurationOptions: false,
  dimensions: false,
  finishes: false,
  howItWorks: false,
  keySpecs: false,
  layout: false,
  loadCapacity: false,
  materials: false,
  mobileGallery: false,
  model3D: false,
  relatedCaseStudies: false,
  relatedProducts: false,
  specifications: false,
  surfaceTreatment: false,
  technicalDrawing: false,
} as const

function searchFieldsFor(product: Product): SearchFields {
  const related = [product.industries, product.capabilities, product.applications].flatMap(
    (value) => relationArray(value).map((item) => relationTitle(item, '')),
  )

  return {
    code: product.sku ?? null,
    context: [product.categoryLabel, product.industryLabel, ...related]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' '),
    family: relationTitle(product.productFamily, ''),
    summary: product.summary ?? '',
    title: product.title,
  }
}

/**
 * Everything the catalogue page renders, in one pass: the cards and the
 * sidebar tree they are grouped by.
 *
 * The tree is built from what the products actually carry rather than from
 * the full taxonomy -- an industry or a family with nothing filed under it is
 * dropped, because a category that opens onto an empty grid reads as a broken
 * page rather than as an empty shelf.
 */
export const getCatalogView = cachedQuery(
  async function fetchCatalogView(): Promise<CatalogView> {
    const payload = await getPayloadClient()
    const [{ docs }, industries, families] = await Promise.all([
      payload.find({
        collection: 'products',
        depth: 1,
        draft: false,
        limit: 300,
        overrideAccess: false,
        select: catalogSelect,
        sort: 'title',
      }),
      getIndustries(),
      getProductFamilies(),
    ])

    /*
     * A card needs a photograph, but not necessarily its own: only ten of the
     * seventy-five products carry a dedicated thumbnail, so the detail page's
     * featured image stands in. What is dropped is a product with no imagery
     * at all, which would leave a hole in a grid whose whole subject is the
     * product.
     */
    const products: CatalogProduct[] = sortProductsForListing(
      docs.filter((product) => hasCardImage(product)),
    ).map((product) => {
      // Shared with the home page's product rail; see productCardImages.
      const { hoverImage, image, imageInset } = productCardImages(product)

      return {
        category: relationTitle(product.productFamily, '') || null,
        createdAt: product.createdAt,
        familySlug: relationSlug(product.productFamily),
        hasPage: hasProductPage(product),
        hoverImage,
        imageInset,
        id: product.id,
        image: image ? { alt: image.alt, url: image.url } : null,
        industrySlugs: relationArray(product.industries)
          .map((item) => relationSlug(item))
          .filter((slug): slug is string => Boolean(slug)),
        searchFields: searchFieldsFor(product),
        slug: product.slug,
        title: product.title,
      }
    })

    const perFamily = new Map<string, number>()
    const perIndustry = new Map<string, number>()

    for (const product of products) {
      if (product.familySlug) {
        perFamily.set(product.familySlug, (perFamily.get(product.familySlug) ?? 0) + 1)
      }
      for (const slug of product.industrySlugs) {
        perIndustry.set(slug, (perIndustry.get(slug) ?? 0) + 1)
      }
    }

    const categories: CatalogCategory[] = industries
      .map((industry) => ({
        children: families
          .filter(
            (family) =>
              relationArrayIncludesSlug(family.industryFocus, industry.slug) &&
              (perFamily.get(family.slug) ?? 0) > 0,
          )
          .map((family) => ({
            count: perFamily.get(family.slug) ?? 0,
            slug: family.slug,
            title: family.title,
          })),
        count: perIndustry.get(industry.slug) ?? 0,
        slug: industry.slug,
        title: industry.title,
      }))
      .filter((category) => category.count > 0)

    return { categories, products }
  },
  // v3: cards carry hasPage, and finished products lead.
  ['catalog-view', 'card-has-page-v3'],
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
    return pagesFirst(curated, hasProductPage).slice(0, limit)
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
      select: productListSelect,
      where: {
        and: [{ productFamily: { equals: familyId } }, { id: { not_equals: product.id } }],
      },
    })

    if (docs.length) {
      return sortProductsForListing(docs).slice(0, limit)
    }
  }

  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: limit + 1,
    overrideAccess: false,
    select: productListSelect,
    sort: '-updatedAt',
    where: { id: { not_equals: product.id } },
  })

  return sortProductsForListing(docs).slice(0, limit)
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

/**
 * The products that have a page to prerender. The rest have nothing to show
 * there yet -- their address sends a visitor on to the catalogue instead.
 */
export const getProductPageSlugs = cachedQuery(
  async function fetchProductPageSlugs(): Promise<string[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { description: true, gallery: true, slug: true },
    })
    return docs
      .filter((doc) => hasProductPage(doc))
      .map((doc) => doc.slug)
      .filter((slug): slug is string => Boolean(slug))
  },
  ['product-page-slugs'],
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
