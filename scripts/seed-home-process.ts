/**
 * Writes the six-step manufacturing process into the home page's process
 * block: the agreed titles, rail labels and one-line descriptions, plus the
 * closing "Custom Product Development" panel.
 *
 * Icons already uploaded against each step are kept -- steps are matched by
 * position, so the icon on step three stays on step three whatever its title
 * becomes. Defaults in src/data/home.ts only apply when a field is empty, and
 * the block's titles were authored under the earlier wording, hence this.
 *
 * Idempotent: re-running writes the same content.
 *
 *   pnpm run seed:home-process
 */
import process from 'node:process'

import config from '@payload-config'
import { getPayload } from 'payload'

import {
  defaultHomeProcessCta,
  defaultHomeProcessIntro,
  defaultHomeProcessSteps,
  defaultHomeProcessSummary,
} from '../src/data/homeProcessDefaults'

type StepRow = {
  description?: string | null
  id?: string | null
  infographicImage?: number | null
  label?: string | null
  title?: string | null
}

type Segment = { emphasis?: boolean | null; text: string }

type ProcessBlock = {
  blockType: string
  cta?: Record<string, string | null | undefined> | null
  heading?: string | null
  intro?: Segment[] | null
  steps?: StepRow[]
  summary?: Segment[] | null
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

const layout = ((home as unknown as { layout?: ProcessBlock[] }).layout ?? []).slice()
const index = layout.findIndex((block) => block.blockType === 'homeProcess')
if (index === -1) {
  console.error('The home layout has no homeProcess block.')
  process.exit(1)
}

const block = layout[index]
const existing = block.steps ?? []

console.log('steps before:', existing.map((step) => step.title).join(' | ') || '(none)')

const steps = defaultHomeProcessSteps.map((step, position) => ({
  description: step.description,
  // Icons are the one thing an editor uploaded; carry them across by position.
  infographicImage: existing[position]?.infographicImage ?? null,
  label: step.label,
  title: step.title,
}))

if (existing.length > steps.length) {
  console.log(
    'dropped (beyond six):',
    existing
      .slice(steps.length)
      .map((step) => step.title)
      .join(' | '),
  )
}

layout[index] = {
  ...block,
  cta: { ...defaultHomeProcessCta, ...stripEmpty(block.cta) },
  heading: 'Our Manufacturing Process',
  /*
   * Rewritten from the defaults, like the steps and heading above: this script
   * owns the section's structural copy. Edit it in src/data/homeProcessDefaults
   * and re-run, or edit in the admin and simply do not re-run.
   */
  intro: defaultHomeProcessIntro.map((segment) => ({ ...segment })),
  steps,
  summary: defaultHomeProcessSummary.map((segment) => ({ ...segment })),
}

await payload.update({
  collection: 'pages',
  data: { layout } as never,
  id: home.id,
  overrideAccess: true,
})

const updated = await payload.findByID({ collection: 'pages', depth: 0, id: home.id })
const after = ((updated as unknown as { layout?: ProcessBlock[] }).layout ?? []).find(
  (item) => item.blockType === 'homeProcess',
)

console.log('steps after: ', (after?.steps ?? []).map((step) => `${step.label} · ${step.title}`).join(' | '))
console.log('icons kept:  ', (after?.steps ?? []).filter((step) => step.infographicImage).length, 'of', steps.length)
console.log('closing panel:', after?.cta?.heading)

process.exit(0)

function stripEmpty(value: Record<string, string | null | undefined> | null | undefined) {
  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value ?? {})) {
    if (entry) result[key] = entry
  }
  return result
}
