import { cleanup, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'
import {
  defaultEngineeringImage,
  defaultHomeEngineeringDisciplines,
  defaultHomeEngineeringIntro,
  defaultHomeEngineeringNote,
} from '@/data/homeEngineeringDefaults'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
const engineering = stylesheet.slice(stylesheet.indexOf('.engineering {'))

function renderEngineering() {
  const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
  const section = container.querySelector('#engineering') as HTMLElement

  return { container, section, queries: within(section) }
}

describe('HomeEngineeringSection', () => {
  afterEach(cleanup)

  test('sits between the machining capability and the process section', () => {
    const { container, section } = renderEngineering()

    expect(container.querySelector('#machining-capability')?.nextElementSibling).toBe(section)
    expect(section.nextElementSibling?.id).toBe('manufacturing-process')
  })

  test('is a white section, so the header takes its solid treatment over it', () => {
    const { section } = renderEngineering()

    expect(section.getAttribute('data-nav-surface')).toBe('white')
    expect(section.getAttribute('data-responsive-layout')).toBe('engineering')
    expect(engineering).toMatch(/\.engineering \{[^}]*background:\s*#ffffff;/s)
    // No cards, shadows or frosted panels anywhere in the section.
    expect(engineering).not.toMatch(/box-shadow|backdrop-filter/)
  })

  test('heads the section with the title in its own cell', () => {
    const { queries, section } = renderEngineering()

    expect(queries.getByRole('heading', { level: 2 }).textContent).toBe(
      defaultHomeEngineeringIntro.heading,
    )
    expect(section.querySelector('.engineering-head')).not.toBeNull()
  })

  test('sets the disciplines side by side in the blue band, each with its list', () => {
    const { section } = renderEngineering()

    const disciplines = section.querySelectorAll('.engineering-discipline')
    expect(disciplines).toHaveLength(defaultHomeEngineeringDisciplines.length)

    defaultHomeEngineeringDisciplines.forEach((discipline, index) => {
      const cell = within(disciplines[index] as HTMLElement)
      expect(cell.getByRole('heading', { level: 3 }).textContent).toBe(discipline.title)
      expect(disciplines[index].querySelector('.engineering-discipline-eyebrow')?.textContent).toBe(
        discipline.eyebrow,
      )
      expect(cell.getByText(discipline.listLead)).toBeTruthy()
      discipline.items.forEach((item) => expect(cell.getByText(item)).toBeTruthy())
    })

    expect(engineering).toMatch(
      /\.engineering-disciplines \{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s,
    )
    // The band is brand blue with white type; the heading and note stay white.
    expect(engineering).toMatch(/\.engineering-disciplines \{[^}]*color:\s*#ffffff;/s)
    expect(engineering).toMatch(
      /\.engineering-discipline \{[^}]*background:\s*var\(--engineering-accent\);/s,
    )
    expect(engineering).toMatch(
      /\.engineering-head,\s*\.engineering-note \{[^}]*background:\s*#ffffff;/s,
    )
    expect(engineering).toMatch(
      /\.engineering-code,\s*\.engineering-discipline-eyebrow \{[^}]*color:\s*var\(--engineering-accent\);/s,
    )
    // Lists line up because the copy is pushed to the bottom of each cell.
    expect(engineering).toMatch(/\.engineering-discipline-copy \{[^}]*margin-top:\s*auto;/s)
  })

  test('carries the photograph and the simulation note in the frame', () => {
    const { queries, section } = renderEngineering()

    expect(section.querySelector('.engineering-media-image')?.getAttribute('src')).toBe(
      defaultEngineeringImage.url,
    )
    expect(queries.getByAltText(defaultEngineeringImage.alt)).toBeTruthy()

    const note = within(section.querySelector('.engineering-note') as HTMLElement)
    defaultHomeEngineeringNote.paragraphs.forEach((paragraph) =>
      expect(note.getByText(paragraph)).toBeTruthy(),
    )
    expect(note.getByText(defaultHomeEngineeringNote.listLead)).toBeTruthy()
    defaultHomeEngineeringNote.items.forEach((item) => expect(note.getByText(item)).toBeTruthy())
  })

  /*
   * One frame around everything, its cells drawn as 1px gaps over the line
   * colour so no rule is doubled -- the same construction as the insights
   * section. The top and bottom rules run edge to edge of the screen; the
   * vertical ones close the frame at the page's width, with square corners.
   */
  test('runs its rules edge to edge and closes the frame at the page width', () => {
    const { section } = renderEngineering()

    const frame = section.querySelector('.engineering-frame') as HTMLElement
    expect(frame).toBeTruthy()
    expect(frame.querySelectorAll(':scope > *')).toHaveLength(4)

    expect(engineering).toMatch(
      /\.engineering-inner \{[^}]*border-block:\s*1px solid var\(--engineering-line\);/s,
    )
    expect(engineering).toMatch(
      /\.engineering-frame \{[^}]*width:\s*min\(100%, var\(--page-content\)\);[^}]*overflow:\s*hidden;[^}]*border-inline:\s*1px solid var\(--engineering-line\);[^}]*background:\s*#ffffff;/s,
    )
    expect(engineering).not.toMatch(/\.engineering-frame \{[^}]*border-radius/s)
    // No 1px gaps over the line colour: hidden cells would show it as a block.
    expect(engineering).not.toMatch(/\.engineering-frame \{[^}]*gap:/s)
    expect(engineering).toMatch(
      /\.engineering-media \{[^}]*border-right:\s*1px solid var\(--engineering-line\);/s,
    )
    expect(engineering).toMatch(
      /\.engineering-head \{[^}]*border-bottom:\s*1px solid var\(--engineering-line\);/s,
    )
    expect(engineering).not.toMatch(/--engineering-radius|--engineering-lift/)
  })

  test('stacks into one column on tablets and phones', () => {
    const columns = engineering.slice(engineering.indexOf('@media (max-width: 63.99rem)'))

    expect(columns).toMatch(/\.engineering-frame \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s)
    expect(columns).toMatch(/\.engineering-media \{[^}]*aspect-ratio:\s*4 \/ 3;/s)
    expect(columns).toMatch(
      /@media \(max-width: 47\.99rem\) \{\s*\.engineering-disciplines \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    )
  })
})
