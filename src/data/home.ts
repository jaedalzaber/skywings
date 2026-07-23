import type { Industry, Page, Product } from '@/payload-types'

import { cachedQuery } from './cache'
import { getMediaFile, getMediaImage, isMediaVideo, type MediaFile, type MediaImage } from './media'
import { getPayloadClient } from './payload'
import { relationArray, relationId } from './relations'
import { TAGS } from './tags'

export type LayoutBlock = NonNullable<Page['layout']>[number]
export type HomeLayoutSourceBlock = Extract<LayoutBlock, { blockType: `home${string}` }>
type HomeHeroSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeHero' }>
export type HomeHeroLayoutBlock = Omit<
  HomeHeroSourceBlock,
  | 'desktopCoverImage'
  | 'desktopCoverVideo'
  | 'laptopCoverImage'
  | 'laptopCoverVideo'
  | 'mobileCoverImage'
  | 'mobileCoverVideo'
> & {
  desktopCoverImage?: MediaImage | null
  desktopCoverVideo?: MediaFile | null
  laptopCoverImage?: MediaImage | null
  laptopCoverVideo?: MediaFile | null
  mobileCoverImage?: MediaImage | null
  mobileCoverVideo?: MediaFile | null
}
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
type HomeProcessSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeProcess' }>
type HomeProcessSourceStep = NonNullable<HomeProcessSourceBlock['steps']>[number]
export type HomeProcessStep = Omit<HomeProcessSourceStep, 'infographicImage'> & {
  infographicImage?: MediaImage | null
}
export type HomeProcessLayoutBlock = Omit<HomeProcessSourceBlock, 'model3D' | 'steps'> & {
  model3D?: MediaFile | null
  steps: HomeProcessStep[]
}
export type HomeLayout = (
  HomeHeroLayoutBlock | HomeServicesLayoutBlock | HomeIndustriesLayoutBlock | HomeProcessLayoutBlock
)[]

const productWithoutLayoutSelect = {
  layout: false,
} as const

const legacyHomeCopy = new Map([
  [
    'From drawing, sample, or problem to manufactured product.',
    'Metal products engineered, fabricated, and delivered to spec.',
  ],
  [
    'Sky Wings brings CNC machining, sheet metal processing, pipe bending, fabrication, welding, assembly, and surface treatment into one connected manufacturing system.',
    'Sky Wings helps contractors, factories, aviation teams, and industrial buyers turn drawings, samples, and custom requirements into reliable finished metalwork.',
  ],
  ['Request Quote', 'Start an RFQ'],
  ['View products', 'Explore products'],
  ['Manufacturing under one roof', 'Built for complex requirements'],
  ['Our Services', 'Manufacturing services'],
  ['What We Do', 'One partner from design to delivery'],
  [
    'Sky Wings provides End-to-End Metal Manufacturing. We take a requirement - a drawing, a sample, a concept, or a problem to solve - and convert it into a manufactured product.',
    'Send us a drawing, sample, concept, or production challenge. Our team turns it into engineered metal parts, assemblies, and finished products ready for site, shop floor, or fleet use.',
  ],
  [
    'Our services cover every major stage of metal production under one roof.',
    'CNC machining, sheet metal, pipe bending, fabrication, welding, assembly, finishing, and installation all managed under one roof.',
  ],
  ['Industries We Serve', 'Industries we serve'],
  [
    'Metalwork Solutions Across Every Industries',
    'Metalwork built around your industry requirements.',
  ],
  [
    'One product database, multiple industry views.',
    'Metalwork built around your industry requirements.',
  ],
  [
    'End-to-end metal manufacturing for sector-specific products and assemblies.',
    'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
  ],
  [
    'Buyers can browse by sector, then move into relevant product families, catalogues, 3D previews, and quote requests.',
    'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
  ],
])

function replaceLegacyHomeCopy(
  value: string | null | undefined,
  fallback: string | null | undefined = '',
): string {
  if (!value) {
    return fallback ?? ''
  }

  return legacyHomeCopy.get(value) ?? value
}

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
    'Send us a drawing, sample, concept, or production challenge. Our team turns it into engineered metal parts, assemblies, and finished products ready for site, shop floor, or fleet use.',
  eyebrow: 'Manufacturing services',
  heading: 'One partner from design to delivery',
  secondaryDescription:
    'CNC machining, sheet metal, pipe bending, fabrication, welding, assembly, finishing, and installation all managed under one roof.',
}

export const defaultHomeLayout: HomeLayout = [
  {
    blockType: 'homeHero',
    eyebrow: 'End-to-end metal manufacturing',
    heading: 'Metal products engineered, fabricated, and delivered to spec.',
    description:
      'Sky Wings helps contractors, factories, aviation teams, and industrial buyers turn drawings, samples, and custom requirements into reliable finished metalwork.',
    primaryLabel: 'Start an RFQ',
    primaryHref: '/contact',
    secondaryLabel: 'Explore products',
    secondaryHref: '/products',
    previewHeading: 'Built for complex requirements',
    previewItems: defaultHeroPreviewItems,
  },
  defaultHomeServicesBlock,
  {
    blockType: 'homeIndustries',
    eyebrow: 'Industries we serve',
    heading: 'Metalwork built around your industry requirements.',
    description:
      'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
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
    modelAppearance: {
      fadeEnd: 12,
      fadeStart: 5.5,
      lineOpacity: 0.3,
      lineThickness: 0.65,
    },
    model3D: null,
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

function toHomeProduct(product: Product): HomeIndustryProduct {
  return {
    id: product.id,
    image: getMediaImage(product.thumbnailImage) ?? getMediaImage(product.featuredImage),
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
    limit: 12,
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

async function getCuratedProductsById(productIds: string[]) {
  if (!productIds.length) {
    return []
  }

  const payload = await getPayloadClient()
  const numericProductIds = productIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))

  if (!numericProductIds.length) {
    return []
  }

  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit: numericProductIds.length,
    overrideAccess: false,
    select: productWithoutLayoutSelect,
    where: {
      id: {
        in: numericProductIds,
      },
    },
  })

  const productsById = new Map(docs.map((product) => [String(product.id), product]))

  return productIds
    .map((id) => productsById.get(id))
    .filter((product): product is Product => Boolean(product))
    .map(toHomeProduct)
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
      const relatedProductIds = relationArray(industry.relatedProducts)
        .map(relationId)
        .filter((id): id is string => Boolean(id))
        .slice(0, 12)
      const curatedProducts = await getCuratedProductsById(relatedProductIds)
      const excludedIds = new Set(relatedProductIds)
      const fallbackProducts =
        curatedProducts.length < 3
          ? await getFallbackProductsForIndustry(industry, excludedIds)
          : []
      const products = [...curatedProducts, ...fallbackProducts].slice(0, 12)

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
  const syncedBlock = {
    ...block,
    description: replaceLegacyHomeCopy(
      block.description,
      'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
    ),
    eyebrow: replaceLegacyHomeCopy(block.eyebrow, 'Industries we serve'),
    heading: replaceLegacyHomeCopy(
      block.heading,
      'Metalwork built around your industry requirements.',
    ),
  }

  return items.length ? { ...syncedBlock, items } : syncedBlock
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
    description: replaceLegacyHomeCopy(block.description, defaultHomeServicesBlock.description),
    eyebrow: replaceLegacyHomeCopy(block.eyebrow, defaultHomeServicesBlock.eyebrow),
    heading: replaceLegacyHomeCopy(block.heading, defaultHomeServicesBlock.heading),
    secondaryDescription: replaceLegacyHomeCopy(
      block.secondaryDescription,
      defaultHomeServicesBlock.secondaryDescription,
    ),
  }
}

export function resolveHomeHeroCoverMedia(
  type: 'image' | 'video' | null | undefined,
  imageValue: unknown,
  videoValue: unknown,
): {
  image: MediaImage | null
  type: 'image' | 'video' | null | undefined
  video: MediaFile | null
} {
  const inferredImageVideo = isMediaVideo(imageValue) ? getMediaFile(imageValue) : null
  const selectedVideo = type === 'image' ? null : getMediaFile(videoValue)
  const video = selectedVideo ?? inferredImageVideo

  return {
    image: getMediaImage(imageValue),
    type: video ? 'video' : type,
    video,
  }
}

function syncHomeHeroBlock(block: HomeHeroSourceBlock): HomeHeroLayoutBlock {
  const desktopCover = resolveHomeHeroCoverMedia(
    block.desktopCoverType,
    block.desktopCoverImage,
    block.desktopCoverVideo,
  )
  const laptopCover = resolveHomeHeroCoverMedia(
    block.laptopCoverType,
    block.laptopCoverImage,
    block.laptopCoverVideo,
  )
  const mobileCover = resolveHomeHeroCoverMedia(
    block.mobileCoverType,
    block.mobileCoverImage,
    block.mobileCoverVideo,
  )

  return {
    ...block,
    description: replaceLegacyHomeCopy(block.description),
    desktopCoverType: desktopCover.type,
    desktopCoverImage: desktopCover.image,
    desktopCoverVideo: desktopCover.video,
    eyebrow: replaceLegacyHomeCopy(block.eyebrow),
    heading: replaceLegacyHomeCopy(block.heading),
    laptopCoverType: laptopCover.type,
    laptopCoverImage: laptopCover.image,
    laptopCoverVideo: laptopCover.video,
    mobileCoverType: mobileCover.type,
    mobileCoverImage: mobileCover.image,
    mobileCoverVideo: mobileCover.video,
    previewHeading: replaceLegacyHomeCopy(block.previewHeading),
    primaryLabel: replaceLegacyHomeCopy(block.primaryLabel),
    secondaryLabel: replaceLegacyHomeCopy(block.secondaryLabel),
  }
}

function syncHomeProcessBlock(block: HomeProcessSourceBlock): HomeProcessLayoutBlock {
  return {
    ...block,
    model3D: getMediaFile(block.model3D),
    steps: block.steps.map((step) => ({
      ...step,
      infographicImage: getMediaImage(step.infographicImage),
    })),
  }
}

async function syncHomeBlock(block: HomeLayoutSourceBlock): Promise<HomeLayout[number]> {
  if (block.blockType === 'homeHero') {
    return syncHomeHeroBlock(block)
  }

  if (block.blockType === 'homeIndustries') {
    return syncHomeIndustriesBlock(block as HomeIndustriesLayoutBlock)
  }

  if (block.blockType === 'homeServices') {
    return syncHomeServicesBlock(block)
  }

  if (block.blockType === 'homeProcess') {
    return syncHomeProcessBlock(block)
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
  ['home-layout', 'industry-related-products-v2', 'hero-cover-media-v2'],
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
