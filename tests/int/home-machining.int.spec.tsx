import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeMachiningSection } from '@/components/home/HomeMachiningSection'
import { defaultCapabilityProcesses, type CapabilityProcess } from '@/data/capabilityDefaults'
import {
  defaultHomeMachiningGroups,
  defaultHomeMachiningIntro,
  defaultHomeMachiningStats,
  toHomeMachiningGroups,
  type HomeMachiningGroup,
} from '@/data/homeMachiningDefaults'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
const homeData = readFileSync(resolve(process.cwd(), 'src/data/home.ts'), 'utf8')

const photo = (name: string) => ({ alt: `${name} photo`, url: `/media/${name}.png` })

/*
 * A process as the Capabilities and Machines collections deliver it: its own
 * photograph, one machine with a photograph and one still without.
 */
const laser: CapabilityProcess = {
  gallery: [],
  id: '1',
  image: photo('laser-process'),
  machines: [
    {
      brand: 'Bodor',
      capacity: null,
      gallery: [],
      id: '11',
      image: photo('bodor'),
      machineType: 'Laser machine',
      model: 'C-Series',
      summary: 'Cuts sheet.',
    },
    {
      brand: null,
      capacity: null,
      gallery: [],
      id: '12',
      image: null,
      machineType: 'Plasma table',
      model: null,
      summary: null,
    },
  ],
  outputs: [{ image: null, label: 'Brackets' }],
  slug: 'laser-cutting',
  summary: 'Profiles cut from sheet.',
  title: 'Laser Cutting',
}

const shearing: CapabilityProcess = {
  ...laser,
  id: '2',
  image: photo('shear'),
  machines: [],
  slug: 'shearing',
  summary: 'Straight cuts.',
  title: 'Shearing',
}

function renderMachining(groups?: readonly HomeMachiningGroup[]) {
  const { container } = render(<HomeMachiningSection groups={groups} />)
  const section = container.querySelector('#machining-capability') as HTMLElement

  return { container, queries: within(section), section }
}

const rowFor = (section: HTMLElement, title: string) =>
  within(section).getByRole('button', { name: title })

const itemFor = (section: HTMLElement, title: string) =>
  rowFor(section, title).closest('.machining-item') as HTMLElement

describe('HomeMachiningSection', () => {
  afterEach(cleanup)

  test('renders the dark section with a row per capability process', () => {
    const { queries, section } = renderMachining()

    expect(queries.getByRole('heading', { level: 2, name: /Machining\s+capability/ })).toBeTruthy()
    // Drives the header's light-on-dark treatment while the bar is over it.
    expect(section.getAttribute('data-nav-surface')).toBe('dark')
    expect(section.querySelectorAll('.machining-item')).toHaveLength(
      defaultHomeMachiningGroups.length,
    )
    expect(queries.getByText(defaultHomeMachiningIntro.eyebrow)).toBeTruthy()

    for (const group of defaultHomeMachiningGroups) {
      expect(rowFor(section, group.title)).toBeTruthy()
    }
  })

  /*
   * The rows are the capabilities page's processes, not a second hand-typed
   * list: one conversion feeds the home panel from the same records, so a
   * machine or photograph added in the admin shows in both places.
   */
  test('builds its rows from the capability records the capabilities page uses', () => {
    const [group, shear] = toHomeMachiningGroups([laser, shearing])

    expect(group.title).toBe('Laser Cutting')
    expect(group.machines).toEqual([
      { id: '11', label: 'Bodor · C-Series — Laser machine' },
      { id: '12', label: 'Plasma table' },
    ])
    // The process at work, then each machine that has a photograph.
    expect(group.slides.map((slide) => [slide.kind, slide.image.url, slide.machineId])).toEqual([
      ['process', '/media/laser-process.png', null],
      ['machine', '/media/bodor.png', '11'],
    ])
    // Only the title, machines and photographs -- no summary, no outputs.
    expect(Object.keys(group).sort()).toEqual(['id', 'machines', 'slides', 'title'])
    expect(shear.machines).toEqual([])

    // A process with nothing to show yet is left off until it has something.
    const empty = { ...shearing, image: null, slug: 'welding', title: 'Welding' }
    expect(toHomeMachiningGroups([empty])).toEqual([])

    // The defaults are the committed profile, run through the same conversion.
    expect(defaultHomeMachiningGroups).toEqual(toHomeMachiningGroups(defaultCapabilityProcesses))
    // And the live page reads the collections, refreshed when either changes.
    expect(homeData).toMatch(
      /syncHomeMachiningBlock\(block, toHomeMachiningGroups\(await getCapabilityProcesses\(\)\)\)/,
    )
    expect(homeData).toMatch(/TAGS\.capabilities,\s*TAGS\.machines,/)
  })

  /*
   * The full shop -- every process, its real machines, and their photographs
   * -- lives on /capabilities. This shelf hands the reader off to it rather
   * than pretending six groups is the whole list.
   */
  test('hands off to /capabilities for the rest of the shop', () => {
    const { section } = renderMachining()
    const block = stylesheet.slice(stylesheet.indexOf('.machining {'))

    const link = within(section).getByRole('link', { name: /View all capabilities/ })
    expect(link.getAttribute('href')).toBe('/capabilities')
    // Ruled off from the list, in the section's own dark-outline CTA pattern.
    expect(block).toMatch(/\.machining-cta \{[^}]*border-top: 1px solid var\(--machining-line\);/s)
    expect(block).toMatch(
      /\.machining-cta-link \{[^}]*border: 1px solid rgba\(255, 255, 255, 0\.7\);[^}]*color: #ffffff;/s,
    )
    expect(block).toMatch(
      /\.machining-cta-link:hover,\s*\.machining-cta-link:focus-visible \{[^}]*color: var\(--machining-accent\);[^}]*background: #ffffff;/s,
    )
  })

  test('frames the heading in the left half, with no section number', () => {
    const { section } = renderMachining()
    const block = stylesheet.slice(stylesheet.indexOf('.machining {'))

    // The cell is half the row; the rule under it runs the full width.
    expect(block).toMatch(/\.machining-head \{[^}]*grid-template-columns:\s*1fr 1fr;/s)
    expect(block).toMatch(
      /\.machining-head-title \{[^}]*border: 1px solid var\(--machining-line\);/s,
    )
    expect(section.querySelector('.machining-code')).toBeNull()
    // Nothing but the eyebrow and the heading in the cell -- no "4.0" mark.
    const cell = section.querySelector('.machining-head-title') as HTMLElement
    expect(cell.textContent).toBe(
      `${defaultHomeMachiningIntro.eyebrow}${defaultHomeMachiningIntro.heading.replace('\n', ' ')}`,
    )
  })

  test('sets the figures in the half the title cell leaves', () => {
    const { section } = renderMachining()
    const block = stylesheet.slice(stylesheet.indexOf('.machining {'))
    const stats = Array.from(section.querySelectorAll('.machining-stat'))

    expect(stats).toHaveLength(defaultHomeMachiningStats.length)
    expect(
      stats.map((stat) => ({
        label: stat.querySelector('.machining-stat-label')?.textContent,
        value: stat.querySelector('.machining-stat-value')?.textContent,
      })),
    ).toEqual(defaultHomeMachiningStats.map(({ label, value }) => ({ label, value })))

    /*
     * A description list, so the pairing survives without the styling: the
     * label leads in the document and the figure is lifted above it.
     */
    expect((section.querySelector('.machining-stats') as HTMLElement).tagName).toBe('DL')
    expect(stats[0].firstElementChild?.tagName).toBe('DT')
    expect(block).toMatch(/\.machining-stat \{[^}]*flex-direction: column-reverse;/s)
    // Centred on the title cell rather than stretched to its height.
    expect(block).toMatch(/\.machining-stats \{[^}]*align-self: center;/s)
  })

  test('holds every open panel to one height, with the machine list scrolling inside', () => {
    const block = stylesheet.slice(stylesheet.indexOf('.machining {'))

    expect(block).toMatch(/--machining-panel-height: clamp\(17rem, 30vw, 26rem\);/)
    expect(block).toMatch(/\.machining-machines \{[^}]*overflow-y: auto;/s)

    /*
     * The height belongs to the grid track, not the panel's contents: a grid
     * item with a height of its own ignores the track and stands full size
     * whether the row is open or shut. Both ends are lengths so it eases.
     */
    expect(block).toMatch(/\.machining-panel \{[^}]*grid-template-rows: 0px;/s)
    expect(block).toMatch(
      /\.machining-panel\[data-open='true'\] \{[^}]*grid-template-rows: var\(--machining-panel-height\);/s,
    )
    expect(block).toMatch(/\.machining-panel-inner \{[^}]*height: 100%;\s*min-height: 0;/s)

    // Stacked, the panel is sized by its content on the 0fr/1fr track instead.
    const stacked = block.slice(block.indexOf('@media (max-width: 47.99rem)'))
    expect(stacked).toMatch(/\.machining-panel \{\s*grid-template-rows: 0fr;/s)
    expect(stacked).toMatch(/\.machining-panel\[data-open='true'\] \{\s*grid-template-rows: 1fr;/s)
    expect(stacked).toMatch(/\.machining-panel-inner \{[^}]*height: auto;/s)
  })

  test('opens the first group on arrival and lists its machines', () => {
    const { section } = renderMachining()
    const first = defaultHomeMachiningGroups[0]

    expect(rowFor(section, first.title).getAttribute('aria-expanded')).toBe('true')
    expect(itemFor(section, first.title).dataset.open).toBe('true')

    const panel = within(section).getByRole('region', { name: first.title })
    for (const machine of first.machines) {
      expect(within(panel).getByText(machine.label)).toBeTruthy()
    }
    // Nothing from the capabilities page but the title, machines and pictures.
    expect(panel.querySelector('.capabilities-outputs, .capabilities-process-summary')).toBeNull()
  })

  test('opening a group closes the one that was open, and a row toggles shut', () => {
    const { section } = renderMachining()
    const [first, second] = defaultHomeMachiningGroups

    fireEvent.click(rowFor(section, second.title))
    expect(rowFor(section, second.title).getAttribute('aria-expanded')).toBe('true')
    expect(rowFor(section, first.title).getAttribute('aria-expanded')).toBe('false')
    expect(section.querySelectorAll('.machining-item[data-open="true"]')).toHaveLength(1)

    fireEvent.click(rowFor(section, second.title))
    expect(section.querySelectorAll('.machining-item[data-open="true"]')).toHaveLength(0)
  })

  test('the arrows step through a group with more than one photograph', () => {
    const { section } = renderMachining(toHomeMachiningGroups([laser, shearing]))
    const panel = within(section).getByRole('region', { name: 'Laser Cutting' })
    const image = () => panel.querySelector('.machining-media-image') as HTMLImageElement
    const frame = () => panel.querySelector('.machining-media-frame') as HTMLElement

    expect(image().getAttribute('src')).toBe('/media/laser-process.png')
    expect(frame().dataset.kind).toBe('process')
    fireEvent.click(within(panel).getByRole('button', { name: 'Next Laser Cutting photograph' }))
    expect(image().getAttribute('src')).toBe('/media/bodor.png')
    // A machine is shown whole rather than cropped to the frame.
    expect(frame().dataset.kind).toBe('machine')

    // Wraps rather than stopping at the end.
    fireEvent.click(within(panel).getByRole('button', { name: 'Next Laser Cutting photograph' }))
    expect(image().getAttribute('src')).toBe('/media/laser-process.png')
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Previous Laser Cutting photograph' }),
    )
    expect(image().getAttribute('src')).toBe('/media/bodor.png')
    expect(stylesheet).toMatch(
      /\.machining-media-frame\[data-kind='machine'\] \.machining-media-image \{[^}]*object-fit: contain;/s,
    )
  })

  /*
   * The list and the carousel are one control: a machine with a photograph is
   * a button that brings it up, and the one on screen is marked. A machine with
   * no photograph yet is listed, but has nothing to bring up.
   */
  test('a machine in the list brings up its own photograph', () => {
    const { section } = renderMachining(toHomeMachiningGroups([laser, shearing]))
    const panel = within(section).getByRole('region', { name: 'Laser Cutting' })
    const image = () => panel.querySelector('.machining-media-image') as HTMLImageElement
    const bodor = within(panel).getByRole('button', { name: 'Bodor · C-Series — Laser machine' })

    expect(bodor.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(bodor)
    expect(image().getAttribute('src')).toBe('/media/bodor.png')
    expect(bodor.getAttribute('aria-pressed')).toBe('true')
    expect(bodor.getAttribute('aria-controls')).toBe(
      panel.querySelector('.machining-media')?.getAttribute('id'),
    )

    expect(within(panel).queryByRole('button', { name: 'Plasma table' })).toBeNull()
    expect(within(panel).getByText('Plasma table').tagName).toBe('SPAN')
  })

  test('a single-photograph group has no arrows', () => {
    const { section } = renderMachining(toHomeMachiningGroups([laser, shearing]))

    fireEvent.click(rowFor(section, 'Shearing'))
    const panel = within(section).getByRole('region', { name: 'Shearing' })
    expect(panel.querySelector('.machining-media-image')?.getAttribute('src')).toBe(
      '/media/shear.png',
    )
    expect(panel.querySelector('.machining-media-nav')).toBeNull()
  })

  test('the open row takes the brand blue, not the reference orange', () => {
    const block = stylesheet.slice(stylesheet.indexOf('.machining {'))

    expect(block).toContain('--machining-accent: var(--blue);')
    expect(block).toMatch(
      /\.machining-item\[data-open='true'\] \.machining-row \{[^}]*background: var\(--machining-accent\);/,
    )
    // Full-bleed dark surface, as with the process section above it.
    expect(block).toMatch(/--machining-surface: #1c1c1c;/)
  })
})
