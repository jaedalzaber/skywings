import { cleanup, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import {
  defaultHomeLayout,
  defaultHomeProcessIntro,
  defaultHomeProcessSteps,
  defaultHomeProcessSummary,
} from '@/data/home'

const joined = (segments: readonly { text: string }[]) =>
  segments.map((segment) => segment.text).join('')
const emphasised = (segments: readonly { emphasis?: boolean | null; text: string }[]) =>
  segments.filter((segment) => segment.emphasis).map((segment) => segment.text)

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const stylesheet = read('src/app/(frontend)/styles.css')
const component = read('src/components/home/HomeProcessSection.tsx')

const ACCORDION_MEDIA = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'

function renderProcess(blocks = defaultHomeLayout) {
  const { container } = render(<HomeBlockRenderer blocks={blocks} />)
  const section = container.querySelector('#manufacturing-process') as HTMLElement

  return { container, section, queries: within(section) }
}

describe('HomeProcessSection', () => {
  afterEach(cleanup)

  test('renders once after the capability run as six steps and a closing panel, with no model stage', () => {
    const { container, section, queries } = renderProcess()

    // Industries opens the capability run and the process closes it, with the
    // machining and engineering sections between the two.
    expect(container.querySelector('#industries')).toBeTruthy()
    expect(section.previousElementSibling?.id).toBe('engineering')
    expect(container.querySelector('#machining-capability')?.nextElementSibling?.id).toBe(
      'engineering',
    )
    expect(container.querySelectorAll('#manufacturing-process')).toHaveLength(1)
    expect(queries.getByRole('heading', { level: 2, name: 'Our Manufacturing Process' })).toBeTruthy()
    expect(section.getAttribute('data-scroll-scene')).toBe('process-accordion')
    expect(section.querySelectorAll('[data-panel="step"]')).toHaveLength(6)
    expect(section.querySelectorAll('[data-panel="cta"]')).toHaveLength(1)
    expect(section.querySelector('.process-model-stage')).toBeNull()
    // Drives the header's dark treatment while the bar is over the section.
    expect(section.getAttribute('data-nav-surface')).toBe('dark')
  })

  test('carries the line beside the heading and the closing paragraph, two-tone', () => {
    const { section } = renderProcess()
    const intro = section.querySelector('.process-intro') as HTMLElement
    const summary = section.querySelector('.process-summary') as HTMLElement

    /*
     * Compared against the defaults rather than a copy of the sentence: the
     * point is that the runs join back into one whole with its emphasis
     * intact, not what today's wording happens to be.
     */
    expect(intro.textContent).toBe(joined(defaultHomeProcessIntro))
    expect(summary.textContent).toBe(joined(defaultHomeProcessSummary))
    expect(
      Array.from(intro.querySelectorAll('.process-emphasis')).map((el) => el.textContent),
    ).toEqual(emphasised(defaultHomeProcessIntro))
    expect(
      Array.from(summary.querySelectorAll('.process-emphasis')).map((el) => el.textContent),
    ).toEqual(emphasised(defaultHomeProcessSummary))
    expect(emphasised(defaultHomeProcessSummary).length).toBeGreaterThan(0)

    // The heading and its line sit on one row; the row is banded, not boxed.
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))
    expect(accordion).toMatch(/\.process-head \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s)
    expect(accordion).toMatch(/\.process-intro \{[^}]*text-align:\s*right;/s)
  })

  test('lets an editor replace the two-tone copy and restores defaults when cleared', () => {
    const blocks = defaultHomeLayout.map((block) =>
      block.blockType !== 'homeProcess'
        ? block
        : { ...block, intro: [{ emphasis: true, text: 'Authored line.' }], summary: [] },
    )
    const { section } = renderProcess(blocks)

    expect(section.querySelector('.process-intro')?.textContent).toBe('Authored line.')
    expect(section.querySelector('.process-summary')?.textContent).toBe(
      joined(defaultHomeProcessSummary),
    )
  })

  test('keeps the label and icon in the rail, with no step numbering', () => {
    const { section } = renderProcess()
    const rails = Array.from(section.querySelectorAll('[data-panel="step"] .process-panel-rail'))

    expect(section.querySelectorAll('.process-panel-index')).toHaveLength(0)
    expect(section.textContent).not.toMatch(/\b0[1-6]\b/)
    expect(rails.map((rail) => rail.querySelector('.process-panel-label')?.textContent)).toEqual(
      defaultHomeProcessSteps.map((step) => step.label),
    )
    expect(
      Array.from(section.querySelectorAll('.process-panel-title')).map((el) => el.textContent),
    ).toEqual(defaultHomeProcessSteps.map((step) => step.title))
    // Only the large title and description leave when a step collapses.
    for (const panel of section.querySelectorAll('[data-panel="step"]')) {
      const fading = Array.from(panel.querySelectorAll('[data-fade]')).map((el) => el.className)
      expect(fading).toEqual(['process-panel-title', 'process-panel-description'])
      expect(panel.querySelector('.process-panel-rail')?.hasAttribute('data-fade')).toBe(false)
    }
  })

  test('takes step copy and icons from the CMS and falls back per position', () => {
    const blocks = defaultHomeLayout.map((block) =>
      block.blockType !== 'homeProcess'
        ? block
        : {
            ...block,
            steps: block.steps.map((step, index) =>
              index === 0
                ? {
                    ...step,
                    description: 'Authored brief description.',
                    infographicImage: { alt: 'Brief icon', url: '/api/media/file/brief.png' },
                    label: 'Kickoff',
                    title: 'Authored Brief',
                  }
                : index === 3
                  ? { ...step, description: null, label: null, title: 'Weld & Fit' }
                  : step,
            ),
          },
    )
    const { queries, section } = renderProcess(blocks)

    const first = section.querySelector('[data-step="1"]') as HTMLElement
    expect(within(first).getByRole('heading', { level: 3, name: 'Authored Brief' })).toBeTruthy()
    expect(first.querySelector('.process-panel-label')?.textContent).toBe('Kickoff')
    expect(first.querySelector('.process-panel-description')?.textContent).toBe(
      'Authored brief description.',
    )
    expect(queries.getByAltText('Brief icon').getAttribute('src')).toBe('/api/media/file/brief.png')

    const fourth = section.querySelector('[data-step="4"]') as HTMLElement
    expect(within(fourth).getByRole('heading', { level: 3, name: 'Weld & Fit' })).toBeTruthy()
    expect(fourth.querySelector('.process-panel-label')?.textContent).toBe(
      defaultHomeProcessSteps[3].label,
    )
    expect(fourth.querySelector('.process-panel-description')?.textContent).toBe(
      defaultHomeProcessSteps[3].description,
    )
  })

  test('closes with the custom engineering panel and lets the CMS override it', () => {
    const { section } = renderProcess()
    const cta = section.querySelector('[data-panel="cta"]') as HTMLElement

    expect(cta.querySelector('.process-cta-label')?.textContent).toBe('Custom engineering')
    expect(
      within(cta).getByRole('heading', { level: 3, name: 'Custom Product Development' }),
    ).toBeTruthy()
    expect(cta.querySelector('.process-cta-text')?.textContent).toMatch(
      /^For requirements outside our standard product range/,
    )
    const link = within(cta).getByRole('link', { name: /Custom Product Service/ })
    expect(link.getAttribute('href')).toBe('/contact')

    cleanup()

    const blocks = defaultHomeLayout.map((block) =>
      block.blockType !== 'homeProcess'
        ? block
        : {
            ...block,
            cta: { ctaHref: '/products', ctaLabel: 'Talk to engineering', heading: 'Built to order' },
          },
    )
    const { section: overridden } = renderProcess(blocks)
    const overriddenCta = overridden.querySelector('[data-panel="cta"]') as HTMLElement

    expect(within(overriddenCta).getByRole('heading', { level: 3, name: 'Built to order' })).toBeTruthy()
    expect(within(overriddenCta).getByRole('link', { name: /Talk to engineering/ }).getAttribute('href')).toBe(
      '/products',
    )
    // Fields the editor left empty keep their defaults rather than going blank.
    expect(overriddenCta.querySelector('.process-cta-label')?.textContent).toBe('Custom engineering')
  })

  /*
   * The scroll behaviour is a contract, not a mood: pinned, scrubbed to the
   * scroll position, gated to wide viewports without reduced motion, and never
   * hijacking the wheel or advancing on its own.
   */
  test('pins and scrubs the accordion from page scroll, only where it can be read', () => {
    expect(component).toMatch(/import\('gsap\/ScrollTrigger'\)/)
    expect(component).toMatch(/pin,/)
    expect(component).toMatch(/scrub:\s*[\d.]+/)
    expect(component).toMatch(/invalidateOnRefresh:\s*true/)
    expect(component).toContain(`'${ACCORDION_MEDIA}'`)
    expect(component).not.toMatch(/addEventListener\(\s*['"]wheel['"]/)
    expect(component).not.toMatch(/setInterval|autoplay|preventDefault/)
  })

  /*
   * The section is a client component. A value import from '@/data/home'
   * drags the Payload client and next/cache into the browser bundle, which
   * Turbopack rejects and the whole home page 500s. Only types may cross.
   */
  test('imports nothing but types from the server data layer', () => {
    // Per line: the file has no semicolons, so a multi-line class would run
    // one import statement into the next.
    const homeImports = component.match(/^import\s+(?!type\s)[^\n]*from '@\/data\/home'/gm) ?? []
    expect(homeImports).toEqual([])
    expect(component).toMatch(/^import type \{[^}]*\} from '@\/data\/home'/m)
  })

  /*
   * Every step sits on the row at once — the active one expanded, the rest as
   * rails — rather than one panel owning the whole width. That is what keeps
   * two panels moving per slot and stops the open panel reading as empty.
   */
  /*
   * Panels are sized by flex, never by a computed width. That is the whole
   * reason the row cannot develop a gap and the closing panel can hold a fixed
   * width while steps come and go beside it.
   */
  test('sizes the row with flex so it is always full and the closing panel is fixed', () => {
    expect(stylesheet).toMatch(/--process-rail:\s*clamp\(/)
    expect(stylesheet).toMatch(/--process-cta:\s*clamp\(/)

    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))
    expect(accordion).toMatch(/\.process-panel \{[^}]*flex:\s*0 0 0px;/s)
    // Flex items default to min-width: auto and would refuse to shrink to nothing.
    expect(accordion).toMatch(/\.process-panel \{[^}]*min-width:\s*0;/s)
    expect(accordion).toMatch(/\.process-panel \{[^}]*box-shadow:\s*inset -1px 0 0/s)
    expect(accordion).not.toMatch(/\.process-panel \{[^}]*border-right:/s)
    // Two steps open at rest: the row starts full, and never shows more.
    expect(accordion).toMatch(
      /\.process-panel\[data-panel='step'\]:nth-child\(-n \+ 2\) \{\s*flex-grow:\s*1;/s,
    )
    // The leftmost panel has no neighbour to draw its opening rule.
    expect(accordion).toMatch(
      /\.process-accordion \{\s*border-left:\s*1px solid var\(--process-line\);/s,
    )
    expect(accordion).toMatch(/\.process-panel--cta \{[^}]*flex:\s*0 0 var\(--process-cta\);/s)
    expect(accordion).not.toMatch(/\.process-panel--cta \{[^}]*flex:\s*1 1 auto;/s)
  })

  /*
   * Rules span the viewport, cards stay on the page container, and one rule
   * runs down each container edge for the full height of the section.
   */
  test('rules the band full width while the cards stay on the container', () => {
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))

    expect(accordion).toMatch(/\.process-band \{[^}]*border-block:\s*1px solid var\(--process-line\);/s)
    expect(accordion).toMatch(
      /\.process-accordion \{[^}]*width:\s*min\(100%, var\(--page-content\)\);[^}]*margin-inline:\s*auto;/s,
    )
    /*
     * The frame rules hang off the pinned box, not the shell, so they reach
     * the top and bottom of the viewport instead of stopping at its padding.
     */
    expect(accordion).toMatch(/\.process-pin::before \{\s*left:\s*var\(--page-inset\);/s)
    expect(accordion).toMatch(/\.process-pin::after \{\s*right:\s*var\(--page-inset\);/s)
    // Up over the hand-off strip, or the rules stop short of the dark area's top.
    expect(accordion).toMatch(
      /\.process-pin::before,\s*\.process-pin::after \{[^}]*top:\s*calc\(-1 \* var\(--process-handoff-cover\)\);[^}]*bottom:\s*0;/s,
    )
    // Copy sits inside the rules rather than flush against them.
    expect(accordion).toMatch(
      /\.process-head \{[^}]*padding:\s*0 calc\(var\(--page-inset\) \+ var\(--process-pad\)\)/s,
    )
    expect(accordion).toMatch(
      /\.process-summary \{[^}]*margin-inline:\s*calc\(var\(--page-inset\) \+ var\(--process-pad\)\);/s,
    )
  })

  /*
   * The pin holds the viewport for several screens; without a cue that reads
   * as a track with an end, it feels like the page has stopped.
   */
  test('shows a scroll cue that fills across the pinned range', () => {
    const { section } = renderProcess()
    const progress = section.querySelector('.process-progress') as HTMLElement

    expect(progress).toBeTruthy()
    // Decoration, not content: it must not be announced.
    expect(progress.getAttribute('aria-hidden')).toBe('true')
    expect(progress.querySelector('span')).toBeTruthy()
    // On the pinned box's bottom edge, which is the bottom of the screen.
    expect(progress.parentElement?.className).toBe('process-pin')
    expect(stylesheet).toMatch(/\.process-progress \{[^}]*position:\s*absolute;[^}]*bottom:\s*0;/s)
    expect(stylesheet).toMatch(/\.process-progress span \{[^}]*transform:\s*scaleX\(0\);/s)
    expect(stylesheet).toMatch(/\.process-progress span \{[^}]*transform-origin:\s*left center;/s)
    // Driven by the same timeline, so it maps to the real scroll range.
    expect(component).toMatch(/scaleX:\s*1/)
  })

  /*
   * A slot collapses one step while expanding the next, so two panels are
   * always in motion; the last slot has no successor, which is what hands the
   * freed width to the closing panel.
   */
  /*
   * Panel widths animate, so type sized in container units grew and shrank
   * with them. A title should only fade through at a constant size.
   */
  test('holds the card titles at a fixed size instead of scaling them', () => {
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))

    expect(accordion).not.toMatch(/cqi/)
    expect(accordion).not.toMatch(/container-type/)
    // The size lives on the title's window now; the title inherits it.
    expect(accordion).toMatch(/\.process-panel-title-clip \{[^}]*font-size:\s*min\(clamp\(/s)
    expect(component).toMatch(/opacity: 1 \}/)
  })

  /*
   * A title bounded left and right takes its width from the animating panel,
   * so the text rewraps mid-animation and the block jumps between two and
   * three lines. A set measure makes every break deterministic; `text-wrap:
   * balance` is excluded because it re-decides the breaks as the box moves.
   */
  test('gives the panel copy a fixed measure so it never rewraps mid-animation', () => {
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))

    /*
     * The title measure is in em, not a vw clamp. Word widths are constant
     * relative to the font (~5.16em for "Inspection"), but the font clamps at
     * 2rem past ~1600px while vw keeps growing -- so a vw width that fits the
     * longest word at 1366 overflows and slices it at 1920.
     */
    expect(stylesheet).toMatch(/--process-title-width:\s*[\d.]+em;/)
    expect(stylesheet).toMatch(/--process-body-width:\s*clamp\(/)
    expect(accordion).toMatch(
      /\.process-panel-title \{[^}]*width:\s*var\(--process-title-width\);/s,
    )
    expect(accordion).toMatch(
      /\.process-panel-description \{[^}]*width:\s*var\(--process-body-width\);/s,
    )
    /*
     * The title is in flow and its window is a flex box: align-items centres it
     * vertically, justify-content: flex-end keeps it on the right so it still
     * slides behind the rail. Centring it with a translate instead would be
     * overwritten -- GSAP drives the title's own transform as it slides in.
     *
     * `inset: auto` and a non-growing flex basis are what stop the box being
     * stretched; bounding it on two edges is what made the width track before.
     */
    expect(accordion).toMatch(/\.process-panel-title \{[^}]*inset:\s*auto;/s)
    expect(accordion).toMatch(/\.process-panel-title \{[^}]*flex:\s*0 0 auto;/s)
    expect(accordion).toMatch(
      /\.process-panel-title-clip \{[^}]*align-items:\s*center;[^}]*justify-content:\s*flex-end;/s,
    )
    expect(accordion).not.toMatch(/\.process-panel-title \{[^}]*transform:/s)
    expect(accordion).not.toMatch(/\.process-panel-title \{[^}]*text-wrap:/s)
    // Positioned right, read from the left.
    expect(accordion).toMatch(/\.process-panel-title \{[^}]*text-align:\s*left;/s)
  })

  /*
   * The title used to be faded out early in the collapse, because a full-width
   * title in a narrowing panel would otherwise run over its own rail label.
   * A window bounded by the rail clips it instead, so it can stay readable
   * while the panel closes and fade only once little of it is left.
   */
  test('clips the title behind the rail rather than fading it out early', () => {
    const { section } = renderProcess()
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))

    for (const panel of section.querySelectorAll('[data-panel="step"]')) {
      const clip = panel.querySelector('.process-panel-title-clip')
      expect(clip?.firstElementChild?.className).toBe('process-panel-title')
    }
    expect(accordion).toMatch(
      /\.process-panel-title-clip \{[^}]*left:\s*calc\(var\(--process-rail\) \+ 0\.5rem\);[^}]*overflow:\s*hidden;/s,
    )
    // The window owns the size; the title inherits it so the two cannot drift.
    expect(accordion).toMatch(/\.process-panel-title \{[^}]*font-size:\s*inherit;/s)
  })

  /*
   * A window that only clips leaves a straight edge, which slices the copy
   * mid-letter as the panel closes. Each window dissolves at the edge its copy
   * disappears behind instead -- the title at its leading edge, the
   * description at its trailing one.
   */
  test('fades the title behind a gradient edge and the description on opacity alone', () => {
    const { section } = renderProcess()
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))

    for (const panel of section.querySelectorAll('[data-panel="step"]')) {
      expect(panel.querySelector('.process-panel-body-clip')?.firstElementChild?.className).toBe(
        'process-panel-description',
      )
    }
    /*
     * The title carries a leading-edge gradient on top of its opacity fade: it
     * slides behind the rail as the panel narrows, and a straight cut sliced it
     * mid-letter. The description does not -- it is anchored left and fades on
     * opacity alone, which is what stops it reading as copy sitting behind a
     * gradient.
     */
    expect(stylesheet).toMatch(/--process-fade-edge:\s*[\d.]+rem;/)
    expect(accordion).toMatch(
      /\.process-panel-title-clip \{[^}]*mask-image:\s*linear-gradient\(to right, transparent 0, #000 var\(--process-fade-edge\)\);/s,
    )
    expect(accordion).not.toMatch(/\.process-panel-body-clip \{[^}]*mask-image/s)
  })

  /*
   * Copy arrives with the panel and leaves at the end of the collapse, rather
   * than popping in once the panel has stopped and out as soon as it starts.
   */
  test('slides and fades the copy across the movement, not after it', () => {
    // In: most of the opening slot, with the title travelling as it fades.
    expect(component).toMatch(/duration: 0\.75, ease: 'power2\.out'[^}]*opacity: 1 \}/)
    expect(component).toMatch(/\{ x: 28 \}/)
    expect(component).toMatch(/emergesAt \+ 0\.05/)
    /*
     * Out: over the middle of the collapse, not its tail. Without the gradient
     * mask the copy has to be gone before the panel is narrow enough for the
     * clip window's straight edge to cut it mid-letter.
     */
    expect(component).toMatch(/index \+ 0\.2/)
  })

  /*
   * A wide landscape laptop is the hard case: plenty of width, little height.
   * These values used to clamp against rem floors that never gave way, so the
   * stack overran the viewport and took the closing paragraph and the progress
   * rail off the bottom of the screen.
   */
  test('keeps the vertical rhythm height-aware so short viewports still fit', () => {
    const accordion = stylesheet.slice(stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`))

    expect(accordion).toMatch(/\.process-heading \{[^}]*font-size:\s*min\([^;]*svh\);/s)
    expect(accordion).toMatch(/\.process-accordion \{[^}]*height:\s*clamp\(12rem, 44svh, 23rem\);/s)
    expect(accordion).toMatch(/\.process-shell \{[^}]*padding-block:\s*clamp\(0\.875rem, 3\.5svh/s)
    // The closing panel carries the most copy in the shortest box.
    expect(accordion).toMatch(/\.process-cta-heading \{[^}]*font-size:\s*min\([^;]*svh\);/s)
    expect(accordion).toMatch(/\.process-cta-text \{[^}]*font-size:\s*min\([^;]*svh\);/s)
    expect(accordion).toMatch(/\.process-cta-link \{[^}]*min-height:\s*clamp\([^;]*svh/s)
  })

  /*
   * The header condensing is a real layout change above this section: it drops
   * --header-height, the industry cards pin higher and each of the six grows,
   * adding ~144px of document height after ScrollTrigger has measured. Without
   * re-measuring, the pin engaged that far early and snapped into place.
   */
  test('re-measures when the header condenses, so the pin does not snap', () => {
    // Via the shared helper (its own spec covers the observer), released on cleanup.
    expect(component).toMatch(/import \{ onFirstMediaMatch, watchHeaderCondense \} from '\.\/scrollTriggerRefresh'/)
    expect(component).toMatch(/const stopWatching = watchHeaderCondense\(ScrollTrigger\)/)
    expect(component).toMatch(/stopWatching\(\)/)
    expect(component).not.toMatch(/new MutationObserver/)
  })

  /*
   * Supporting copy only where there is room for it. On a short landscape
   * laptop it crowds the row and pushes the closing paragraph and the scroll
   * cue off the bottom of the screen.
   */
  test('shows the supporting copy only on a tall desktop viewport', () => {
    expect(stylesheet).toMatch(
      /\.process-intro,\s*\.process-summary \{\s*display:\s*none;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 64rem\) and \(min-height: 45rem\) \{\s*\.process-intro,\s*\.process-summary \{\s*display:\s*block;/s,
    )
  })

  test('moves two panels per slot and never pins early', () => {
    // Incoming steps grow into the leftover; outgoing ones settle at a rail.
    expect(component).toMatch(/\{ flexGrow: 0 \}/)
    expect(component).toMatch(/flexBasis: \(\) => dims\.rail, flexGrow: 0/)
    // The closing panel only grows on the final slot -- its turn.
    expect(component).toMatch(/ctaPanel,\s*\{ flexGrow: 0 \}/)
    // The config key, not the word — the comment above it explains the choice.
    expect(component).not.toMatch(/anticipatePin:/)
    expect(component).toMatch(/scrub:\s*1\.2/)
  })

  test('stacks the steps as cards by default and only becomes an accordion in the gated media query', () => {
    const accordionStart = stylesheet.indexOf(`@media ${ACCORDION_MEDIA}`)
    expect(accordionStart).toBeGreaterThan(-1)

    const base = stylesheet.slice(stylesheet.indexOf('.manufacturing-process {'), accordionStart)
    expect(base).toMatch(/\.process-accordion \{[^}]*display:\s*grid;/s)
    expect(base).not.toMatch(/\.process-accordion \{[^}]*overflow:\s*hidden/s)

    const accordion = stylesheet.slice(accordionStart)
    expect(accordion).toMatch(/\.process-pin \{[^}]*min-height:\s*100svh;/s)
    expect(accordion).toMatch(/\.process-accordion \{[^}]*display:\s*flex;[^}]*overflow:\s*hidden;/s)
  })

  test('covers the sticky industries card on hand-off from its own dark surface', () => {
    expect(stylesheet).toMatch(
      /\.manufacturing-process \{[^}]*position:\s*relative;[^}]*z-index:\s*30;[^}]*isolation:\s*isolate;/s,
    )
    expect(stylesheet).toMatch(
      /\.manufacturing-process::before \{[^}]*top:\s*calc\(-1 \* var\(--process-handoff-cover\)\);[^}]*background:\s*var\(--process-surface\);/s,
    )
    expect(stylesheet).not.toMatch(/--process-blue/)
  })
})
