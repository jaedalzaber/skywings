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
    expect(section.querySelector('.engineering-head')).toBeTruthy()
  })

  test('sets the disciplines side by side in the accent band, each with its list', () => {
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
      /\.engineering-disciplines \{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[^}]*background:\s*var\(--engineering-accent\);/s,
    )
    // Lists line up because the copy is pushed to the bottom of each cell.
    expect(engineering).toMatch(/\.engineering-discipline-copy \{[^}]*margin-top:\s*auto;/s)
  })

  test('carries the photograph and the simulation note under the band', () => {
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
   * Only corners on the outside of the composition are rounded: the flush
   * joins down the copy column stay square, and so does the inside corner
   * where the photograph meets the heading cell -- the photograph's
   * bottom-right and the heading cell's top-left. 0.625rem is the 10px floor.
   */
  test('rounds the outer corners of the composition, never under 10px', () => {
    expect(engineering).toMatch(
      /--engineering-radius:\s*clamp\(0\.625rem,[^;]*\);/,
    )
    expect(engineering).toMatch(
      /\.engineering-media \{[^}]*border-radius:\s*var\(--engineering-radius\) var\(--engineering-radius\) 0 var\(--engineering-radius\);[^}]*overflow:\s*hidden;/s,
    )
    expect(engineering).toMatch(
      /\.engineering-head \{[^}]*border-radius:\s*0 var\(--engineering-radius\) 0 0;/s,
    )
    expect(engineering).toMatch(
      /\.engineering-note \{[^}]*border-radius:\s*0 0 var\(--engineering-radius\) var\(--engineering-radius\);/s,
    )
  })

  test('stacks into one column on tablets and phones', () => {
    const columns = engineering.slice(engineering.indexOf('@media (max-width: 63.99rem)'))

    expect(columns).toMatch(/\.engineering-inner \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s)
    // Nothing meets the photograph once stacked, so both corners come back.
    expect(columns).toMatch(
      /\.engineering-media \{[^}]*border-radius:\s*var\(--engineering-radius\);/s,
    )
    expect(columns).toMatch(
      /\.engineering-head \{[^}]*border-radius:\s*var\(--engineering-radius\) var\(--engineering-radius\) 0 0;/s,
    )
    expect(columns).toMatch(
      /@media \(max-width: 47\.99rem\) \{\s*\.engineering-disciplines \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    )
  })
})
