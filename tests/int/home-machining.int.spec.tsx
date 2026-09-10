import { cleanup, fireEvent, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeMachiningSection } from '@/components/home/HomeMachiningSection'
import {
  defaultHomeMachiningGroups,
  defaultHomeMachiningIntro,
  defaultHomeMachiningStats,
} from '@/data/homeMachiningDefaults'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

function renderMachining() {
  const { container } = render(<HomeMachiningSection />)
  const section = container.querySelector('#machining-capability') as HTMLElement

  return { container, queries: within(section), section }
}

const rowFor = (section: HTMLElement, title: string) =>
  within(section).getByRole('button', { name: title })

const itemFor = (section: HTMLElement, title: string) =>
  rowFor(section, title).closest('.machining-item') as HTMLElement

describe('HomeMachiningSection', () => {
  afterEach(cleanup)

  test('renders the dark section with a row per capability group', () => {
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

    // The machine count is not a claim the lists below contradict.
    const machines = defaultHomeMachiningGroups.reduce(
      (total, group) => total + group.machines.length,
      0,
    )
    expect(machines).toBeGreaterThanOrEqual(30)

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
      expect(within(panel).getByText(machine)).toBeTruthy()
    }
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
    const { section } = renderMachining()
    const group = defaultHomeMachiningGroups.find((item) => item.images.length > 1)
    if (!group) throw new Error('expected a capability group with several photographs')

    fireEvent.click(rowFor(section, group.title))
    const panel = within(section).getByRole('region', { name: group.title })
    const image = () => panel.querySelector('.machining-media-image') as HTMLImageElement

    expect(image().getAttribute('src')).toBe(group.images[0].url)
    fireEvent.click(within(panel).getByRole('button', { name: `Next ${group.title} photograph` }))
    expect(image().getAttribute('src')).toBe(group.images[1].url)

    // Wraps rather than stopping at the end.
    fireEvent.click(within(panel).getByRole('button', { name: `Next ${group.title} photograph` }))
    expect(image().getAttribute('src')).toBe(group.images[0].url)
    fireEvent.click(
      within(panel).getByRole('button', { name: `Previous ${group.title} photograph` }),
    )
    expect(image().getAttribute('src')).toBe(group.images[group.images.length - 1].url)
  })

  test('a single-photograph group has no arrows', () => {
    const { section } = renderMachining()
    const group = defaultHomeMachiningGroups.find((item) => item.images.length === 1)
    if (!group) throw new Error('expected a capability group with one photograph')

    fireEvent.click(rowFor(section, group.title))
    const panel = within(section).getByRole('region', { name: group.title })
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
