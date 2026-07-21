import { render } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

vi.mock('@/components/home/HomeProcessModel', () => ({
  HomeProcessModel: () => <div data-testid="process-model-canvas" />,
}))

vi.mock('@/components/home/HomeGlobeScene', () => ({
  HomeGlobeScene: () => <div data-testid="globe-scene-fallback" />,
}))

const stylesheetPath = resolve(process.cwd(), 'src/app/(frontend)/home-responsive.css')
const stylesheet = existsSync(stylesheetPath) ? readFileSync(stylesheetPath, 'utf8') : ''

const scrollerPath = resolve(process.cwd(), 'src/components/home/HomeServicesScroller.tsx')
const scrollerSource = existsSync(scrollerPath) ? readFileSync(scrollerPath, 'utf8') : ''

const reducedMotionBlock = stylesheet.slice(
  stylesheet.indexOf('@media (prefers-reduced-motion: reduce)'),
)

describe('responsive home layout', () => {
  test('uses one laptop-led semantic layout across every home section', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    expect(container.querySelector('#top')?.getAttribute('data-responsive-layout')).toBe('hero')
    expect(
      container.querySelector('.services-showcase')?.getAttribute('data-responsive-layout'),
    ).toBe('services')
    expect(container.querySelector('#industries')?.getAttribute('data-responsive-layout')).toBe(
      'industries',
    )
    expect(
      container.querySelector('#manufacturing-process')?.getAttribute('data-responsive-layout'),
    ).toBe('process')
  })

  test('defines mobile, laptop, and desktop compositions at the agreed boundaries', () => {
    expect(stylesheet).toMatch(/@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)/)
    expect(stylesheet).toMatch(/@media \(min-width: 90rem\)/)
    expect(stylesheet).toMatch(/\.hero-summary\s*\{[^}]*background:\s*#fff;/s)
    expect(stylesheet).toMatch(/\.services-showcase-card\s*\{[^}]*width:\s*16\.1875rem;/s)
    expect(stylesheet).toMatch(/\.industries-showcase-card\s*\{[^}]*grid-template-columns:/s)
  })

  test('pins the mobile services rail on scroll with a reduced-motion scroll fallback', () => {
    // The rail is driven by the scroll-scrubbed transform at every width, so the
    // default viewport hides native overflow like the desktop composition.
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='services'\] \.services-showcase-viewport \{[^}]*overflow:\s*hidden;/s,
    )
    // Reduced-motion users get no transform, so native horizontal scrolling is
    // restored for them and no cards are clipped.
    expect(reducedMotionBlock).toMatch(
      /\.services-showcase-viewport \{[^}]*overflow-x:\s*auto;/s,
    )
    expect(reducedMotionBlock).toMatch(/\.services-showcase-track \{[^}]*transform:\s*none/s)
    expect(stylesheet).toMatch(/animation:\s*none;/)
  })

  test('drives the services rail from scroll at every width, mobile included', () => {
    expect(scrollerSource).toMatch(/media\.add\(\s*'\(min-width: 0px\)'/)
    expect(scrollerSource).not.toMatch(/media\.add\(\s*'\(min-width: 48rem\)'/)
  })

  test('renders the mobile services title in the capitalized style, not the legacy uppercase leak', () => {
    const mobileBase = stylesheet.slice(
      0,
      stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)'),
    )
    expect(mobileBase).toMatch(
      /\.services-showcase\[data-responsive-layout='services'\] h2 \{[^}]*text-transform:\s*capitalize;/s,
    )
  })

  test('overlaps industry cards on mobile while preserving full-card flow above 768px', () => {
    const mobileBase = stylesheet.slice(
      0,
      stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)'),
    )

    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-card \{[^}]*position:\s*sticky;/s,
    )
    expect(mobileBase).toMatch(
      /\.industries-showcase-card:not\(:last-child\)\s*\{[^}]*margin-bottom:\s*calc\(var\(--industries-peek\)\s*-\s*var\(--industries-card-height\)\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\)\s*\{\s*\[data-responsive-layout='industries'\] \.industries-showcase-card:not\(:last-child\)\s*\{\s*margin-bottom:\s*0;/s,
    )
  })

  test('keeps the final industry card in its sticky slot until the process section covers it', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\]\s*\{[^}]*margin-bottom:\s*-100svh;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-stack::after\s*\{[^}]*height:\s*100svh;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='process'\]\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*10;/s,
    )
  })

  test('does not clip full-bleed home sections to the centered site shell', () => {
    expect(stylesheet).not.toMatch(
      /main:has\(\.hero-section\)\s*\{[^}]*overflow:\s*clip;/s,
    )
  })

  test('keeps the hero full width with a centered 80rem desktop content cap', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-content \{[^}]*width: 100%;[^}]*max-width: 80rem;[^}]*margin-inline: auto;/s,
    )
    expect(stylesheet).not.toMatch(/^\s*width: 80rem;/m)
  })

  test('starts the hero at the document top beneath the floating header', () => {
    expect(stylesheet).toMatch(
      /\.site-shell:has\(\[data-responsive-layout='hero'\]\) \.nav-container \{[^}]*height: 0;/s,
    )
    expect(stylesheet).toMatch(/\[data-responsive-layout='hero'\] \{[^}]*margin-top: 0;/s)
  })

  test('keeps the hero at full viewport height at every range', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \{[^}]*min-height: max\(55rem, 100svh\);/s,
    )
    expect(stylesheet.match(/min-height: 100svh;/g)?.length).toBeGreaterThanOrEqual(2)
    expect(stylesheet).not.toMatch(/min-height: 37\.5rem;/)
    expect(stylesheet).not.toMatch(/min-height: clamp\(47\.625rem/)
  })

  test('lays out the laptop hero summary as description top, paired buttons bottom', () => {
    const laptopBlock = stylesheet.slice(
      stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)'),
      stylesheet.indexOf('@media (min-width: 90rem)'),
    )

    expect(laptopBlock).toMatch(/\.hero-summary \{[^}]*justify-content: space-between;/s)
    // The side-by-side button pair comes from the base two-column grid; a flex
    // override here re-stacks the full-width buttons.
    expect(laptopBlock).not.toMatch(/\.hero-actions \{[^}]*display: flex;/s)
  })

  test('uses committed responsive hero and service artwork instead of expiring Figma URLs', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const heroSources = Array.from(container.querySelectorAll('.hero-image source'))
    const serviceImages = Array.from(container.querySelectorAll('.services-showcase-card-image'))

    expect(heroSources).toHaveLength(2)
    expect(container.querySelector('.hero-image img')?.getAttribute('src')).toBe(
      '/images/home/hero-mobile.png',
    )
    expect(serviceImages).toHaveLength(5)
    expect(
      serviceImages.every((image) => {
        const src = image.getAttribute('src') || ''
        return !src.includes('figma.com') && decodeURIComponent(src).includes('/images/home/')
      }),
    ).toBe(true)
  })
})
