import type { Industry, Page, Product } from '@/payload-types'

import { cachedQuery } from './cache'
import {
  defaultEngineeringImage,
  defaultHomeEngineeringDisciplines,
  defaultHomeEngineeringIntro,
  defaultHomeEngineeringNote,
  type HomeEngineeringDiscipline,
  type HomeEngineeringImage,
} from './homeEngineeringDefaults'
import {
  defaultLocations,
  defaultLocationsTitle,
  splitAddress,
  type HomeLocation,
} from './homeLocationsDefaults'
import {
  defaultHomeMachiningGroups,
  defaultHomeMachiningIntro,
  defaultHomeMachiningStats,
  type HomeMachiningGroup,
  type HomeMachiningStat,
} from './homeMachiningDefaults'
import {
  defaultHomeProcessCta,
  defaultHomeProcessIntro,
  defaultHomeProcessSteps,
  defaultHomeProcessSummary,
} from './homeProcessDefaults'
import { getMediaFile, getMediaImage, isMediaVideo, type MediaFile, type MediaImage } from './media'
import { getPayloadClient } from './payload'
import { industryRank } from './productTaxonomy'
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
  youtubeVideoId?: string | null
}
type HomeIndustriesSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeIndustries' }>
export type HomeIndustryProduct = {
  id: number | string
  image: MediaImage | null
  /** Product code, set in the corner of the card as it is on the detail page.
   *  Optional: the placeholder products a sparse industry falls back to have none. */
  sku?: string | null
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
  'hoverMedia' | 'image'
> & {
  fallbackImage: string
  /** GIF or short clip swapped in while the card is hovered. */
  hoverMedia?: MediaFile | null
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
/*
 * Machining, engineering and locations are all shaped for the components
 * rather than left in CMS shape: the sync functions below fold every row into
 * the same plain types the committed defaults use, so each component reads one
 * shape whether its content came from Payload or from the repo.
 */
type HomeMachiningSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeMachining' }>
export type HomeMachiningLayoutBlock = Omit<HomeMachiningSourceBlock, 'groups' | 'stats'> & {
  groups: HomeMachiningGroup[]
  stats: HomeMachiningStat[]
}
type HomeEngineeringSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeEngineering' }>
export type HomeEngineeringNote = {
  items: string[]
  listLead: string
  paragraphs: string[]
}
export type HomeEngineeringLayoutBlock = Omit<
  HomeEngineeringSourceBlock,
  'disciplines' | 'image' | 'note'
> & {
  disciplines: HomeEngineeringDiscipline[]
  image: HomeEngineeringImage
  note: HomeEngineeringNote
}
type HomeLocationsSourceBlock = Extract<HomeLayoutSourceBlock, { blockType: 'homeLocations' }>
export type HomeLocationsLayoutBlock = Omit<
  HomeLocationsSourceBlock,
  'image' | 'locations' | 'regions'
> & {
  image: MediaImage | null
  /** Empty when the Footer addresses should be used instead. */
  locations: HomeLocation[]
  title: { lead: string; reach: string; regions: string[] }
}
export type HomeLayout = (
  | HomeHeroLayoutBlock
  | HomeServicesLayoutBlock
  | HomeIndustriesLayoutBlock
  | HomeMachiningLayoutBlock
  | HomeEngineeringLayoutBlock
  | HomeProcessLayoutBlock
  | HomeLocationsLayoutBlock
)[]

const productWithoutLayoutSelect = {
  layout: false,
} as const

/*
 * Authored copy wins; the fallback only fills a field the CMS left empty.
 *
 * This used to also swap a table of known strings for newer wording, which
 * meant anything edited in Payload was replaced on the way out — the services
 * block could not be changed from the admin at all.
 */
function homeCopy(
  value: string | null | undefined,
  fallback: string | null | undefined = '',
): string {
  return value || (fallback ?? '')
}

export const defaultHeroPreviewItems: NonNullable<HomeHeroLayoutBlock['previewItems']> = [
  { title: 'CNC machining' },
  { title: 'Sheet metal processing' },
  { title: 'Pipe bending' },
  { title: 'Fabrication' },
]

/*
 * Six services in a 3x2 grid. Only five artwork files are committed, so the
 * fallback lookup wraps rather than leaving the last cell blank -- upload a
 * sixth image in the admin to give it its own.
 */
const serviceFallbackImages = [
  '/images/home/service-01.png',
  '/images/home/service-02.png',
  '/images/home/service-03.png',
  '/images/home/service-04.png',
  '/images/home/service-05.png',
]

function serviceFallbackImage(index: number): string {
  return serviceFallbackImages[index % serviceFallbackImages.length]
}

const defaultHomeServiceCards: HomeServiceCard[] = [
  'Ground Support Equipment',
  'Structural Steel Fabrication',
  'Architectural & Interior Metalwork',
  'Heavy Machinery',
  'Sheet Metal Products',
  'Custom Manufacturing',
].map((title, index) => ({
  fallbackImage: serviceFallbackImage(index),
  hoverMedia: null,
  image: null,
  title,
}))

const defaultHomeServicesHeading: NonNullable<HomeServicesLayoutBlock['headingSegments']> = [
  { text: 'Sky Wings provides ' },
  { emphasis: true, text: 'End-to-End Metal Manufacturing.' },
  { text: ' We take a ' },
  { emphasis: true, text: 'Requirement' },
  { text: ' — a drawing, a sample, a concept, or a problem to solve — and convert it into a ' },
  { emphasis: true, text: 'Manufactured product' },
  { text: '.' },
]

export const defaultHomeServicesBlock: HomeServicesLayoutBlock = {
  blockType: 'homeServices',
  cards: defaultHomeServiceCards,
  heading: 'Sky Wings provides end-to-end metal manufacturing',
  headingSegments: defaultHomeServicesHeading,
}

// Re-exported for the tests and the seed; the values live in a client-safe
// module because the process section needs them in the browser.
export {
  defaultHomeProcessCta,
  defaultHomeProcessIntro,
  defaultHomeProcessSteps,
  defaultHomeProcessSummary,
}

export const defaultHomeProcessBlock: HomeProcessLayoutBlock = {
  blockType: 'homeProcess',
  cta: { ...defaultHomeProcessCta },
  heading: 'Our Manufacturing Process',
  intro: defaultHomeProcessIntro.map((segment) => ({ ...segment })),
  model3D: null,
  steps: defaultHomeProcessSteps.map((step) => ({ ...step })),
  summary: defaultHomeProcessSummary.map((segment) => ({ ...segment })),
}

export const defaultHomeMachiningBlock: HomeMachiningLayoutBlock = {
  blockType: 'homeMachining',
  eyebrow: defaultHomeMachiningIntro.eyebrow,
  groups: defaultHomeMachiningGroups.map((group) => ({
    ...group,
    images: group.images.map((image) => ({ ...image })),
    machines: [...group.machines],
  })),
  heading: defaultHomeMachiningIntro.heading,
  stats: defaultHomeMachiningStats.map((stat) => ({ ...stat })),
}

export const defaultHomeEngineeringBlock: HomeEngineeringLayoutBlock = {
  blockType: 'homeEngineering',
  code: defaultHomeEngineeringIntro.code,
  disciplines: defaultHomeEngineeringDisciplines.map((discipline) => ({
    ...discipline,
    items: [...discipline.items],
    paragraphs: discipline.paragraphs ? [...discipline.paragraphs] : undefined,
  })),
  heading: defaultHomeEngineeringIntro.heading,
  image: { ...defaultEngineeringImage },
  note: {
    items: [...defaultHomeEngineeringNote.items],
    listLead: defaultHomeEngineeringNote.listLead,
    paragraphs: [...defaultHomeEngineeringNote.paragraphs],
  },
}

/*
 * No facilities: the block leaves them empty so the Footer addresses are used,
 * which is where they have always been edited.
 */
export const defaultHomeLocationsBlock: HomeLocationsLayoutBlock = {
  blockType: 'homeLocations',
  image: null,
  lead: defaultLocationsTitle.lead,
  locations: [],
  reach: defaultLocationsTitle.reach,
  title: {
    lead: defaultLocationsTitle.lead,
    reach: defaultLocationsTitle.reach,
    regions: [...defaultLocationsTitle.regions],
  },
}

export const DEFAULT_HERO_VIDEO_URL =
  'https://res.cloudinary.com/xtitj4ui/video/upload/v1788770857/skywings_intro_3_zgnjp3.mp4'

export const defaultHeroVideo: MediaFile = {
  alt: 'Sky Wings manufacturing intro video',
  mimeType: 'video/mp4',
  url: DEFAULT_HERO_VIDEO_URL,
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
    desktopCoverType: 'video',
    desktopCoverVideo: defaultHeroVideo,
    laptopCoverType: 'video',
    laptopCoverVideo: defaultHeroVideo,
    mobileCoverType: 'video',
    mobileCoverVideo: defaultHeroVideo,
    youtubeVideoId: null,
  },
  defaultHomeServicesBlock,
  {
    blockType: 'homeIndustries',
    eyebrow: 'Industries we serve',
    heading: 'Metalwork built around your industry requirements.',
    description:
      'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
    // Five, and without Custom Metal Fabrication -- matches what
    // getHomeIndustryItems fetches, so the fallback and the live data agree.
    items: [
      'Construction & Infrastructure',
      'Architectural & Interior Metalwork',
      'Heavy Equipment & Machinery',
      'Aviation Ground Support Equipment',
      'Industrial Manufacturing',
    ].map((title) => ({
      title,
      meta: 'Products, applications, related assemblies',
    })),
  },
  defaultHomeMachiningBlock,
  defaultHomeEngineeringBlock,
  defaultHomeProcessBlock,
  defaultHomeLocationsBlock,
]

export function isHomeBlock(block: LayoutBlock): block is HomeLayoutSourceBlock {
  return block.blockType.startsWith('home')
}

function toHomeProduct(product: Product): HomeIndustryProduct {
  return {
    id: product.id,
    image: getMediaImage(product.thumbnailImage) ?? getMediaImage(product.featuredImage),
    sku: product.sku ?? null,
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

/*
 * The landing page shows five industries. Custom Metal Fabrication is left out
 * because it describes a way of working rather than a sector -- see the note in
 * productTaxonomy.ts -- so it reads oddly beside the five real ones.
 *
 * Excluded by slug here rather than by a CMS flag: Industries has no
 * home-visibility field, and adding one would mean a schema push for a single
 * editorial choice. If more of these accumulate, that is the point to add the
 * field instead.
 */
const HOME_INDUSTRY_LIMIT = 5
const HOME_INDUSTRY_EXCLUDED_SLUGS = ['custom-metal-fabrication']

async function getHomeIndustryItems(): Promise<HomeIndustryItem[]> {
  const payload = await getPayloadClient()
  const { docs: industries } = await payload.find({
    collection: 'industries',
    depth: 2,
    draft: false,
    // Read wide, then rank, then cut: pinning after a limit of five would
    // never see an industry the editor happens to have ordered sixth.
    limit: 50,
    overrideAccess: false,
    sort: 'sortOrder',
    where: {
      slug: {
        not_in: HOME_INDUSTRY_EXCLUDED_SLUGS,
      },
    },
  })

  const ordered = [...industries]
    .sort((a, b) => industryRank(a.slug) - industryRank(b.slug))
    .slice(0, HOME_INDUSTRY_LIMIT)

  return Promise.all(
    ordered.map(async (industry) => {
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
    description: homeCopy(
      block.description,
      'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
    ),
    eyebrow: homeCopy(block.eyebrow, 'Industries we serve'),
    heading: homeCopy(
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
        // Cards beyond the committed artwork wrap through the same list rather
        // than all falling back to the first image.
        fallbackImage: serviceFallbackImage(index),
        hoverMedia: 'hoverMedia' in card ? getMediaFile(card.hoverMedia) : null,
        image: mediaFromServiceCard(card),
        title: card.title || fallback.title,
      }
    }),
    heading: homeCopy(block.heading, defaultHomeServicesBlock.heading),
    // An editor who clears every run gets the default two-tone headline back
    // rather than an empty band.
    headingSegments: block.headingSegments?.length
      ? block.headingSegments
      : defaultHomeServicesHeading,
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
  // Resolved as 'video' rather than from the stored cover type: the hero always
  // plays video, and most rows still carry a legacy 'image' type that would
  // otherwise discard a CMS-selected cover video.
  const desktopCover = resolveHomeHeroCoverMedia(
    'video',
    block.desktopCoverImage,
    block.desktopCoverVideo,
  )
  const laptopCover = resolveHomeHeroCoverMedia(
    'video',
    block.laptopCoverImage,
    block.laptopCoverVideo,
  )
  const mobileCover = resolveHomeHeroCoverMedia(
    'video',
    block.mobileCoverImage,
    block.mobileCoverVideo,
  )

  // The landing hero always plays a video, falling back to the hosted
  // Cloudinary intro when no per-breakpoint video is set. CMS cover images are
  // always kept as the poster painted while that video loads.
  return {
    ...block,
    description: homeCopy(block.description),
    desktopCoverType: 'video',
    desktopCoverImage: desktopCover.image,
    desktopCoverVideo: desktopCover.video ?? defaultHeroVideo,
    eyebrow: homeCopy(block.eyebrow),
    heading: homeCopy(block.heading),
    laptopCoverType: 'video',
    laptopCoverImage: laptopCover.image,
    laptopCoverVideo: laptopCover.video ?? defaultHeroVideo,
    mobileCoverType: 'video',
    mobileCoverImage: mobileCover.image,
    mobileCoverVideo: mobileCover.video ?? defaultHeroVideo,
    previewHeading: homeCopy(block.previewHeading),
    primaryLabel: homeCopy(block.primaryLabel),
    secondaryLabel: homeCopy(block.secondaryLabel),
    youtubeVideoId: null,
  }
}

function syncHomeProcessBlock(block: HomeProcessSourceBlock): HomeProcessLayoutBlock {
  const cta = block.cta ?? {}

  return {
    ...block,
    cta: {
      copy: homeCopy(cta.copy, defaultHomeProcessCta.copy),
      ctaHref: homeCopy(cta.ctaHref, defaultHomeProcessCta.ctaHref),
      ctaLabel: homeCopy(cta.ctaLabel, defaultHomeProcessCta.ctaLabel),
      heading: homeCopy(cta.heading, defaultHomeProcessCta.heading),
      label: homeCopy(cta.label, defaultHomeProcessCta.label),
    },
    heading: homeCopy(block.heading, defaultHomeProcessBlock.heading),
    // Clearing every run restores the default copy rather than leaving a gap.
    intro: block.intro?.length ? block.intro : defaultHomeProcessBlock.intro,
    model3D: getMediaFile(block.model3D),
    summary: block.summary?.length ? block.summary : defaultHomeProcessBlock.summary,
    steps: block.steps.map((step, index) => {
      const fallback = defaultHomeProcessSteps[index]

      return {
        ...step,
        description: homeCopy(step.description, fallback?.description),
        infographicImage: getMediaImage(step.infographicImage),
        label: homeCopy(step.label, fallback?.label || step.title),
        title: homeCopy(step.title, fallback?.title),
      }
    }),
  }
}

/** Textarea copy, one paragraph per line, blank lines dropped. */
function paragraphsFrom(value: string | null | undefined, fallback: string[]): string[] {
  const paragraphs = (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return paragraphs.length ? paragraphs : fallback
}

function rowsFrom(
  rows: { text: string }[] | null | undefined,
  fallback: string[] = [],
): string[] {
  const values = (rows ?? []).map((row) => row.text?.trim()).filter((text): text is string =>
    Boolean(text),
  )

  return values.length ? values : fallback
}

function syncHomeMachiningBlock(block: HomeMachiningSourceBlock): HomeMachiningLayoutBlock {
  const groups = (block.groups ?? []).map((group, index) => {
    // Positional, as with the process steps: row three keeps row three's
    // machines and photographs whatever its title becomes.
    const fallback = defaultHomeMachiningGroups[index]
    const images = (group.images ?? [])
      .map((row) => getMediaImage(row.image))
      .filter((image): image is MediaImage => Boolean(image))
    const machines = (group.machines ?? [])
      .map((row) => row.name?.trim())
      .filter((name): name is string => Boolean(name))

    return {
      id: group.id || fallback?.id || `machining-${index}`,
      images: images.length ? images : (fallback?.images.map((image) => ({ ...image })) ?? []),
      machines: machines.length ? machines : [...(fallback?.machines ?? [])],
      title: homeCopy(group.title, fallback?.title),
    }
  })

  // Both halves of a stat are required, so a row is only carried when it is
  // complete -- a half-filled row would set a figure with no label.
  const stats = (block.stats ?? [])
    .filter((stat) => stat.label?.trim() && stat.value?.trim())
    .map((stat) => ({ label: stat.label, value: stat.value }))

  return {
    ...block,
    eyebrow: homeCopy(block.eyebrow, defaultHomeMachiningIntro.eyebrow),
    groups: groups.length ? groups : defaultHomeMachiningBlock.groups,
    heading: homeCopy(block.heading, defaultHomeMachiningIntro.heading),
    stats: stats.length ? stats : defaultHomeMachiningBlock.stats,
  }
}

function syncHomeEngineeringBlock(block: HomeEngineeringSourceBlock): HomeEngineeringLayoutBlock {
  const disciplines = (block.disciplines ?? []).map((discipline, index) => {
    const fallback = defaultHomeEngineeringDisciplines[index]
    const paragraphs = paragraphsFrom(discipline.copy, [...(fallback?.paragraphs ?? [])])

    return {
      eyebrow: homeCopy(discipline.eyebrow, fallback?.eyebrow),
      id: discipline.id || fallback?.id || `discipline-${index}`,
      items: rowsFrom(discipline.items, [...(fallback?.items ?? [])]),
      listLead: homeCopy(discipline.listLead, fallback?.listLead),
      // CAM carries no paragraph in the design, so an empty run stays empty.
      paragraphs: paragraphs.length ? paragraphs : undefined,
      title: homeCopy(discipline.title, fallback?.title),
    }
  })
  const note = block.note ?? {}

  return {
    ...block,
    code: homeCopy(block.code, defaultHomeEngineeringIntro.code),
    disciplines: disciplines.length ? disciplines : defaultHomeEngineeringBlock.disciplines,
    heading: homeCopy(block.heading, defaultHomeEngineeringIntro.heading),
    image: getMediaImage(block.image) ?? { ...defaultEngineeringImage },
    note: {
      items: rowsFrom(note.items, [...defaultHomeEngineeringNote.items]),
      listLead: homeCopy(note.listLead, defaultHomeEngineeringNote.listLead),
      paragraphs: paragraphsFrom(note.copy, [...defaultHomeEngineeringNote.paragraphs]),
    },
  }
}

function syncHomeLocationsBlock(block: HomeLocationsSourceBlock): HomeLocationsLayoutBlock {
  /*
   * Left empty by default: the facilities are edited on the Footer, and only
   * a row filled in here overrides one for the home page.
   */
  const locations = (block.locations ?? []).map((location, index) => {
    const fallback = defaultLocations[index]
    const address = location.address?.trim()

    return {
      addressLines: address ? splitAddress(address) : [...(fallback?.addressLines ?? [])],
      kind: homeCopy(location.kind, fallback?.kind),
      name: homeCopy(location.name, fallback?.name),
      phone: homeCopy(location.phone, fallback?.phone),
    }
  })

  return {
    ...block,
    image: getMediaImage(block.image),
    locations,
    title: {
      lead: homeCopy(block.lead, defaultLocationsTitle.lead),
      reach: homeCopy(block.reach, defaultLocationsTitle.reach),
      regions: rowsFrom(block.regions, [...defaultLocationsTitle.regions]),
    },
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

  if (block.blockType === 'homeMachining') {
    return syncHomeMachiningBlock(block)
  }

  if (block.blockType === 'homeEngineering') {
    return syncHomeEngineeringBlock(block)
  }

  if (block.blockType === 'homeProcess') {
    return syncHomeProcessBlock(block)
  }

  if (block.blockType === 'homeLocations') {
    return syncHomeLocationsBlock(block)
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

/*
 * The key parts carry versions because unstable_cache has no TTL and persists
 * to disk, so a change to what these queries *return* stays invisible behind an
 * entry keyed only by name. Bump the relevant part whenever the shape or the
 * selection changes -- home-industries-v2 is the five-industry list.
 */
const getCachedHomeLayout = cachedQuery(
  fetchHomeLayout,
  [
    'home-layout',
    'industry-related-products-v3',
    'hero-cover-media-v5',
    'home-industries-v2',
    /*
     * Bumped when the machining, engineering and locations sections became CMS
     * blocks. Without it a warm cache keeps returning the layout as it was
     * before they existed -- the page then renders all three from their
     * committed defaults and ignores everything authored in the admin, which
     * is exactly what it looks like when an upload "does not show up".
     */
    'home-section-blocks-v1',
  ],
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
