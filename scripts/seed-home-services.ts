/**
 * Fills the home page's services block with the six services the grid was
 * designed around.
 *
 * The block had seven cards left from the horizontal scroller, several under
 * pre-redesign names ("Erection", "Metal Product Fabrication"), so the page
 * did not match the grid it now renders. Defaults in src/data/home.ts only
 * apply when the CMS block is empty, which it is not -- hence this script.
 *
 * Any artwork already uploaded against a matching title is carried over, and
 * cards that drop out are printed rather than silently discarded.
 *
 * Idempotent: re-running writes the same six cards.
 *
 *   pnpm run seed:home-services
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

const SERVICES = [
  'Ground Support Equipment',
  'Structural Steel Fabrication',
  'Architectural & Interior Metalwork',
  'Heavy Machinery',
  'Sheet Metal Products',
  'Custom Manufacturing',
]

const HEADING_SEGMENTS = [
  { text: 'Sky Wings provides ' },
  { emphasis: true, text: 'End-to-End Metal Manufacturing.' },
  { text: ' We take a ' },
  { emphasis: true, text: 'Requirement' },
  { text: ' — a drawing, a sample, a concept, or a problem to solve — and convert it into a ' },
  { emphasis: true, text: 'Manufactured product' },
  { text: '.' },
]

type ServiceCard = {
  accentTitle?: boolean | null
  hoverMedia?: number | null
  id?: string | null
  image?: number | null
  title?: string | null
}

type LayoutBlock = {
  blockType: string
  cards?: ServiceCard[]
  headingSegments?: { emphasis?: boolean | null; text?: string | null }[]
}

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'pages',
  depth: 0,
  limit: 1,
  overrideAccess: true,
  where: { slug: { equals: 'home' } },
})

const home = docs[0]
if (!home) {
  console.error('No page with slug "home".')
  process.exit(1)
}

const layout = ((home as unknown as { layout?: LayoutBlock[] }).layout ?? []).slice()
const index = layout.findIndex((block) => block.blockType === 'homeServices')

if (index === -1) {
  console.error('The home layout has no homeServices block.')
  process.exit(1)
}

const block = layout[index]
const existing = block.cards ?? []
const byTitle = new Map(
  existing.map((card) => [(card.title ?? '').trim().toLowerCase(), card] as const),
)

console.log('cards before:', existing.map((card) => card.title).join(' | ') || '(none)')

const cards = SERVICES.map((title) => {
  const match = byTitle.get(title.trim().toLowerCase())

  return {
    // Keep artwork an editor already attached to this service.
    hoverMedia: match?.hoverMedia ?? null,
    image: match?.image ?? null,
    title,
  }
})

const dropped = existing
  .map((card) => card.title ?? '')
  .filter((title) => !SERVICES.some((service) => service.toLowerCase() === title.toLowerCase()))

if (dropped.length) {
  console.log('dropped (no longer in the six):', dropped.join(' | '))
}

layout[index] = {
  ...block,
  cards,
  // An editor's own heading runs win; this only fills an empty one.
  headingSegments: block.headingSegments?.length ? block.headingSegments : HEADING_SEGMENTS,
}

await payload.update({
  collection: 'pages',
  data: { layout } as never,
  id: home.id,
  overrideAccess: true,
})

const updated = await payload.findByID({ collection: 'pages', depth: 0, id: home.id })
const updatedBlock = ((updated as unknown as { layout?: LayoutBlock[] }).layout ?? []).find(
  (item) => item.blockType === 'homeServices',
)

console.log('cards after: ', (updatedBlock?.cards ?? []).map((card) => card.title).join(' | '))
console.log('heading runs:', updatedBlock?.headingSegments?.length ?? 0)

process.exit(0)
