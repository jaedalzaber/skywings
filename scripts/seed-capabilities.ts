/**
 * Writes the company profile's process capabilities into the admin: each
 * process (Capabilities), the machines that run it (Machines), and its typical
 * outputs. The capabilities page renders from these records, and they are
 * where the photographs go -- nothing here uploads an image.
 *
 * The processes already exist: the dummy catalog seed created them, and
 * products link to them. So this updates those records in place, matched by
 * slug, and never creates a second set.
 *
 * It never overwrites what an editor has written. On an existing process it
 * only replaces what the dummy seed left behind -- its generic three outputs
 * and its generated placeholder photograph -- and it only creates machines
 * that are missing. FORCE=1 overwrites summaries, outputs and machine details
 * with the profile content (photographs are still left alone).
 *
 *   pnpm run seed:capabilities
 *   FORCE=1 pnpm run seed:capabilities
 *
 * revalidateTag is a no-op outside a request, so a running dev server keeps
 * its cached page afterwards: save any capability in the admin, or stop dev,
 * run `pnpm run refresh:cache`, and restart.
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Capability, Machine, Media } from '../src/payload-types'
import { capabilityProcessSeeds, defaultCapabilitiesCopy } from '../src/data/capabilityDefaults'

const force = process.env.FORCE === '1'
const payload = await getPayload({ config })

/** What seed-dummy-catalog.ts put on every capability, and nothing else. */
const DUMMY_OUTPUTS = [
  'Project-specific parts',
  'Production-ready assemblies',
  'Quality-controlled finishing',
]

/*
 * Hero headings the capabilities page has shipped with as committed defaults,
 * before the profile content. A page still holding one of these was never
 * edited, so its copy is safe to replace; anything else is an editor's and is
 * left alone. The first is what the live page held when this seed was written
 * (from the "Initial Review" commit), the second its later default.
 */
const PREVIOUS_HERO_HEADINGS = new Set([
  'Manufacturing capability under one roof.',
  'Manufacturing capability under one accountable team.',
])

function isDummyOutputs(capability: Capability) {
  const labels = (capability.typicalOutputs ?? []).map((output) => output.label)
  return (
    labels.length === 0 ||
    (labels.length === DUMMY_OUTPUTS.length &&
      labels.every((label, i) => label === DUMMY_OUTPUTS[i]))
  )
}

/*
 * The dummy seed generated a card-style PNG per capability and gave it this
 * exact alt text. Matching on it unlinks those placeholders and nothing an
 * editor uploaded -- the Media document itself is left in the library.
 */
function hasDummyPhoto(capability: Capability) {
  const media = capability.featuredImage
  return (
    typeof media === 'object' &&
    media !== null &&
    (media as Media).alt === `${capability.title} capability image`
  )
}

function machineName(machine: { brand: string | null; machineType: string; model: string | null }) {
  return [machine.brand, machine.model, machine.machineType].filter(Boolean).join(' ')
}

const report: string[] = []

for (const [index, seed] of capabilityProcessSeeds.entries()) {
  const { docs } = await payload.find({
    collection: 'capabilities',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: seed.slug } },
  })

  let capability = docs[0] as Capability | undefined
  const outputs = seed.outputs.map((label) => ({ label }))

  if (!capability) {
    capability = (await payload.create({
      collection: 'capabilities',
      data: {
        _status: 'published',
        processType: seed.processType,
        slug: seed.slug,
        sortOrder: index + 1,
        summary: seed.summary,
        title: seed.title,
        typicalOutputs: outputs,
      },
      overrideAccess: true,
    })) as Capability
    report.push(`+ ${seed.title}: created`)
  } else {
    const data: Record<string, unknown> = { _status: 'published' }
    const changes: string[] = []

    if (force || isDummyOutputs(capability)) {
      data.typicalOutputs = outputs
      changes.push(`${outputs.length} outputs`)
    }
    if (force) {
      data.summary = seed.summary
      changes.push('summary')
    }
    if (hasDummyPhoto(capability)) {
      data.featuredImage = null
      changes.push('placeholder photo unlinked')
    }

    if (changes.length) {
      await payload.update({
        collection: 'capabilities',
        data,
        id: capability.id,
        overrideAccess: true,
      })
      report.push(`~ ${seed.title}: ${changes.join(', ')}`)
    } else {
      report.push(`= ${seed.title}: left as authored`)
    }
  }

  for (const [machineIndex, machine] of seed.machines.entries()) {
    const findBySlug = async (slug: string) => {
      const { docs: matches } = await payload.find({
        collection: 'machines',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { slug: { equals: slug } },
      })
      return matches[0] as Machine | undefined
    }

    /*
     * An earlier run of this seed named several machines from the profile's
     * process pages, which mislabel them. A record still under one of those
     * slugs is the same machine: it is corrected and renamed in place, so the
     * floor is not listed twice and any photograph already uploaded stays on it.
     */
    let found = await findBySlug(machine.slug)
    let renamedFrom: string | null = null
    for (const previous of machine.previousSlugs ?? []) {
      if (found) break
      found = await findBySlug(previous)
      if (found) renamedFrom = previous
    }

    const data = {
      _status: 'published' as const,
      brand: machine.brand,
      capability: capability.id,
      capacity: machine.capacity,
      machineStatus: 'active' as const,
      machineType: machine.machineType,
      model: machine.model,
      name: machineName(machine),
      slug: machine.slug,
      sortOrder: machineIndex + 1,
      summary: machine.summary,
    }

    if (!found) {
      await payload.create({ collection: 'machines', data, overrideAccess: true })
      report.push(`  + machine ${data.name}`)
    } else if (renamedFrom) {
      await payload.update({ collection: 'machines', data, id: found.id, overrideAccess: true })
      report.push(`  ~ machine ${data.name} (corrected, was ${renamedFrom})`)
    } else if (force) {
      await payload.update({ collection: 'machines', data, id: found.id, overrideAccess: true })
      report.push(`  ~ machine ${data.name}`)
    }
  }
}

/*
 * Capabilities the profile does not cover (the dummy seed also made Welding &
 * Assembly and Surface Treatment & Finishing). Left exactly as they are --
 * products link to them -- but listed, because they appear on the page too.
 */
const seeded = new Set(capabilityProcessSeeds.map((seed) => seed.slug))
const { docs: all } = await payload.find({
  collection: 'capabilities',
  depth: 1,
  limit: 200,
  overrideAccess: true,
})
for (const other of all as Capability[]) {
  if (seeded.has(other.slug)) continue
  if (hasDummyPhoto(other)) {
    await payload.update({
      collection: 'capabilities',
      data: { _status: 'published', featuredImage: null },
      id: other.id,
      overrideAccess: true,
    })
  }
  report.push(
    `! ${other.title}: not in the profile, left in place${hasDummyPhoto(other) ? ' (placeholder photo unlinked)' : ''}${isDummyOutputs(other) ? ' -- still has the dummy outputs' : ''}`,
  )
}

/*
 * The page's copy lives on the "capabilities" page in Pages. Replaced only
 * while it still holds a previously shipped default (PREVIOUS_HERO_HEADINGS),
 * so an editor's wording stands.
 */
const { docs: pages } = await payload.find({
  collection: 'pages',
  depth: 0,
  limit: 1,
  overrideAccess: true,
  where: { slug: { equals: 'capabilities' } },
})
const page = pages[0] as { id: number; layout?: Array<Record<string, unknown>> } | undefined

if (!page) {
  report.push('= Pages/capabilities: none -- the page renders its committed copy')
} else {
  const layout = (page.layout ?? []).map((block) => ({ ...block }))
  const hero = layout.find((block) => block.blockType === 'pageHero')
  const listing = layout.find((block) => block.blockType === 'capabilityListing')

  if (force || !hero || PREVIOUS_HERO_HEADINGS.has(String(hero.heading))) {
    const copy = defaultCapabilitiesCopy
    if (hero) {
      Object.assign(hero, {
        description: copy.description,
        eyebrow: copy.eyebrow,
        heading: copy.heading,
      })
    } else {
      layout.unshift({
        blockType: 'pageHero',
        description: copy.description,
        eyebrow: copy.eyebrow,
        heading: copy.heading,
        primaryHref: copy.primaryHref,
        primaryLabel: copy.primaryLabel,
        secondaryHref: copy.secondaryHref,
        secondaryLabel: copy.secondaryLabel,
      })
    }
    if (listing) {
      Object.assign(listing, {
        description: copy.closingStatement,
        eyebrow: 'Integrated',
        heading: copy.closingHeading,
      })
    } else {
      layout.push({
        blockType: 'capabilityListing',
        description: copy.closingStatement,
        eyebrow: 'Integrated',
        heading: copy.closingHeading,
      })
    }

    await payload.update({
      collection: 'pages',
      data: { _status: 'published', layout } as never,
      id: page.id,
      overrideAccess: true,
    })
    report.push('~ Pages/capabilities: copy set from the profile')
  } else {
    report.push('= Pages/capabilities: copy left as authored')
  }
}

console.log(report.join('\n'))
console.log(
  `\nDone${force ? ' (FORCE)' : ''}. Upload photographs in the admin under Manufacturing.`,
)
