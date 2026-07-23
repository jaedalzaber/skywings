import { render, screen } from '@testing-library/react'
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

describe('HomeServicesScroller', () => {
  test('loads home services from page layouts after running migrations in Vercel builds', () => {
    expect(homeSource).not.toMatch(/homeLayoutWithoutServicesSelect/)
    expect(pagesSource).not.toMatch(/pageLayoutWithoutHomeServicesSelect/)
    expect(packageJson.scripts?.['vercel-build']).toMatch(/payload migrate/)
    expect(packageJson.scripts?.['vercel-build']).toMatch(/pnpm (run )?build/)
  })

  test('renders the service container directly after the hero with five service cards', () => {
    const heroOnlyLayout = defaultHomeLayout.filter((block) => block.blockType === 'homeHero')
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    const hero = container.querySelector('#top')
    const servicesSection = container.querySelector('.services-showcase')

    expect(hero?.nextElementSibling).toBe(servicesSection)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'One partner from design to delivery',
      }),
    ).toBeTruthy()
    expect(screen.getByText('Manufacturing services')).toBeTruthy()
    expect(screen.getAllByText('Custom Equipment Manufacturing')).toHaveLength(2)
    expect(screen.getByText('Structural Steel Fabrication')).toBeTruthy()
    expect(screen.getByText('Metal Product Fabrication')).toBeTruthy()
    expect(screen.getByText('Erection')).toBeTruthy()
    expect(container.querySelectorAll('.services-showcase-card')).toHaveLength(5)
  })

  test('renders editable home service block content from the CMS layout', () => {
    const heroOnlyLayout = defaultHomeLayout.filter((block) => block.blockType === 'homeHero')
    const layout: HomeLayout = [
      ...heroOnlyLayout,
      {
        blockType: 'homeServices',
        cards: [
          {
            accentTitle: false,
            fallbackImage: '/images/home/service-01.png',
            image: null,
            title: 'Editable Cutting Service',
          },
          {
            accentTitle: true,
            fallbackImage: '/images/home/service-02.png',
            image: null,
            title: 'Editable Installation Service',
          },
        ],
        description: 'Editable intro copy from Payload.',
        eyebrow: 'Editable Services',
        heading: 'Editable What We Do',
        secondaryDescription: 'Editable secondary copy from Payload.',
      },
    ]

    const { container } = render(<HomeBlockRenderer blocks={layout} />)

    expect(container.querySelectorAll('.services-showcase')).toHaveLength(1)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Editable What We Do',
      }),
    ).toBeTruthy()
    expect(screen.getByText('Editable Services')).toBeTruthy()
    expect(screen.getByText('Editable intro copy from Payload.')).toBeTruthy()
    expect(screen.getByText('Editable secondary copy from Payload.')).toBeTruthy()
    expect(screen.getByText('Editable Cutting Service')).toBeTruthy()
    expect(screen.getByText('Editable Installation Service')).toBeTruthy()
    expect(container.querySelectorAll('.services-showcase-card')).toHaveLength(2)
  })
})
