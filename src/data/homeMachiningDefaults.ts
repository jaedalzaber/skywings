/*
 * Client-safe shapes and defaults for the home machining capability section.
 * Kept apart from '@/data/home' so the client component can value-import them
 * without pulling the Payload client into the browser bundle -- the same split
 * the locations and process sections use.
 *
 * The section is a summary of /capabilities, not a list of its own: its rows
 * are the capability processes, its machines and photographs are the ones on
 * those records. `toHomeMachiningGroups` is the one place that turns the
 * capabilities page's data into the home panel's, so the two cannot drift.
 */
import {
  buildCapabilitySlides,
  defaultCapabilityProcesses,
  machineLabel,
  type CapabilityProcess,
} from './capabilityDefaults'

export type HomeMachiningImage = {
  alt: string
  url: string
}

export type HomeMachiningMachine = {
  id: string
  /** "Bodor · C-Series — Laser machine", set in mono capitals. */
  label: string
}

/** One photograph in a group's carousel. */
export type HomeMachiningSlide = {
  id: string
  image: HomeMachiningImage
  /**
   * `process`: the work itself, cropped to fill the frame. `machine`: a
   * machine photograph, shown whole -- a machine cut off at its edges says
   * less than a smaller one uncropped.
   */
  kind: 'machine' | 'process'
  /** Set on a machine's photographs, so its row in the list can light up. */
  machineId: string | null
}

export type HomeMachiningGroup = {
  /** Stable key, also used to build the panel's aria ids. */
  id: string
  machines: HomeMachiningMachine[]
  /** The process at work first, then each machine's photographs in list order. */
  slides: HomeMachiningSlide[]
  title: string
}

export type HomeMachiningStat = {
  label: string
  value: string
}

/**
 * The capabilities page's processes as the home panel shows them: the title,
 * the machines, and the photographs -- no summary and no typical outputs,
 * which are what /capabilities is for.
 *
 * A machine without a photograph keeps its row but adds no slide: the
 * capabilities page holds a placeholder for it, the home carousel only shows
 * pictures. A process with neither machines nor photographs is left off, since
 * its panel would open onto nothing; it appears once either is added.
 */
export function toHomeMachiningGroups(
  processes: readonly CapabilityProcess[],
): HomeMachiningGroup[] {
  return processes
    .map((process) => ({
      id: process.slug || process.id,
      machines: process.machines.map((machine) => ({
        id: machine.id,
        label: machineLabel(machine),
      })),
      slides: buildCapabilitySlides(process).flatMap((slide) =>
        slide.image
          ? [
              {
                id: slide.id,
                image: { alt: slide.image.alt, url: slide.image.url },
                kind: slide.kind,
                machineId: slide.machineId,
              },
            ]
          : [],
      ),
      title: process.title,
    }))
    .filter((group) => group.machines.length > 0 || group.slides.length > 0)
}

/*
 * Set beside the heading, in the half of the row the title cell leaves. The
 * company's own figures, edited on the block; the machine list below is the
 * named machine park from the profile, not the full asset register.
 */
export const defaultHomeMachiningStats: readonly HomeMachiningStat[] = [
  { label: 'Machines', value: '30+' },
  { label: 'Skilled workers', value: '50+' },
]

export const defaultHomeMachiningIntro = {
  eyebrow: 'Machining capability',
  heading: 'Machining\ncapability',
}

/**
 * The committed profile content, for when the CMS cannot be reached. It has no
 * photographs -- those only ever live on the Capabilities and Machines records.
 */
export const defaultHomeMachiningGroups: readonly HomeMachiningGroup[] = toHomeMachiningGroups(
  defaultCapabilityProcesses,
)
