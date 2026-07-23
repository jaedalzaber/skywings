import type { Industry, Page, Product } from '@/payload-types'

import { cachedQuery } from './cache'
import { getMediaImage, type MediaImage } from './media'
import { getPayloadClient } from './payload'
import { relationArray, relationId } from './relations'
import { TAGS } from './tags'

export type LayoutBlock = NonNullable<Page['layout']>[number]
export type HomeLayoutSourceBlock = Extract<LayoutBlock, { blockType: `home${string}` }>
export type HomeHeroLayoutBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeHero' }>
type HomeIndustriesSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeIndustries' }>
export type HomeIndustryProduct = {
  id: number | string
  image: MediaImage | null
  slug: string
  summary: string
  title: string
}
export type HomeIndustryItem = HomeIndustriesSourceBlock['items'][number] & {
  ctaHref?: string
  heroImage?: MediaImage | null
  products?: HomeIndustryProduct[]
  slug?: string
  summary?: string
}
export type HomeIndustriesLayoutBlock = Omit<HomeIndustriesSourceBlock, 'items'> & {
  items: HomeIndustryItem[]
}
type HomeServicesSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeServices' }>
export type HomeServiceCard = Omit<
  NonNullable<HomeServicesSourceBlock['cards']>[number],
  'image'
> & {
  fallbackImage: string
  image?: MediaImage | null
}
export type HomeServicesLayoutBlock = Omit<HomeServicesSourceBlock, 'cards'> & {
  cards: HomeServiceCard[]
}
export type HomeProcessLayoutBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeProcess' }>
export type HomeLayout = (
  HomeHeroLayoutBlock | HomeServicesLayoutBlock | HomeIndustriesLayoutBlock | HomeProcessLayoutBlock
)[]

const productWithoutLayoutSelect = {
  layout: false,
} as const

const homeLayoutWithoutServicesSelect = {
  layout: {
    homeServices: false,
  },
} as const

export const defaultHeroPreviewItems: NonNullable<HomeHeroLayoutBlock['previewItems']> = [
  { title: 'CNC machining' },
  { title: 'Sheet metal processing' },
  { title: 'Pipe bending' },
  { title: 'Fabrication' },
]

const defaultHomeServiceCards: HomeServiceCard[] = [
  {
    fallbackImage: '/images/home/service-01.png',
    image: null,
    title: 'Custom Equipment Manufacturing',
  },
  {
    fallbackImage: '/images/home/service-02.png',
    image: null,
    title: 'Structural Steel Fabrication',
  },
  {
    fallbackImage: '/images/home/service-03.png',
    image: null,
    title: 'Metal Product Fabrication',
  },
  {
    fallbackImage: '/images/home/service-04.png',
    image: null,
    title: 'Custom Equipment Manufacturing',
  },
  {
    accentTitle: true,
    fallbackImage: '/images/home/service-05.png',
    image: null,
    title: 'Erection',
  },
]

export const defaultHomeServicesBlock: HomeServicesLayoutBlock = {
  blockType: 'homeServices',
  cards: defaultHomeServiceCards,
  description:
    'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
  eyebrow: 'Our Services',
  heading: 'What We Do',
  secondaryDescription: 'Our services cover every major stage of metal production under one roof.',
}

export const defaultHomeLayout: HomeLayout = [
  {
    blockType: 'homeHero',
    eyebrow: 'End-to-end metal manufacturing',
    heading: 'From drawing, sample, or problem to manufactured product.',
    description:
      'Sky Wings brings CNC machining, sheet metal processing, pipe bending, fabrication, welding, assembly, and surface treatment into one connected manufacturing system.',
    primaryLabel: 'Request Quote',
    primaryHref: '/contact',
    secondaryLabel: 'View products',
    secondaryHref: '/products',
    previewHeading: 'Manufacturing under one roof',
    previewItems: defaultHeroPreviewItems,
  },
  defaultHomeServicesBlock,
  {
    blockType: 'homeIndustries',
    eyebrow: 'Industries We Serve',
    heading: 'Metalwork Solutions Across Every Industries',
    description: 'End-to-end metal manufacturing for sector-specific products and assemblies.',
    items: [
      'Construction & Infrastructure',
      'Architectural & Interior Metalwork',
      'Heavy Equipment & Machinery',
      'Aviation Ground Support Equipment',
      'Industrial Manufacturing',
      'Marine & Offshore',
    ].map((title) => ({
      title,
      meta: 'Products, applications, related assemblies',
    })),
  },
  {
    blockType: 'homeProcess',
    eyebrow: 'Manufacturing process',
    heading: 'Our Manufacturing Process',
    steps: [
      'Client Brief',
      'Mechanical CAD Design',
      'Laser Cutting & Machining',
      'Welding & Erection',
      'Surface Painting & Finishings',
      'Final Delivery',
    ].map((title) => ({ title })),
  },
]

export function isHomeBlock(block: LayoutBlock): block is HomeLayoutSourceBlock {
  return block.blockType.startsWith('home')
}

function asProduct(value: unknown): Product | null {
  return typeof value === 'object' && value ? (value as Product) : null
}

function toHomeProduct(product: Product): HomeIndustryProduct {
  return {
    id: product.id,
    image: getMediaImage(product.featuredImage),
    slug: product.slug,
    summary: product.summary,
    title: product.title,
  }
}

async function getFallbackProductsForIndustry(industry: Industry, excludedIds: Set<string>) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: 3,
    overrideAccess: false,
    select: productWithoutLayoutSelect,
    sort: 'title',
    where: {
      industries: {
        contains: industry.id,
      },
    },
  })

  return docs.filter((product) => !excludedIds.has(String(product.id))).map(toHomeProduct)
}

async function getHomeIndustryItems(): Promise<HomeIndustryItem[]> {
  const payload = await getPayloadClient()
  const { docs: industries } = await payload.find({
    collection: 'industries',
    depth: 2,
    draft: false,
    limit: 6,
    overrideAccess: false,
    sort: 'sortOrder',
  })

  return Promise.all(
    industries.map(async (industry) => {
      const relatedProducts = relationArray(industry.relatedProducts)
        .map(asProduct)
        .filter((product): product is Product => Boolean(product))

      const curatedProducts = relatedProducts.slice(0, 3).map(toHomeProduct)
      const excludedIds = new Set(
        relatedProducts
          .map((product) => relationId(product))
          .filter((id): id is string => Boolean(id)),
      )
      const fallbackProducts =
        curatedProducts.length < 3
          ? await getFallbackProductsForIndustry(industry, excludedIds)
          : []
      const products = [...curatedProducts, ...fallbackProducts].slice(0, 3)

      return {
        ctaHref: `/products?industry=${industry.slug}`,
        heroImage: getMediaImage(industry.heroImage),
        id: String(industry.id),
        meta: 'Products, applications, related assemblies',
        products,
        slug: industry.slug,
        summary: industry.summary,
        title: industry.title,
      }
    }),
  )
}

async function syncHomeIndustriesBlock(block: HomeIndustriesLayoutBlock) {
  const items = await getHomeIndustryItems()

  return items.length ? { ...block, items } : block
}

function mediaFromServiceCard(
  card: HomeServiceCard | NonNullable<HomeServicesSourceBlock['cards']>[number],
) {
  if ('fallbackImage' in card) {
    return card.image ?? null
  }

  return getMediaImage(card.image)
}

function syncHomeServicesBlock(block: HomeServicesSourceBlock): HomeServicesLayoutBlock {
  const sourceCards = block.cards?.length ? block.cards : defaultHomeServiceCards

  return {
    ...block,
    cards: sourceCards.map((card, index) => {
      const fallback = defaultHomeServiceCards[index] ?? defaultHomeServiceCards[0]

      return {
        ...card,
        accentTitle: card.accentTitle ?? fallback.accentTitle ?? false,
        fallbackImage: fallback.fallbackImage,
        image: mediaFromServiceCard(card),
        title: card.title || fallback.title,
      }
    }),
    description: block.description || defaultHomeServicesBlock.description,
    eyebrow: block.eyebrow || defaultHomeServicesBlock.eyebrow,
    heading: block.heading || defaultHomeServicesBlock.heading,
    secondaryDescription:
      block.secondaryDescription || defaultHomeServicesBlock.secondaryDescription,
  }
}

async function syncHomeBlock(block: HomeLayoutSourceBlock): Promise<HomeLayout[number]> {
  if (block.blockType === 'homeIndustries') {
    return syncHomeIndustriesBlock(block as HomeIndustriesLayoutBlock)
  }

  if (block.blockType === 'homeServices') {
    return syncHomeServicesBlock(block)
  }

  return block
}

function ensureHomeServicesBlock(layout: HomeLayout): HomeLayout {
  if (layout.some((block) => block.blockType === 'homeServices')) {
    return layout
  }

  const nextLayout = [...layout]
  const heroIndex = nextLayout.findIndex((block) => block.blockType === 'homeHero')
  nextLayout.splice(heroIndex >= 0 ? heroIndex + 1 : 0, 0, defaultHomeServicesBlock)

  return nextLayout
}

async function fetchHomeLayout(): Promise<HomeLayout> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'pages',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    select: homeLayoutWithoutServicesSelect,
    where: {
      slug: {
        equals: 'home',
      },
    },
  })

  const layout = docs[0]?.layout?.filter(isHomeBlock) ?? []

  if (layout.length === 0) {
    return defaultHomeLayout
  }

  const syncedLayout = await Promise.all(layout.map(syncHomeBlock))

  return ensureHomeServicesBlock(syncedLayout)
}

const getCachedHomeLayout = cachedQuery(
  fetchHomeLayout,
  ['home-layout'],
  [TAGS.pages, TAGS.page('home'), TAGS.industries, TAGS.products, TAGS.media],
)

export async function getHomeLayout(): Promise<HomeLayout> {
  try {
    return await getCachedHomeLayout()
  } catch (error) {
    console.error('Unable to load Payload home page layout', error)

    return defaultHomeLayout
  }
}
