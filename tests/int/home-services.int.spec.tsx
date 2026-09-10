import { render, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout, type HomeLayout } from '@/data/home'

const homeSourcePath = resolve(process.cwd(), 'src/data/home.ts')
const homeSource = existsSync(homeSourcePath) ? readFileSync(homeSourcePath, 'utf8') : ''
const pagesSourcePath = resolve(process.cwd(), 'src/data/pages.ts')
const pagesSource = existsSync(pagesSourcePath) ? readFileSync(pagesSourcePath, 'utf8') : ''
const packageJsonPath = resolve(process.cwd(), 'package.json')
const packageJson = existsSync(packageJsonPath)
  ? (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>
    })
  : {}

const heroOnlyLayout = defaultHomeLayout.filter((block) => block.blockType === 'homeHero')

/*
 * The hero runs its own marquee of service labels, so every query here is
 * scoped to the grid — an unscoped getByText matches the marquee copy too.
 */
function servicesIn(container: HTMLElement) {
  const section = container.querySelector<HTMLElement>('.services-grid')
  if (!section) throw new Error('services grid did not render')

  return within(section)
}

describe('HomeServicesGrid', () => {
  test('loads home services from page layouts after running migrations in Vercel builds', () => {
    expect(homeSource).not.toMatch(/homeLayoutWithoutServicesSelect/)
    expect(pagesSource).not.toMatch(/pageLayoutWithoutHomeServicesSelect/)
    expect(packageJson.scripts?.['vercel-build']).toMatch(/payload migrate/)
    expect(packageJson.scripts?.['vercel-build']).toMatch(/pnpm (run )?build/)
  })

  // A lookup table used to swap known strings for newer wording on the way out
  // of the data layer, which meant the services copy could not be edited from
  // the admin at all — whatever was saved came back as the hard-coded version.
  test('renders home copy as authored rather than rewriting known strings', () => {
    expect(homeSource).not.toMatch(/legacyHomeCopy/)
  })

  test('renders the service grid directly after the hero with six services', () => {
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    const hero = container.querySelector('#top')
    const servicesSection = container.querySelector('.services-grid')

    expect(hero?.nextElementSibling).toBe(servicesSection)
    expect(container.querySelectorAll('.services-grid-card')).toHaveLength(6)

    expect(
      Array.from(container.querySelectorAll('.services-grid-card-label')).map(
        (label) => label.textContent,
      ),
    ).toEqual([
      'Ground Support Equipment',
      'Structural Steel Fabrication',
      'Architectural & Interior Metalwork',
      'Heavy Machinery',
      'Sheet Metal Products',
      'Custom Manufacturing',
    ])
  })

  /*
   * The headline reads as one sentence but is authored as runs, so the joined
   * text has to come back intact — a missing space between runs is the failure
   * this guards.
   */
  test('renders the heading as one sentence with the emphasised runs marked', () => {
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    const heading = servicesIn(container).getByRole('heading', { level: 2 })

    expect(heading.textContent).toBe(
      'Sky Wings provides End-to-End Metal Manufacturing. We take a Requirement — a drawing, ' +
        'a sample, a concept, or a problem to solve — and convert it into a Manufactured product.',
    )
    expect(
      Array.from(container.querySelectorAll('.services-grid-heading-strong')).map(
        (span) => span.textContent,
      ),
    ).toEqual(['End-to-End Metal Manufacturing.', 'Requirement', 'Manufactured product'])
  })

  test('renders editable home service block content from the CMS layout', () => {
    const layout: HomeLayout = [
      ...heroOnlyLayout,
      {
        blockType: 'homeServices',
        cards: [
          {
            fallbackImage: '/images/home/service-01.png',
            hoverMedia: null,
            image: null,
            title: 'Editable Cutting Service',
          },
          {
            fallbackImage: '/images/home/service-02.png',
            hoverMedia: null,
            image: null,
            title: 'Editable Installation Service',
          },
        ],
        heading: 'Editable What We Do',
        headingSegments: [
          { text: 'Editable muted run ' },
          { emphasis: true, text: 'and an emphasised one.' },
        ],
      },
    ]

    const { container } = render(<HomeBlockRenderer blocks={layout} />)

    const services = servicesIn(container)

    expect(container.querySelectorAll('.services-grid')).toHaveLength(1)
    expect(services.getByRole('heading', { level: 2 }).textContent).toBe(
      'Editable muted run and an emphasised one.',
    )
    expect(services.getByText('Editable Cutting Service')).toBeTruthy()
    expect(services.getByText('Editable Installation Service')).toBeTruthy()
    expect(container.querySelectorAll('.services-grid-card')).toHaveLength(2)
  })

  /*
   * Hover artwork is mounted on demand, so nothing animated should be in the
   * document before a visitor touches a card — six autoplaying clips on load is
   * exactly what the on-hover mount exists to avoid.
   */
  test('ships no hover artwork until a card is hovered', () => {
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    expect(container.querySelectorAll('.services-grid-card-motion')).toHaveLength(0)
    expect(container.querySelectorAll('.services-grid-card-image')).toHaveLength(6)
  })
})
