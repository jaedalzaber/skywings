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

const baseStylesheetPath = resolve(process.cwd(), 'src/app/(frontend)/styles.css')
const baseStylesheet = existsSync(baseStylesheetPath)
  ? readFileSync(baseStylesheetPath, 'utf8')
  : ''

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
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-content-band \{[^}]*background:\s*rgba\(217,\s*217,\s*217,\s*0\.75\);/s,
    )
    expect(stylesheet).toMatch(
      /\.services-showcase-card\s*\{[^}]*width:\s*clamp\(13rem,\s*20\.5vw,\s*23\.4375rem\);/s,
    )
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
    expect(reducedMotionBlock).toMatch(/\.services-showcase-viewport \{[^}]*overflow-x:\s*auto;/s)
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

  test('uses one pinned industry-card slot without full-card overlap', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-card \{[^}]*position:\s*sticky;[^}]*top:\s*var\(--industries-card-sticky-top\);/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-card \{[^}]*border-radius:\s*0;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-stage\s*\{[^}]*height:\s*calc\(var\(--industries-card-height\) \+ var\(--industries-card-height\)\);[^}]*margin-bottom:\s*calc\(-1 \* var\(--industries-card-height\) \+ var\(--industries-card-bottom-gap\)\);/s,
    )
    expect(stylesheet).not.toMatch(
      /\.industries-showcase-card-stage\s*\{[^}]*display:\s*contents;/s,
    )
  })

  test('keeps the two-line industries heading pinned above every card', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-intro \{[^}]*position:\s*sticky;[^}]*top:\s*var\(--industries-sticky-top\);[^}]*z-index:\s*20;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-intro::before\s*\{[^}]*top:\s*calc\(-1 \* var\(--industries-sticky-top\)\);[^}]*right:\s*calc\(50% - 50vw\);[^}]*left:\s*calc\(50% - 50vw\);[^}]*background:\s*#ffffff;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-intro::after\s*\{[^}]*top:\s*100%;[^}]*height:\s*var\(--industries-title-mask-height\);[^}]*background:\s*#ffffff;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] h2 \{[^}]*width:\s*min\(100%,\s*13ch\);[^}]*text-wrap:\s*balance;/s,
    )
    expect(stylesheet).toMatch(
      /--industries-card-sticky-top:\s*calc\(\s*var\(--industries-sticky-top\) \+ var\(--industries-title-sticky-height\) \+\s*var\(--industries-title-mask-height\)\s*\);/s,
    )
  })

  test('uses a full-width mobile industries intro and compact card content column', () => {
    const mobileBlock = stylesheet.slice(
      0,
      stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)'),
    )

    expect(mobileBlock).toMatch(/--industries-label-column:\s*1\.5rem;/)
    expect(mobileBlock).toMatch(/--industries-title-gap:\s*0\.9375rem;/)
    expect(mobileBlock).toMatch(/--industries-inline-padding:\s*0\.375rem;/)
    expect(mobileBlock).toMatch(/--industries-gallery-bleed:\s*0rem;/)
    expect(mobileBlock).toMatch(
      /\.industries-showcase-intro \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*padding:\s*1\.5rem var\(--industries-intro-padding\);/s,
    )
    expect(mobileBlock).toMatch(
      /\.industries-showcase-card-inner \{[^}]*grid-template-columns:\s*var\(--industries-label-column\) minmax\(0,\s*1fr\);/s,
    )
  })

  test('aligns the services and industries title bands to one shared left edge', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='services'\] \.services-showcase-shell \{[^}]*padding:[^;]*clamp\(1\.5rem,\s*3vw,\s*2\.5rem\)/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?\.industries-showcase-intro \{[^}]*width:\s*min\(100%,\s*var\(--max\)\);[^}]*margin:\s*0 auto;[^}]*padding:\s*0\.75rem var\(--industries-inline-padding\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\.industries-showcase-intro \{[^}]*width:\s*min\(100%,\s*var\(--max\)\);[^}]*padding:\s*0 var\(--industries-inline-padding\);/s,
    )
  })

  test('aligns each industry card title with the industries main heading', () => {
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?--industries-label-column:\s*4\.89925rem;[^]*?--industries-title-gap:\s*3\.8125rem;[^]*?\.industries-showcase-intro \{[^}]*grid-template-columns:\s*var\(--industries-label-column\) minmax\(0,\s*51\.2789rem\);[^}]*column-gap:\s*var\(--industries-title-gap\);[^]*?\.industries-showcase-card-inner \{[^}]*grid-template-columns:\s*var\(--industries-label-column\) minmax\(0,\s*1fr\);[^}]*column-gap:\s*var\(--industries-title-gap\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?--industries-label-column:\s*7\.5rem;[^]*?--industries-title-gap:\s*4\.7375rem;[^]*?\.industries-showcase-intro \{[^}]*grid-template-columns:\s*var\(--industries-label-column\) minmax\(0,\s*51\.279rem\);[^}]*column-gap:\s*var\(--industries-title-gap\);[^]*?\.industries-showcase-card-inner \{[^}]*grid-template-columns:\s*var\(--industries-label-column\) minmax\(0,\s*44\.8125rem\);[^}]*column-gap:\s*var\(--industries-title-gap\);/s,
    )
  })

  test('shows the compact hero only on mobile and leaves breathing room around wide heroes', () => {
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-media--compact\s*\{[^}]*display:\s*block;[^}]*aspect-ratio:\s*310\s*\/\s*117;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?\.industries-showcase-card-media--compact\s*\{[^}]*display:\s*none;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?--industries-right-gap:\s*clamp\(1\.5rem,\s*6vw,\s*6rem\);/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-media--wide\s*\{[^}]*margin:\s*1\.5rem 0;/s,
    )
  })

  test('aligns industry counters and gives product rails a full-left bleed', () => {
    expect(stylesheet).toMatch(/--industries-counter-left:\s*0\.375rem;/)
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-code \{[^}]*grid-row:\s*1;[^}]*grid-column:\s*1;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-grid \{[^}]*width:\s*calc\(100% \+ var\(--industries-gallery-bleed\)\);[^}]*margin-left:\s*calc\(-1 \* var\(--industries-gallery-bleed\)\);/s,
    )
  })

  test('pauses moving product rails on hover, focus, off-screen, and reduced motion', () => {
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-grid\[data-moving='true'\]\[data-in-view='true'\][^}]*\.industries-showcase-product-track \{[^}]*animation-play-state:\s*running;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-grid\[data-moving='true'\]:is\(:hover,\s*:focus-within\)[^}]*\.industries-showcase-product-track \{[^}]*animation-play-state:\s*paused;/s,
    )
    expect(reducedMotionBlock).toMatch(
      /\.industries-showcase-product-track \{[^}]*animation:\s*none !important;[^}]*transform:\s*none !important;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[^]*?\.industries-showcase-product-image \{[^}]*transform:\s*scale\(1\.04\);/s,
    )
  })

  test('keeps the final industry card in its sticky slot until the process section covers it', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\]\s*\{[^}]*margin-bottom:\s*calc\(-100svh \+ var\(--industries-end-gap\)\);/s,
    )
    expect(stylesheet).toMatch(/\.industries-showcase-stack::after\s*\{[^}]*height:\s*100svh;/s)
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='process'\]\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*30;[^}]*isolation:\s*isolate;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='process'\]::before\s*\{[^}]*top:\s*calc\(-1 \* var\(--process-handoff-cover\)\);[^}]*background:\s*var\(--process-blue\);/s,
    )
  })

  test('does not clip full-bleed home sections to the centered site shell', () => {
    expect(stylesheet).not.toMatch(/main:has\(\.hero-section\)\s*\{[^}]*overflow:\s*clip;/s)
  })

  test('keeps the hero full width with a centered 80rem desktop content cap', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-content \{[^}]*width: 100%;[^}]*max-width: 80rem;[^}]*margin-inline: auto;/s,
    )
    expect(stylesheet).not.toMatch(/^\s*width: 80rem;/m)
  })

  test('overlays the mobile hero heading while keeping summary and actions below the video', () => {
    expect(baseStylesheet).toMatch(/\.hero-video-layer \{[^}]*z-index:\s*0;/s)
    expect(baseStylesheet).toMatch(/\.hero-content-band \{[^}]*z-index:\s*3;/s)
    expect(baseStylesheet).toMatch(/\.hero-cover-video \{[^}]*opacity:\s*0;/s)
    expect(baseStylesheet).toMatch(
      /\.hero-cover-video\[data-loaded='true'\]\s*\{[^}]*opacity:\s*1;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\]\s*\{[^}]*flex-direction:\s*column;[^}]*overflow:\s*visible;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-video-layer \{[^}]*position:\s*relative;[^}]*height:\s*var\(--hero-video-height\);/s,
    )
    expect(stylesheet).toMatch(/--hero-heading-overlay-height:\s*9\.75rem;/)
    expect(stylesheet).toMatch(
      /--hero-summary-reserved-height:\s*clamp\(10\.5rem,\s*30svh,\s*14rem\);/,
    )
    expect(stylesheet).toMatch(
      /--hero-video-height:\s*calc\(\s*100svh - var\(--hero-summary-reserved-height\)\s*\);/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-content-band \{[^}]*margin-top:\s*calc\(-1 \* var\(--hero-heading-overlay-height\)\);[^}]*background:\s*transparent;[^}]*backdrop-filter:\s*none;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-copy \{[^}]*min-height:\s*var\(--hero-heading-overlay-height\);[^}]*background:\s*rgba\(217,\s*217,\s*217,\s*0\.72\);[^}]*backdrop-filter:\s*blur\(1rem\);/s,
    )
    expect(stylesheet).not.toMatch(
      /\[data-responsive-layout='hero'\] \.hero-copy \{[^}]*border-top:/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-summary \{[^}]*min-height:\s*var\(--hero-summary-reserved-height\);[^}]*padding:\s*1rem 1\.375rem 1\.25rem 1\.5625rem;[^}]*background:\s*#ffffff;/s,
    )
  })

  test('starts the hero at the document top beneath the floating header', () => {
    expect(stylesheet).toMatch(
      /\.site-shell:has\(\[data-responsive-layout='hero'\]\) \.nav-container \{[^}]*height: 0;/s,
    )
    expect(stylesheet).toMatch(/\[data-responsive-layout='hero'\] \{[^}]*margin-top: 0;/s)
  })

  test('keeps the hero at full viewport height at every range', () => {
    expect(stylesheet).toMatch(/\[data-responsive-layout='hero'\] \{[^}]*min-height:\s*100svh;/s)
    expect(stylesheet.match(/min-height: 100svh;/g)?.length).toBeGreaterThanOrEqual(2)
    expect(stylesheet).not.toMatch(/max\(55rem,\s*100svh\)/)
    expect(stylesheet).not.toMatch(/min-height: 37\.5rem;/)
    expect(stylesheet).not.toMatch(/min-height: clamp\(47\.625rem/)
  })

  test('keeps the non-mobile hero text area at one quarter of the viewport', () => {
    expect(stylesheet).toMatch(/@media \(min-width: 48rem\)[^]*?--hero-text-height:\s*25svh;/s)
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\)[^]*?--hero-video-height:\s*calc\(100svh - var\(--hero-text-height\) - var\(--hero-marquee-height\)\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\[data-responsive-layout='hero'\]\s*\{[^}]*--hero-marquee-height:\s*3\.875rem;/s,
    )
  })

  test('gives the mobile process scene more than one viewport of height', () => {
    const mobileBlock = stylesheet.slice(
      0,
      stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)'),
    )

    expect(mobileBlock).toMatch(
      /\[data-responsive-layout='process'\]\s*\{[^}]*min-height:\s*max\(46rem,\s*112svh\);/s,
    )
    expect(mobileBlock).toMatch(/--process-top-padding:\s*clamp\(2rem,\s*6svh,\s*3\.5rem\);/)
    expect(mobileBlock).toMatch(
      /\[data-responsive-layout='process'\]\s*\{[^}]*padding:\s*var\(--process-top-padding\) 0\.5rem;/s,
    )
    expect(mobileBlock).toMatch(
      /\[data-responsive-layout='process'\] \.process-model-stage \{[^}]*min-height:\s*max\(24rem,\s*58svh\);/s,
    )
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

  test('uses equal process columns plus a half-width model viewer on laptop and tablet', () => {
    const laptopBlock = stylesheet.slice(
      stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)'),
      stylesheet.indexOf('@media (min-width: 90rem)'),
    )

    expect(laptopBlock).toMatch(
      /--process-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\) minmax\(0,\s*2fr\);/,
    )
    expect(laptopBlock).toMatch(/\[data-responsive-layout='process'\] \{[^}]*min-height:\s*50rem;/s)
    expect(laptopBlock).toMatch(
      /\[data-responsive-layout='process'\] \{[^}]*--process-top-padding:\s*clamp\(3rem,\s*8svh,\s*5\.5rem\);[^}]*justify-content:\s*flex-start;[^}]*padding:\s*var\(--process-top-padding\) 1\.5625rem;/s,
    )
    expect(laptopBlock).toMatch(
      /\[data-responsive-layout='process'\] \.process-grid \{[^}]*grid-template-columns:\s*var\(--process-columns\);/s,
    )
    expect(laptopBlock).toMatch(/\.process-column-right \{[^}]*grid-column:\s*2;/s)
    expect(laptopBlock).toMatch(
      /\.process-model-stage \{[^}]*grid-column:\s*3;[^}]*grid-row:\s*1;/s,
    )
  })

  test('uses equal top and bottom padding in the process section', () => {
    expect(baseStylesheet).toMatch(
      /\.process-model-stage::after\s*\{[^}]*inset:\s*0;[^}]*border:\s*0;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='process'\]\s*\{[^}]*padding:\s*var\(--process-top-padding\) 0\.5rem;/s,
    )
    expect(stylesheet).toMatch(/--process-top-padding:\s*clamp\(3\.5rem,\s*9svh,\s*6rem\);/)
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?\[data-responsive-layout='process'\] \{[^}]*padding:\s*var\(--process-top-padding\) 1\.5625rem;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\[data-responsive-layout='process'\] \{[^}]*padding:\s*var\(--process-top-padding\) max\(1rem,\s*calc\(\(100vw - 98rem\) \/ 2\)\)\s*var\(--process-top-padding\);/s,
    )
  })

  test('uses one equal-half services composition at every non-mobile width', () => {
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\)\s*\{[^]*?\[data-responsive-layout='services'\]\s*\{[^}]*--services-rail-inset:\s*30vw;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='services'\] \.services-showcase-pin \{[^}]*grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*height:\s*100svh;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='services'\] \.services-showcase-heading \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(20rem,\s*31rem\);[^}]*height:\s*100%;/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='services'\] \.services-showcase-viewport \{[^}]*height:\s*100%;[^}]*padding-bottom:\s*clamp\(0\.75rem,\s*1\.5svh,\s*1\.25rem\);/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='services'\] \.services-showcase-track \{[^}]*height:\s*100%;[^}]*padding:\s*0 var\(--services-rail-inset\);/s,
    )
    expect(stylesheet).toMatch(
      /\.services-showcase\[data-responsive-layout='services'\] h2 \{[^}]*max-width:\s*none;[^}]*text-transform:\s*none;/s,
    )
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
