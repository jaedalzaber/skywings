import { cleanup, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

vi.mock('@/components/home/HomeProcessModel', () => ({
  HomeProcessModel: () => <div data-testid="process-model-canvas" />,
}))

describe('HomeGlobeSection', () => {
  afterEach(cleanup)

  test('renders directly after manufacturing process with branches, map background, and looping clients', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const process = container.querySelector('#manufacturing-process')
    const globe = container.querySelector('#global-delivery') as HTMLElement
    const globeQueries = within(globe)

    expect(process?.nextElementSibling).toBe(globe)
    expect(globeQueries.getByRole('heading', { level: 2 }).textContent).toContain(
      'Manufactured in the UAE.',
    )
    expect(globe.querySelectorAll('.globe-branch-card')).toHaveLength(2)
    expect(globeQueries.getByText('Sharjah Branch')).toBeTruthy()
    expect(globeQueries.getByText('Thoban Branch')).toBeTruthy()
    expect(globeQueries.getByRole('link', { name: '+971 509 469 979' }).getAttribute('href')).toBe(
      'tel:+971509469979',
    )
    expect(globeQueries.getByRole('link', { name: '+971 505 389 979' }).getAttribute('href')).toBe(
      'tel:+971505389979',
    )
    expect(globe.querySelectorAll('.globe-client-track')).toHaveLength(2)
    expect(globeQueries.getByTestId('globe-stage')).toBeTruthy()
    expect(globe.querySelector('.globe-map-background')).toBeTruthy()
  })

  test('uses the Figma charcoal layout and a reduced-motion-safe client marquee', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(styles).toMatch(/\.global-delivery\s*\{[^}]*background:\s*#2d2d2d;/s)
    expect(styles).toMatch(
      /\.global-delivery\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    )
    expect(styles).toMatch(/\.global-delivery-main\s*\{[^}]*padding:\s*clamp\(6\.25rem,[^;]+;/s)
    expect(styles).toContain("url('/images/home/delivery-map.png')")
    expect(styles).toMatch(
      /\.globe-branch-card::after\s*\{[^}]*bottom:\s*-0\.1875rem;[^}]*height:\s*0\.375rem;[^}]*filter:\s*blur\(0\.375rem\);/s,
    )
    expect(styles).toMatch(/@keyframes globe-client-slide/)
    expect(styles).toMatch(/\.globe-client-rail\s*\{[^}]*animation:\s*globe-client-slide[^;]+;/s)
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.globe-client-rail\s*\{[^}]*animation:\s*none;/s,
    )
  })
})
