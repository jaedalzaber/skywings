/**
 * Seeds one Industry Page per published industry, so every industry starts
 * from the same section order and editors only adjust content in the admin.
 *
 * Aviation GSE receives the full content from the design; every other
 * industry receives the same skeleton with copy derived from its taxonomy
 * record and products that already reference it. Images are chosen only
 * from media whose file actually resolves, because a large share of the
 * Media collection points at files that no longer exist.
 *
 * Idempotent: pages whose slug already exists are skipped. Set FORCE=1 to
 * overwrite their layout with the seed again.
 *
 *   pnpm run seed:industry-pages
 *   FORCE=1 pnpm run seed:industry-pages
 *
 * Note: `payload run` strips every argument after the script path, so the
 * overwrite is selected with the FORCE env var, not a CLI flag.
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Brochure, Industry, IndustryPage, Media, Product } from '../src/payload-types'

type Layout = NonNullable<IndustryPage['layout']>
type Block = Layout[number]
type RichTextValue = NonNullable<Extract<Block, { blockType: 'industryIntro' }>['description']>

const force = process.env.FORCE === '1' || process.env.FORCE === 'true'

const GSE_SLUG = 'aviation-ground-support-equipment'
const TAGLINE = 'From drawing, sample, or problem\nto manufactured product.'
const GENERIC_PITCH =
  'See who makes your parts and communicate with them directly – on design, quality, and timelines. Build supplier relationships you trust and control, from R&D to full production.'

// ----------------------------------------------------------- Lexical helpers

type Run = [text: string, bold?: boolean]

function textNode(text: string, bold = false) {
  return { detail: 0, format: bold ? 1 : 0, mode: 'normal', style: '', text, type: 'text', version: 1 }
}

function paragraph(...runs: Run[]) {
  return {
    children: runs.map(([text, bold]) => textNode(text, bold)),
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    textFormat: 0,
    type: 'paragraph',
    version: 1,
  }
}

function richText(...paragraphs: ReturnType<typeof paragraph>[]): RichTextValue {
  return {
    root: {
      children: paragraphs,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

const pitch = () =>
  richText(
    paragraph(
      ['See who makes your '],
      ['parts', true],
      [
        ' and communicate with them directly – on design, quality, and timelines. Build supplier relationships you trust and control, from R&D to full production.',
      ],
    ),
  )

// ------------------------------------------------------------- Media picker

class MediaPicker {
  private readonly resolving = new Map<number, Media>()

  constructor(private readonly all: Media[]) {}

  async init() {
    const images = this.all.filter((m) => m.url && (m.mimeType ?? '').startsWith('image/'))

    await Promise.all(
      images.map(async (media) => {
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 8000)
          const response = await fetch(media.url as string, {
            method: 'HEAD',
            signal: controller.signal,
          })
          clearTimeout(timer)
          if (response.ok) this.resolving.set(media.id, media)
        } catch {
          // unreachable file — treat as missing
        }
      }),
    )

    console.log(`Media: ${this.resolving.size} of ${images.length} images resolve`)
  }

  has(id: unknown): id is number {
    return typeof id === 'number' && this.resolving.has(id)
  }

  /** First resolving image matching any of the patterns, by filename or alt. */
  find(...patterns: RegExp[]): null | number {
    for (const pattern of patterns) {
      for (const media of this.resolving.values()) {
        if (pattern.test(media.filename ?? '') || pattern.test(media.alt ?? '')) {
          return media.id
        }
      }
    }
    return null
  }

  firstOf(...ids: unknown[]): null | number {
    for (const id of ids) {
      if (this.has(id)) return id
    }
    return null
  }
}

// ----------------------------------------------------------- Shared blocks

function relId(value: unknown): null | number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return Number((value as { id: number }).id)
  return null
}

function productImage(product: Product, media: MediaPicker): null | number {
  return media.firstOf(relId(product.thumbnailImage), relId(product.featuredImage))
}

function heroBlock(args: { description: string; poster: number }): Block {
  return {
    aspectRatio: '16-9',
    blockType: 'industryHero',
    headline: TAGLINE,
    mediaDescription: args.description,
    overlayAlignment: 'left',
    overlayTextAlignment: 'left',
    poster: args.poster,
    showOverlay: true,
    stats: [
      { label: 'Products', value: '60+' },
      { label: 'Categories', value: '10+' },
    ],
    theme: 'dark',
  }
}

function faqBlock(secondaryHeading: string, subject: string): Block {
  return {
    allowMultipleOpen: false,
    blockType: 'faq',
    categories: [
      {
        label: 'Products',
        questions: [
          {
            answer: richText(
              paragraph([
                `We offer both new and refurbished ${subject}. Customers can choose the best option depending on their budget, operational needs and delivery timelines.`,
              ]),
            ),
            defaultOpen: true,
            question: `Do you sell new or refurbished ${subject}?`,
          },
          {
            answer: richText(
              paragraph([
                'Every unit ships with a manufacturer warranty covering materials and workmanship. Refurbished equipment carries its own documented warranty period agreed before purchase.',
              ]),
            ),
            question: 'What warranty do you provide on purchased equipment?',
          },
          {
            answer: richText(
              paragraph([
                'Yes. Inspections can be arranged at our Sharjah or Fujairah facilities, and we share detailed photos, drawings and test reports for remote review.',
              ]),
            ),
            question: 'Can I inspect equipment before purchasing?',
          },
        ],
      },
      {
        label: 'Services',
        questions: [
          {
            answer: richText(
              paragraph([
                'Stock items ship within days. Custom or configured builds are quoted with a production schedule, typically two to eight weeks depending on complexity and finish.',
              ]),
            ),
            question: 'How long does delivery take for purchased equipment?',
          },
          {
            answer: richText(
              paragraph([
                'Our engineers review duty cycle, budget and lead time with you. New builds suit long-term fleets and custom specifications; refurbished units suit fast deployment and lower capital cost.',
              ]),
            ),
            question: 'How do I choose between new and refurbished equipment?',
          },
          {
            answer: richText(
              paragraph([
                'Yes. We supply spare parts, on-site maintenance and refurbishment programmes for equipment we manufacture and for many third-party units.',
              ]),
            ),
            question: 'Do you provide after-sales support and spare parts?',
          },
        ],
      },
    ],
    eyebrow: 'FAQ',
    heading: 'Frequently Asked Questions',
    secondaryHeading,
    theme: 'light',
  }
}

function ctaBlock(featureImage: number, subject: string): Block {
  return {
    action: { href: '/contact', label: 'Get in Touch', openInNewTab: false, style: 'primary' },
    blockType: 'customProductCta',
    description: `Purchase high-quality ${subject} with full ownership. Custom builds with warranty and after-sales support.`,
    featureImage,
    featureImageAlt: '',
    headingSegments: [
      { emphasis: 'normal', text: 'Need' },
      { emphasis: 'bold', text: 'Customized Product' },
      { emphasis: 'normal', text: 'For Your' },
      { emphasis: 'bold', text: 'Requirement?' },
    ],
    theme: 'brand',
  }
}

function galleryBlock(args: {
  browseHref: string
  browseLabel: string
  families: Map<number, string>
  featuredSlug?: string
  heading: string
  media: MediaPicker
  products: Product[]
}): Block | null {
  if (args.products.length === 0) return null

  const familyIds = new Set<number>()
  args.products.forEach((product) => {
    const id = relId(product.productFamily)
    if (id !== null && args.families.has(id)) familyIds.add(id)
  })

  return {
    blockType: 'productGallery',
    browseAction: {
      href: args.browseHref,
      label: args.browseLabel,
      openInNewTab: false,
      style: 'primary',
    },
    filters:
      familyIds.size > 1
        ? [...familyIds].map((id) => ({ label: args.families.get(id) as string, productFamily: id }))
        : [],
    heading: args.heading,
    items: args.products.map((product, index) => ({
      featured: args.featuredSlug ? product.slug === args.featuredSlug : index === 0,
      imageOverride: null,
      product: product.id,
    })),
    theme: 'light',
  }
}

function brochureBlock(args: {
  brochure: Brochure | null
  coverImage: null | number
  heading: string
  secondaryHref: string
  secondaryLabel: string
}): Block | null {
  if (!args.brochure) return null

  return {
    blockType: 'brochureDownload',
    brochure: args.brochure.id,
    coverImage: args.coverImage,
    description: richText(
      paragraph(
        ['See who makes your '],
        ['parts', true],
        [' and communicate with them directly – on design, quality, and timelines'],
      ),
    ),
    downloadAction: { href: '', label: 'Download PDF', openInNewTab: true, style: 'primary' },
    format: 'PDF',
    heading: args.heading,
    pageCount: args.brochure.pageCount ?? null,
    secondaryAction: {
      href: args.secondaryHref,
      label: args.secondaryLabel,
      openInNewTab: false,
      style: 'secondary',
    },
    source: 'brochure',
    theme: 'light',
  }
}

// ------------------------------------------------------------ Page builders

type Context = {
  brochures: Brochure[]
  families: Map<number, string>
  media: MediaPicker
  products: Product[]
}

function productsFor(industry: Industry, ctx: Context): Product[] {
  return ctx.products.filter((product) =>
    (product.industries ?? []).some((entry) => relId(entry) === industry.id),
  )
}

function brochureFor(industry: Industry, ctx: Context): Brochure | null {
  return (
    ctx.brochures.find((brochure) =>
      (brochure.industries ?? []).some((entry) => relId(entry) === industry.id),
    ) ??
    ctx.brochures.find((brochure) => brochure.slug === 'sky-wings-company-profile') ??
    ctx.brochures[0] ??
    null
  )
}

function shortLabel(industry: Industry): string {
  if (industry.slug === GSE_SLUG) return 'Aviation GSE'
  return industry.shortLabel?.trim() || industry.title
}

/** "Construction & Infrastructure" -> ["Construction &", "Infrastructure"]. */
function titleLines(title: string): string[] {
  if (title.includes(' & ')) {
    const [head, ...rest] = title.split(' & ')
    return [`${head} &`, rest.join(' & ')]
  }

  const words = title.split(' ')
  if (words.length < 3) return [title]

  const split = Math.ceil(words.length / 2)
  return [words.slice(0, split).join(' '), words.slice(split).join(' ')]
}

function buildGse(industry: Industry, ctx: Context): Layout {
  const { media } = ctx
  const poster = media.firstOf(relId(industry.heroImage)) ?? media.find(/aviation|gse|hero/i)
  const cargo = media.find(/related-cargo/i)
  const platforms = media.find(/related-platforms/i)
  const ladders = media.find(/related-ladders/i)
  const stair = media.find(/related-stair/i)
  const fallback = poster ?? media.find(/./)

  if (!fallback) throw new Error('No resolving image found for the Aviation GSE page')

  const products = productsFor(industry, ctx)
  const bySlug = (slug: string) => products.find((product) => product.slug === slug)
  const galleryPicks = [
    'ld3-container-dolly',
    'towable-belt-loader',
    'folding-stand',
    'windshield-maintenance-platform',
    'hydraulic-maintenance-steps',
    'uld-containers',
    'meal-cart-full-size',
    'inline-conveyor-380v',
  ]
    .map(bySlug)
    .filter((product): product is Product => Boolean(product))

  const cards = [
    { href: '/products/ld3-container-dolly', image: cargo, title: 'Cargo & Pallet Dolly' },
    { href: '/products/b1-maintenance-stand', image: platforms, title: 'Maintenance Stands' },
    { href: '/products/straight-ladders', image: ladders, title: 'Ladders' },
    { href: '/products/maintenance-stair', image: stair, title: 'Maintenance Stairs' },
  ].filter((card): card is typeof card & { image: number } => card.image !== null)

  const layout: (Block | null)[] = [
    heroBlock({
      description: 'Towable belt loader positioned at the cargo door of a parked aircraft.',
      poster: fallback,
    }),
    {
      blockType: 'industryIntro',
      description: pitch(),
      headingLines: [
        { emphasis: 'strong', text: 'Ground Support' },
        { emphasis: 'strong', text: 'Equipment' },
        { emphasis: 'light', text: 'Manufacturing' },
      ],
      layout: 'split',
      primaryAction: { href: '/contact', label: 'Contact', openInNewTab: false, style: 'primary' },
      secondaryAction: {
        href: '/brochures',
        label: 'View Catalogue',
        openInNewTab: false,
        style: 'text',
      },
      theme: 'light',
    },
    cards.length
      ? {
          blockType: 'cardCarousel',
          cards: cards.map((card) => ({ ...card, description: null, numberOverride: null })),
          cardsPerView: 4,
          eyebrow: 'Aviation GSE',
          heading: 'Our Products &\nServices',
          showControls: true,
          theme: 'light',
        }
      : null,
    {
      blockType: 'industryValue',
      clientLogos: [],
      description: richText(
        paragraph([
          'Purchase high-quality ground support equipment with full ownership. Refurbished GSE with warranty and after-sales support.',
        ]),
      ),
      featureImage: stair ?? platforms ?? fallback,
      headingSegments: [
        { breakAfter: false, emphasis: 'normal', text: 'High-Quality' },
        { breakAfter: false, emphasis: 'bold', text: 'GSE' },
        { breakAfter: true, emphasis: 'normal', text: 'Sales' },
        { breakAfter: true, emphasis: 'normal', text: 'For Long-Term' },
        { breakAfter: false, emphasis: 'bold', text: 'Operational' },
        { breakAfter: false, emphasis: 'normal', text: 'Value' },
      ],
      logosLabel: 'Our Clients In Aviation GSE Supply',
      theme: 'dark',
    },
    galleryBlock({
      browseHref: `/products?industry=${industry.slug}`,
      browseLabel: 'Browse All GSE Products',
      families: ctx.families,
      featuredSlug: 'folding-stand',
      heading: 'Ground Support Equipments\nProduct Gallery',
      media,
      products: galleryPicks.length ? galleryPicks : products.slice(0, 8),
    }),
    brochureBlock({
      brochure:
        ctx.brochures.find((brochure) => brochure.slug === 'gse-product-catalogue') ??
        brochureFor(industry, ctx),
      coverImage: null,
      heading: 'Get Our\nGSE Brochure',
      secondaryHref: `/products?industry=${industry.slug}`,
      secondaryLabel: 'Browse GSE Products',
    }),
    ctaBlock(cargo ?? fallback, 'ground support equipment'),
    faqBlock('GSE', 'GSE equipment'),
  ]

  return layout.filter((block): block is Block => block !== null)
}

function buildGeneric(industry: Industry, ctx: Context): Layout {
  const { media } = ctx
  const label = shortLabel(industry)
  const products = productsFor(industry, ctx)
  const poster = media.firstOf(relId(industry.heroImage)) ?? media.find(/hero/i)

  if (!poster) throw new Error(`No resolving image found for "${industry.title}"`)

  const withImages = products
    .map((product) => ({ image: productImage(product, media), product }))
    .filter((entry): entry is { image: number; product: Product } => entry.image !== null)

  const cards = withImages.slice(0, 6).map(({ image, product }) => ({
    description: null,
    href: `/products/${product.slug}`,
    image,
    numberOverride: null,
    title: product.title,
  }))

  const featureImage = withImages[0]?.image ?? poster
  const subject = /service/i.test(industry.title) ? 'Solutions' : 'Manufacturing'
  const lines = titleLines(industry.title)
  const brochure = brochureFor(industry, ctx)

  const layout: (Block | null)[] = [
    heroBlock({ description: `${industry.title} — ${industry.summary}`, poster }),
    {
      blockType: 'industryIntro',
      description: richText(paragraph([industry.summary]), paragraph([GENERIC_PITCH])),
      headingLines: [
        ...lines.map((text) => ({ emphasis: 'strong' as const, text })),
        { emphasis: 'light' as const, text: subject },
      ],
      layout: 'split',
      primaryAction: { href: '/contact', label: 'Contact', openInNewTab: false, style: 'primary' },
      secondaryAction: {
        href: `/products?industry=${industry.slug}`,
        label: 'View product map',
        openInNewTab: false,
        style: 'text',
      },
      theme: 'light',
    },
    cards.length
      ? {
          blockType: 'cardCarousel',
          cards,
          cardsPerView: 4,
          eyebrow: label,
          heading: 'Our Products &\nServices',
          showControls: true,
          theme: 'light',
        }
      : null,
    {
      blockType: 'industryValue',
      clientLogos: [],
      description: richText(
        paragraph([
          `Fabricated to drawing or developed from a sample, every ${industry.title.toLowerCase()} product ships with full documentation, warranty and after-sales support.`,
        ]),
      ),
      featureImage,
      headingSegments: [
        { breakAfter: false, emphasis: 'normal', text: 'Engineered' },
        { breakAfter: true, emphasis: 'bold', text: 'Metal Solutions' },
        { breakAfter: true, emphasis: 'normal', text: 'For Long-Term' },
        { breakAfter: false, emphasis: 'bold', text: 'Operational' },
        { breakAfter: false, emphasis: 'normal', text: 'Value' },
      ],
      logosLabel: `Our Clients In ${industry.title}`,
      theme: 'dark',
    },
    galleryBlock({
      browseHref: `/products?industry=${industry.slug}`,
      browseLabel: `Browse All ${label} Products`,
      families: ctx.families,
      heading: `${industry.title}\nProduct Gallery`,
      media,
      products: products.slice(0, 8),
    }),
    brochureBlock({
      brochure,
      coverImage: null,
      heading: `Get Our\n${label} Brochure`,
      secondaryHref: `/products?industry=${industry.slug}`,
      secondaryLabel: `Browse ${label} Products`,
    }),
    ctaBlock(featureImage, `${industry.title.toLowerCase()} products`),
    faqBlock(label, `${industry.title.toLowerCase()} equipment`),
  ]

  return layout.filter((block): block is Block => block !== null)
}

// ------------------------------------------------------------------- Main

async function loadContext(payload: Payload): Promise<Context> {
  const [media, products, families, brochures] = await Promise.all([
    payload.find({ collection: 'media', depth: 0, limit: 500, pagination: false }),
    payload.find({ collection: 'products', depth: 0, limit: 500, pagination: false }),
    payload.find({ collection: 'product-families', depth: 0, limit: 100, pagination: false }),
    payload.find({ collection: 'brochures', depth: 0, limit: 100, pagination: false }),
  ])

  const picker = new MediaPicker(media.docs)
  await picker.init()

  return {
    brochures: brochures.docs,
    families: new Map(families.docs.map((family) => [family.id, family.title])),
    media: picker,
    products: products.docs,
  }
}

async function main() {
  const payload = await getPayload({ config })
  const ctx = await loadContext(payload)

  const { docs: industries } = await payload.find({
    collection: 'industries',
    depth: 0,
    limit: 100,
    pagination: false,
    sort: 'sortOrder',
  })

  const { docs: existing } = await payload.find({
    collection: 'industry-pages',
    depth: 0,
    draft: true,
    limit: 100,
    pagination: false,
  })
  const existingBySlug = new Map(existing.map((page) => [page.slug, page]))

  let created = 0
  let updated = 0
  let skipped = 0

  for (const [index, industry] of industries.entries()) {
    const current = existingBySlug.get(industry.slug)

    if (current && !force) {
      console.log(`skip    ${industry.slug} (exists as #${current.id})`)
      skipped += 1
      continue
    }

    const layout = industry.slug === GSE_SLUG ? buildGse(industry, ctx) : buildGeneric(industry, ctx)
    const data = {
      _status: 'published' as const,
      industry: industry.id,
      layout,
      navLabel: shortLabel(industry),
      seo: {
        description: industry.summary,
        title: `${industry.title} | Sky Wings Engineering Industries`,
      },
      slug: industry.slug,
      sortOrder: industry.sortOrder ?? index,
      title: industry.title,
    }

    if (current) {
      await payload.update({ collection: 'industry-pages', data, draft: false, id: current.id })
      console.log(`update  ${industry.slug} (${layout.length} sections)`)
      updated += 1
    } else {
      await payload.create({ collection: 'industry-pages', data, draft: false })
      console.log(`create  ${industry.slug} (${layout.length} sections)`)
      created += 1
    }
  }

  console.log(`\nDone. created=${created} updated=${updated} skipped=${skipped}`)
}

// Top-level await, not `main().then(...)`: `payload run` exits as soon as the
// module import settles, so a floating promise would never get to run.
try {
  await main()
  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
