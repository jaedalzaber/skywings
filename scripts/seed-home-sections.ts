/**
 * Adds the machining, engineering and locations blocks to the home page so
 * their content can be edited in the admin.
 *
 * Each section already renders from the committed defaults with no block at
 * all; this writes those same defaults into the page as an editable block and
 * puts each one where it renders -- machining and engineering after the
 * industries block, locations after the process block.
 *
 * Idempotent, and it never overwrites: a block already on the page is left
 * exactly as an editor left it, so re-running only fills in what is missing.
 *
 *   pnpm run seed:home-sections
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import {
  defaultHomeEngineeringDisciplines,
  defaultHomeEngineeringIntro,
  defaultHomeEngineeringNote,
} from '../src/data/homeEngineeringDefaults'
import { defaultLocationsTitle } from '../src/data/homeLocationsDefaults'
import {
  defaultHomeMachiningGroups,
  defaultHomeMachiningIntro,
  defaultHomeMachiningStats,
} from '../src/data/homeMachiningDefaults'

type Block = { blockType: string } & Record<string, unknown>

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

const layout = ((home as unknown as { layout?: Block[] }).layout ?? []).slice()
console.log('layout before:', layout.map((block) => block.blockType).join(' | ') || '(empty)')

/*
 * Photographs are left unset. The machine photography is not shot yet and the
 * defaults point at committed stills the components already fall back to, so
 * writing them here would only set upload fields the admin cannot resolve.
 */
const machiningBlock: Block = {
  blockType: 'homeMachining',
  eyebrow: defaultHomeMachiningIntro.eyebrow,
  groups: defaultHomeMachiningGroups.map((group) => ({
    machines: group.machines.map((name) => ({ name })),
    title: group.title,
  })),
  heading: defaultHomeMachiningIntro.heading,
  stats: defaultHomeMachiningStats.map((stat) => ({ label: stat.label, value: stat.value })),
}

const engineeringBlock: Block = {
  blockType: 'homeEngineering',
  code: defaultHomeEngineeringIntro.code,
  disciplines: defaultHomeEngineeringDisciplines.map((discipline) => ({
    copy: (discipline.paragraphs ?? []).join('\n'),
    eyebrow: discipline.eyebrow,
    items: discipline.items.map((text) => ({ text })),
    listLead: discipline.listLead,
    title: discipline.title,
  })),
  heading: defaultHomeEngineeringIntro.heading,
  note: {
    copy: defaultHomeEngineeringNote.paragraphs.join('\n'),
    items: defaultHomeEngineeringNote.items.map((text) => ({ text })),
    listLead: defaultHomeEngineeringNote.listLead,
  },
}

/*
 * Facilities are left empty on purpose: they are edited on the Footer, and the
 * section only prefers this block's rows once someone fills them in.
 */
const locationsBlock: Block = {
  blockType: 'homeLocations',
  lead: defaultLocationsTitle.lead,
  locations: [],
  reach: defaultLocationsTitle.reach,
  regions: defaultLocationsTitle.regions.map((text) => ({ text })),
}

/** Inserts after the named block, or appends when it is not on the page. */
function insertAfter(blocks: Block[], anchor: string, block: Block) {
  if (blocks.some((item) => item.blockType === block.blockType)) {
    console.log(`${block.blockType}: already on the page, left as authored`)
    return blocks
  }

  const next = blocks.slice()
  const index = next.findIndex((item) => item.blockType === anchor)
  next.splice(index === -1 ? next.length : index + 1, 0, block)
  console.log(`${block.blockType}: added${index === -1 ? ' at the end' : ` after ${anchor}`}`)

  return next
}

let nextLayout = insertAfter(layout, 'homeIndustries', machiningBlock)
nextLayout = insertAfter(nextLayout, 'homeMachining', engineeringBlock)
nextLayout = insertAfter(nextLayout, 'homeProcess', locationsBlock)

await payload.update({
  collection: 'pages',
  data: { layout: nextLayout } as never,
  id: home.id,
  overrideAccess: true,
})

const updated = await payload.findByID({ collection: 'pages', depth: 0, id: home.id })
const after = (updated as unknown as { layout?: Block[] }).layout ?? []
console.log('layout after: ', after.map((block) => block.blockType).join(' | '))
/*
 * The revalidate hook needs a request context, so the "[revalidate] skipped
 * tag" lines above are expected here and the home layout stays cached as it
 * was before this ran.
 */
console.log('\nNow run: pnpm run refresh:cache, then restart the dev server.')

process.exit(0)
