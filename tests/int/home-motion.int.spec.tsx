import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { defaultHomeLayout } from '@/data/home'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const primitives = read('src/components/motion/Reveal.tsx')
const stylesheet = read('src/app/(frontend)/styles.css')
const layout = read('src/app/(frontend)/layout.tsx')

const renderHome = () => render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

/*
 * The home page's entrance motion is one system, not six. These pin the parts
 * of that which are easy to erode: the shared timings, the single marker every
 * fallback keys off, and the rule that a reveal replaces an element rather
 * than wrapping it -- the moment one wraps, a stylesheet built on direct-child
 * selectors quietly stops matching.
 */
describe('home entrance motion', () => {
  afterEach(cleanup)

  test('renders the element it is given rather than wrapping it', () => {
    const { container } = render(
      <RevealGroup as="section" className="band">
        <RevealItem as="header" className="band-head" />
        <Reveal as="figure" className="band-media" motion="shutter" />
      </RevealGroup>,
    )

    const band = container.querySelector('.band') as HTMLElement
    expect(band.tagName).toBe('SECTION')
    expect(band.parentElement).toBe(container)
    expect(Array.from(band.children).map((child) => child.tagName)).toEqual(['HEADER', 'FIGURE'])
    expect(band.querySelector('.band-head')?.className).toBe('band-head')
  })

  test('marks everything it reveals, which is what both fallbacks key off', () => {
    const { container } = render(
      <RevealGroup className="a">
        <RevealItem className="b" />
      </RevealGroup>,
    )

    for (const selector of ['.a', '.b']) {
      expect(container.querySelector(selector)?.hasAttribute('data-reveal'), selector).toBe(true)
    }

    // Anyone asking for less motion gets every part at rest, whatever the
    // script would otherwise have set inline.
    expect(stylesheet).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\[data-reveal\] \{\s*opacity: 1 !important;\s*transform: none !important;\s*clip-path: none !important;/s,
    )
    // And with scripting off there is nothing to play the first frame back.
    expect(layout).toMatch(/<noscript>[\s\S]*\[data-reveal\]\{opacity:1!important/)
  })

  test('keeps one set of timings for the whole page', () => {
    // A single easing, and durations that stay in one file rather than being
    // re-typed per section.
    expect(primitives).toMatch(/const EASE = \[0\.22, 0\.61, 0\.36, 1\] as const/)
    expect((primitives.match(/duration: 0\.\d+/g) ?? []).length).toBeGreaterThan(3)
    for (const source of [
      'src/components/home/HomeBlocks.tsx',
      'src/components/home/HomeServicesGrid.tsx',
      'src/components/home/HomeMachiningSection.tsx',
      'src/components/home/HomeEngineeringSection.tsx',
      'src/components/home/HomeIndustriesAccordion.tsx',
    ]) {
      expect(read(source), source).not.toMatch(/duration:|ease:|cubic-bezier/)
    }
  })

  test('resolves each motion tag once, so a reveal never remounts its subtree', () => {
    // Looking a component up mid-render gives it a new identity every time,
    // which would remount the card underneath it and reload its image.
    expect(primitives).toMatch(/const MOTION_TAGS = \{/)
    expect(primitives).toMatch(
      /const Component = MOTION_TAGS\[tag\] as unknown as AnyMotionComponent/,
    )
    expect(primitives).not.toMatch(/const motionTag = /)
  })

  /*
   * The hero is the one panel a visitor is guaranteed to watch arrive, so it
   * is set down a part at a time rather than as two fading blocks: eyebrow,
   * the headline word by word, then the summary and its buttons.
   */
  test('sets the hero down a part at a time, headline by the word', () => {
    const { container } = renderHome()

    const heading = container.querySelector('h1') as HTMLElement
    const words = heading.querySelectorAll('.reveal-word')
    expect(words.length).toBeGreaterThan(3)
    // Real words with real spaces, so the accessible name is untouched.
    expect(heading.textContent).toBe(
      'Metal products engineered, fabricated, and delivered to spec.',
    )
    expect(words[0].textContent).toBe('Metal')
    expect(stylesheet).toMatch(/\.reveal-word \{\s*display: inline-block;/s)

    // The parts each take their own turn; their wrappers are plain again.
    for (const selector of ['.eyebrow', '.hero-text', '.hero-actions']) {
      expect(container.querySelector(selector)?.hasAttribute('data-reveal'), selector).toBe(true)
    }
    for (const selector of ['.hero-copy', '.hero-summary']) {
      expect(container.querySelector(selector)?.hasAttribute('data-reveal'), selector).toBe(false)
    }
  })

  /*
   * The footage settling out of a slight over-scale is CSS, not the reveal
   * system: it plays once on load with no state to co-ordinate. `scale` is
   * its own property, so it composes with any transform a cover carries
   * rather than replacing it.
   */
  test('settles the hero footage out of an over-scale, in CSS', () => {
    expect(stylesheet).toMatch(/@keyframes hero-cover-settle \{\s*from \{\s*scale: 1\.055;/s)
    expect(stylesheet).toMatch(
      /\.hero-video-layer \.hero-image,\s*\.hero-video-layer \.hero-cover-video \{\s*animation: hero-cover-settle/s,
    )
    expect(stylesheet).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[^@]*\.hero-video-layer \.hero-cover-video \{\s*animation: none;/s,
    )
  })

  test('reveals the bands that had no motion of their own', () => {
    const { container } = renderHome()

    for (const selector of [
      '.hero-content',
      '.hero-services-marquee',
      '.services-grid-heading',
      '.services-grid-list',
      '.services-grid-card',
      '.industries-showcase-intro',
      '.machining-head-title',
      '.machining-stats',
      '.machining-list',
      // .engineering-media is deliberately left plain; see the section.
      '.engineering-head',
      '.engineering-disciplines',
      '.locations-media',
      '.locations-title',
      '.locations-item',
    ]) {
      const element = container.querySelector(selector)
      expect(element, `${selector} should render`).not.toBeNull()
      expect(element?.hasAttribute('data-reveal'), selector).toBe(true)
    }
  })

  /*
   * The scrubbed scene follows the scrollbar frame by frame, which is a
   * different job from a one-shot reveal. Mixing the two on one element means
   * two libraries writing the same inline styles.
   */
  test('leaves the scroll-scrubbed scene to GSAP', () => {
    expect(read('src/components/home/HomeProcessSection.tsx')).not.toMatch(/motion\/Reveal|<Reveal/)
    expect(primitives).not.toMatch(/gsap/)
    // The locations section is one-shot reveals now, and nothing else.
    expect(read('src/components/home/HomeLocationsSection.tsx')).not.toMatch(/gsap/)
  })
})
