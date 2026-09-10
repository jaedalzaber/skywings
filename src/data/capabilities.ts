import type { Capability, Machine } from '@/payload-types'

import { getCapabilities, getMachines } from './catalog'
import {
  defaultCapabilitiesCopy,
  defaultCapabilityProcesses,
  type CapabilitiesCopy,
  type CapabilityImage,
  type CapabilityMachine,
  type CapabilityProcess,
} from './capabilityDefaults'
import { getMediaImage } from './media'
import type { PageLayout } from './pages'
import { relationId } from './relations'

function image(value: unknown): CapabilityImage | null {
  const media = getMediaImage(value)

  return media ? { alt: media.alt, url: media.url } : null
}

/** A gallery array from the admin, keeping each entry's caption. */
function gallery(
  entries: { caption?: string | null; image: unknown }[] | null | undefined,
): CapabilityImage[] {
  return (entries ?? []).flatMap((entry) => {
    const picture = image(entry.image)
    return picture ? [{ ...picture, caption: entry.caption || null }] : []
  })
}

/*
 * A machine that is planned has not reached the floor, and a retired one has
 * left it: neither belongs on a page that says what the shop can do today.
 * Maintenance is a passing state, so those stay listed.
 */
function isOnTheFloor(machine: Machine) {
  return machine.machineStatus !== 'planned' && machine.machineStatus !== 'retired'
}

function toMachine(machine: Machine): CapabilityMachine {
  return {
    brand: machine.brand || null,
    capacity: machine.capacity || null,
    gallery: gallery(machine.gallery),
    id: String(machine.id),
    image: image(machine.featuredImage),
    machineType: machine.machineType,
    model: machine.model || null,
    summary: machine.summary || null,
  }
}

/**
 * Capabilities and machines as the page renders them: each process carries
 * the machines that belong to it, in their own sort order.
 *
 * Pure, so the grouping can be tested without a database. Machines whose
 * capability is not in the list are dropped rather than shown loose -- they
 * belong to a process that is unpublished.
 */
export function buildCapabilityProcesses(
  capabilities: Capability[],
  machines: Machine[],
): CapabilityProcess[] {
  const byCapability = new Map<string, Machine[]>()

  for (const machine of machines.filter(isOnTheFloor)) {
    const key = relationId(machine.capability)
    if (!key) continue
    byCapability.set(key, [...(byCapability.get(key) ?? []), machine])
  }

  return capabilities.map((capability) => {
    const own = (byCapability.get(String(capability.id)) ?? []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )

    return {
      gallery: gallery(capability.gallery),
      id: String(capability.id),
      image: image(capability.featuredImage),
      machines: own.map(toMachine),
      outputs: (capability.typicalOutputs ?? []).map((output) => ({
        image: image(output.image),
        label: output.label,
      })),
      slug: capability.slug,
      summary: capability.summary,
      title: capability.title,
    }
  })
}

/**
 * The processes for the capabilities page. Falls back to the committed profile
 * content when the CMS holds no capabilities, or cannot be reached, so the
 * page is never empty.
 */
export async function getCapabilityProcesses(): Promise<CapabilityProcess[]> {
  try {
    const [capabilities, machines] = await Promise.all([getCapabilities(), getMachines()])

    if (!capabilities.length) return [...defaultCapabilityProcesses]

    return buildCapabilityProcesses(capabilities, machines)
  } catch (error) {
    console.error('Unable to load capabilities and machines', error)

    return [...defaultCapabilityProcesses]
  }
}

/*
 * Page copy from the "capabilities" page in the Pages collection: its hero
 * block is the head, its capability-listing block the closing band. Field by
 * field, so clearing one in the admin brings its default back rather than an
 * empty heading.
 */
export function capabilitiesCopyFromLayout(layout: PageLayout): CapabilitiesCopy {
  const hero = layout.find((block) => block.blockType === 'pageHero')
  const listing = layout.find((block) => block.blockType === 'capabilityListing')
  const text = (value: unknown, fallback: string) =>
    typeof value === 'string' && value.trim() ? value : fallback
  const field = (block: unknown, key: string) =>
    block && typeof block === 'object' ? (block as Record<string, unknown>)[key] : undefined
  const fallback = defaultCapabilitiesCopy

  return {
    closingHeading: text(field(listing, 'heading'), fallback.closingHeading),
    closingStatement: text(field(listing, 'description'), fallback.closingStatement),
    description: text(field(hero, 'description'), fallback.description),
    eyebrow: text(field(hero, 'eyebrow'), fallback.eyebrow),
    heading: text(field(hero, 'heading'), fallback.heading),
    primaryHref: text(field(hero, 'primaryHref'), fallback.primaryHref),
    primaryLabel: text(field(hero, 'primaryLabel'), fallback.primaryLabel),
    secondaryHref: text(field(hero, 'secondaryHref'), fallback.secondaryHref),
    secondaryLabel: text(field(hero, 'secondaryLabel'), fallback.secondaryLabel),
  }
}
