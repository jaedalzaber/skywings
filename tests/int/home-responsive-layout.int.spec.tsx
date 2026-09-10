import { render } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

const stylesheetPath = resolve(process.cwd(), 'src/app/(frontend)/styles.css')
const baseStylesheet = existsSync(stylesheetPath) ? readFileSync(stylesheetPath, 'utf8') : ''

/*
 * The responsive composition is the tail of the base sheet, after this marker.
 * Slicing keeps the assertions below scoped to those rules instead of matching
 * same-named selectors and media queries from the sections above it.
 */
const responsiveMarker = '/* ===== Home responsive composition ===== */'
const stylesheet = baseStylesheet.includes(responsiveMarker)
  ? baseStylesheet.slice(baseStylesheet.indexOf(responsiveMarker))
  : ''

const reducedMotionBlock = stylesheet.slice(
  stylesheet.indexOf('@media (prefers-reduced-motion: reduce)'),
)

describe('responsive home layout', () => {
  test('uses one laptop-led semantic layout across every home section', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    expect(container.querySelector('#top')?.getAttribute('data-responsive-layout')).toBe('hero')
    expect(container.querySelector('.services-grid')?.getAttribute('data-responsive-layout')).toBe(
      'services',
    )
    expect(container.querySelector('#industries')?.getAttribute('data-responsive-layout')).toBe(
      'industries',
    )
    expect(
      container.querySelector('#manufacturing-process')?.getAttribute('data-responsive-layout'),
    ).toBe('process')
  })

  /*
   * The services band steps one/two/three across the same breakpoints the
   * rest of the page uses. These rules live in the base sheet rather than the
   * responsive tail, so they are asserted against baseStylesheet.
   */
  test('steps the services grid from one column to three', () => {
    expect(baseStylesheet).toMatch(
      /\.services-grid-list \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    )
    expect(baseStylesheet).toMatch(
      /@media \(min-width: 40rem\) \{\s*\.services-grid-list \{[^}]*repeat\(2, minmax\(0, 1fr\)\);/s,
    )
    expect(baseStylesheet).toMatch(
      /@media \(min-width: 64rem\) \{\s*\.services-grid-list \{[^}]*repeat\(3, minmax\(0, 1fr\)\);/s,
    )
  })

  /*
   * Hover artwork mounts only while a card is active, so it has no previous
   * opacity to transition from -- it has to be an animation, or the fade is
   * skipped entirely.
   */
  test('fades hover artwork in with an animation and drops it under reduced motion', () => {
    expect(baseStylesheet).toMatch(
      /\.services-grid-card-motion \{[^}]*animation:\s*services-motion-in/s,
    )
    expect(baseStylesheet).toMatch(/@keyframes services-motion-in/)
    const servicesReducedMotion = baseStylesheet.slice(
      baseStylesheet.indexOf('.services-grid-card-label'),
    )
    expect(servicesReducedMotion).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[^]*?\.services-grid-card-motion \{\s*animation:\s*none;/s,
    )
  })
  test('defines mobile, laptop, and desktop compositions at the agreed boundaries', () => {
    expect(stylesheet).toMatch(/@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)/)
    expect(stylesheet).toMatch(/@media \(min-width: 90rem\)/)
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-content-band \{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*[\d.]+\);/s,
    )
    expect(stylesheet).toMatch(/\.industries-showcase-card\s*\{[^}]*grid-template-columns:/s)
  })

  /*
   * The cards accumulate into a stack of title strips. Each one has to pin a
   * peek lower than the one before it, and they have to be siblings in one
   * container -- a card pinned inside its own wrapper unpins as soon as that
   * wrapper scrolls past, which is why the per-card stage was removed.
   */
  test('collects the industry cards into a peeking stack', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-card \{[^}]*position:\s*sticky;[^}]*top:\s*calc\(\s*var\(--industries-card-sticky-top\) \+ var\(--industry-index\) \* var\(--industries-peek\)\s*\);/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-card \{[^}]*border-radius:\s*0;/s,
    )
    // The collected strips come out of the card's height, or the last card
    // runs past the bottom of the viewport.
    expect(stylesheet).toMatch(
      /--industries-card-height:[^;]*var\(--industries-count[^;]*var\(--industries-peek\)/s,
    )
  })

  /*
   * The collected stack has to release in one piece. A sticky card unpins when
   * its containing block's bottom passes `top + height`, and each card's top is
   * one peek lower than the last -- so as plain siblings in a single container
   * they unpinned in reverse and slid up onto the still-pinned cards.
   *
   * Each card therefore gets a stage, and stage i has to run `index * peek`
   * further than the one before to cancel that difference. The height and the
   * negative margin must carry the same tail, or the stages stop contributing
   * one step each to the flow.
   */
  test('gives each card a stage whose end cancels its sticky offset', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const stack = container.querySelector('.industries-showcase-stack')

    expect(stack?.children.length).toBeGreaterThan(1)
    for (const child of Array.from(stack?.children ?? [])) {
      expect(child.classList.contains('industries-showcase-card-stage')).toBe(true)
      expect(child.querySelector('.industries-showcase-card')).not.toBeNull()
    }

    const tail = String.raw`var\(--industry-index\) \* var\(--industries-peek\)`
    expect(stylesheet).toMatch(
      new RegExp(
        String.raw`\.industries-showcase-card-stage \{[^}]*height:\s*calc\(\s*\(var\(--industries-count, 6\) - var\(--industry-index\)\) \* var\(--industries-step\) \+\s*${tail}\s*\);`,
        's',
      ),
    )
    expect(stylesheet).toMatch(
      new RegExp(
        String.raw`\.industries-showcase-card-stage \{[^}]*margin-bottom:\s*calc\([^;]*var\(--industries-step\) \+\s*${tail}[^;]*\);`,
        's',
      ),
    )
    // The overlapping stages reach past the stack's own flow end, so the stack
    // pads for them or the deepest one hangs over the next section.
    expect(stylesheet).toMatch(
      /\.industries-showcase-stack \{[^}]*padding-bottom:\s*calc\(\(var\(--industries-count, 6\) - 1\) \* var\(--industries-peek\)\);/s,
    )
  })

  /*
   * The heading used to pin above the card stack. It now scrolls away with the
   * band, so the two white masks that hid cards passing under it are gone and
   * the cards pin directly under the header instead of below a reserved title
   * height -- which would otherwise leave a dead band at the top of the stack.
   */
  /*
   * The cards pin flush under the sticky header. The offset has to come from
   * --header-height rather than a literal: the bar condenses on scroll (80px at
   * rest, 56px away from the top) and every hard-coded value left the
   * difference as dead white space above the stack.
   */
  test('pins the industry cards flush under the header in both header states', () => {
    expect(baseStylesheet).toMatch(/:root \{[^}]*--header-height:\s*[\d.]+rem;/s)
    expect(baseStylesheet).toMatch(/\.topbar \{[^}]*height:\s*var\(--header-height\);/s)
    expect(stylesheet).toMatch(/--industries-sticky-top:\s*var\(--header-height\);/)
    // No breakpoint may re-introduce a literal offset.
    expect(stylesheet).not.toMatch(/--industries-sticky-top:\s*[\d.]+rem;/)

    // The condensed state is the one that regressed: the bar shrinks under
    // html[data-nav-stuck], so the token has to move with it and the bar's own
    // min-height has to read from the token rather than repeat the number.
    expect(baseStylesheet).toMatch(
      /html\[data-nav-stuck='true'\] \{[^}]*--header-height:\s*[\d.]+rem;/s,
    )
    expect(baseStylesheet).toMatch(
      /html\[data-nav-stuck='true'\] \.topbar \{[^}]*min-height:\s*var\(--header-height\);/s,
    )
  })

  /*
   * The bar eases as it tightens but snaps back open. Easing it open slid the
   * page under it for 200ms after --header-height had already jumped, and
   * Chrome left a stripe of stale pixels below the bar on the dark
   * capabilities page. The transition belongs to the condensed state only, so
   * leaving that state takes none.
   */
  test('eases the header closed but not open', () => {
    const base = baseStylesheet.match(/\n\.topbar \{[^}]*\}/)?.[0] ?? ''
    expect(base).not.toMatch(/transition:/)
    expect(baseStylesheet).toMatch(
      /html\[data-nav-stuck='true'\] \.topbar \{[^}]*transition:\s*min-height 200ms ease,\s*padding-block 200ms ease;/s,
    )
  })

  test('scrolls the industries heading away instead of pinning it', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-intro \{[^}]*position:\s*relative;/s,
    )
    expect(stylesheet).not.toMatch(
      /\[data-responsive-layout='industries'\] \.industries-showcase-intro \{[^}]*position:\s*sticky;/s,
    )
    expect(stylesheet).not.toMatch(/\.industries-showcase-intro::before\s*\{/)
    expect(stylesheet).not.toMatch(/\.industries-showcase-intro::after\s*\{/)
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\] h2 \{[^}]*width:\s*min\(100%,\s*13ch\);[^}]*text-wrap:\s*balance;/s,
    )
    expect(stylesheet).toMatch(/--industries-card-sticky-top:\s*var\(--industries-sticky-top\);/)
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
      /\.industries-showcase-intro \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*padding:\s*1\.5rem var\(--page-inset\) 2\.5rem;/s,
    )
    expect(mobileBlock).toMatch(
      /\.industries-showcase-card-inner \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    )
  })

  /*
   * The band is one column bounded by the shared page container. Its alignment
   * (justify-items / text-align) is a live design knob and deliberately not
   * asserted here -- pinning it only produced churn.
   */
  test('holds the industries title band on the shared page container', () => {
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?\.industries-showcase-intro \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*width:\s*min\(100%,\s*var\(--page-content\)\);[^}]*margin:\s*0 auto;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\.industries-showcase-intro \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*width:\s*min\(100%,\s*var\(--page-content\)\);[^}]*margin:\s*0 auto;/s,
    )
  })

  /*
   * The card text used to sit in a second grid column, indented past a label
   * column that held the 01/02 counter. The counter is gone and the title,
   * summary and product rail all start on the page container's left edge, so
   * the card body is a single column with no gap to clear.
   */
  test('starts each card title and its copy on the page container edge', () => {
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\.industries-showcase-card-inner \{[^}]*grid-template-columns:\s*minmax\(0,\s*44\.8125rem\);/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\.industries-showcase-card-body \{[^}]*grid-column:\s*1;/s,
    )
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\.industries-showcase-card-summary \{[^}]*margin-left:\s*0;/s,
    )
    expect(stylesheet).toMatch(/--industries-product-start-offset:\s*0rem;/)
  })

  test('drops the card counter and sizes the title to the collapsed strip', () => {
    expect(stylesheet).toMatch(/\.industries-showcase-card-code \{[^}]*display:\s*none;/s)
    // A clamp, so one line still fits the collapsed strip at every width. The
    // exact stops are a design knob and not pinned.
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\.industries-showcase-card-title \{[^}]*font-size:\s*clamp\([^)]+\);/s,
    )
  })

  /*
   * The CTA and the image share one grid cell, so the button tracks the
   * image's bottom edge instead of carrying its own offsets: full-width bar
   * while the card is open, small pill on the right once it collapses.
   *
   * Declared once outside the breakpoints -- laptop and desktop share the
   * frame. Scoping it to the desktop block previously left laptop with an
   * unstyled frame, which flowed below the text and got clipped away.
   */
  /*
   * Open card: a bar along the image's bottom. Collapsed row: a corner pill,
   * hidden until the row is hovered or focused.
   *
   * Two sizes, and the whole stability of the control is in never letting the
   * change between them be seen. Easing it played the resize in full view in
   * whichever direction it ran -- growing back into a bar as it faded out,
   * shrinking out of one as it faded in. Putting the pill on the hover rule
   * instead only moved the problem to the pointer.
   *
   * So: geometry is instant, it belongs to the collapsed state rather than to
   * hover, and the collapsed rule delays it by exactly the fade. Every resize
   * then happens at opacity 0, and hover changes nothing but opacity.
   */
  test('resizes the card CTA only while it is invisible', () => {
    // The frame-stacked rule (position: static), not the earlier grid-row one.
    const openCta =
      /\[data-responsive-layout='industries'\] \.industries-showcase-cta \{\s*position:\s*static;([^}]*)\}/s.exec(
        stylesheet,
      )
    expect(openCta).not.toBeNull()
    const open = openCta?.[1] ?? ''
    expect(open).toMatch(/grid-area:\s*media;/)
    expect(open).toMatch(/align-self:\s*end;/)
    // Opacity alone eases; going back to the bar, geometry has no delay either.
    expect(open).toMatch(/transition:\s*opacity var\(--industries-cta-fade\) ease;/)

    const collapsedCta =
      /\[data-responsive-layout='industries'\]\s*\.industries-showcase-card\[data-collapsed='true'\]\s*\.industries-showcase-cta \{([^}]*)\}/s.exec(
        stylesheet,
      )
    expect(collapsedCta).not.toBeNull()
    const body = collapsedCta?.[1] ?? ''
    expect(body).toMatch(/opacity:\s*0;/)
    expect(body).toMatch(/pointer-events:\s*none;/)

    // The pill is the collapsed state's own size, not something hover applies.
    expect(body).toMatch(/width:\s*11\.5rem;/)
    expect(body).toMatch(/border-radius:\s*999px;/)
    expect(body).toMatch(/font-size:\s*0\.75rem;/)

    /*
     * Every property that differs between the bar and the pill has to be held
     * back by the fade, or that one snaps in view while the rest wait.
     */
    for (const property of [
      'width',
      'min-height',
      'margin',
      'padding',
      'border-radius',
      'font-size',
    ]) {
      expect(body).toMatch(new RegExp(`${property} 0s var\\(--industries-cta-fade\\)`))
    }
    // Zero duration throughout: nothing about the size is ever animated.
    expect(body).not.toMatch(/(width|height|margin|padding|radius|font-size) \d+m?s ease/)

    /*
     * Hover is opacity and pointer-events only. Anything else here moves the
     * control under the pointer that just arrived on it.
     */
    const hoverCta =
      /\.industries-showcase-card\[data-collapsed='true'\]:is\(:hover, :focus-within\)\s*\.industries-showcase-cta \{([^}]*)\}/s.exec(
        stylesheet,
      )
    expect(hoverCta).not.toBeNull()
    const hover = (hoverCta?.[1] ?? '').replace(/\/\*[^]*?\*\//g, '')
    expect(hover).toMatch(/opacity:\s*1;/)
    expect(hover).toMatch(/pointer-events:\s*auto;/)
    expect(hover).not.toMatch(
      /width|min-width|height|min-height|padding|margin|border-radius|font-size|transition/,
    )
  })

  /*
   * An incoming card fades its contents up over its own white. It must never
   * be the card that fades: a card below full opacity is a window onto the one
   * it is covering, and it is covering one for the whole of the arrival.
   */
  test('fades a card in over solid white, never by fading the card', () => {
    const cardRule =
      /\[data-responsive-layout='industries'\] \.industries-showcase-card \{([^}]*)\}/s.exec(
        stylesheet,
      )
    expect(cardRule).not.toBeNull()
    const card = cardRule?.[1] ?? ''
    // Solid at every scroll position, so nothing shows through the overlap.
    expect(card).toMatch(/background:\s*#ffffff;/)
    expect(card).not.toMatch(/opacity/)

    // The fade is carried by the contents instead.
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-inner,\s*\[data-responsive-layout='industries'\]\s*\.industries-showcase-card-media-frame \{\s*opacity:\s*var\(--industries-enter, 1\);/s,
    )
    // 1 without the controller: no JS, and no motion, still show everything.
    expect(reducedMotionBlock).toMatch(/\.industries-showcase-card-media-frame \{\s*opacity:\s*1;/s)

    const controller = readFileSync(
      resolve(process.cwd(), 'src/components/home/IndustriesStackController.tsx'),
      'utf8',
    )
    expect(controller).toMatch(/setProperty\(\s*'--industries-enter',/)
    // Published on the card, and read by its children -- never set as opacity.
    expect(controller).not.toMatch(/style\.opacity/)
    expect(controller).toMatch(/prefers-reduced-motion: reduce/)
    expect(controller).toMatch(/removeProperty\('--industries-enter'\)/)
  })

  /*
   * The blur is scaled by the same progress as the fade, so the two cannot
   * drift apart, and it is mounted only while there is an arrival to soften --
   * any filter but `none` holds a compositing layer and a stacking context
   * open on the contents of every card, for the whole page.
   */
  test('blurs an arriving card in on the same progress as the fade', () => {
    expect(baseStylesheet).toMatch(/--industries-enter-blur:\s*[\d.]+rem;/)
    expect(stylesheet).toMatch(
      /\.industries-showcase-card\[data-entering='true'\]\s*:is\(\s*\.industries-showcase-card-inner,\s*\.industries-showcase-card-media-frame\s*\) \{\s*filter: blur\(\s*calc\(\(1 - var\(--industries-enter, 1\)\) \* var\(--industries-enter-blur\)\)\s*\);/s,
    )
    /*
     * Every rule that applies the blur has to carry the gate. An ungated one
     * is the whole cost this avoids: it would sit at blur(0) on a settled card
     * and keep the layer alive anyway.
     */
    // `var(...)`, so the token's own declaration is not counted as a use.
    const blurRules =
      baseStylesheet.match(/[^{}]+\{[^}]*var\(--industries-enter-blur\)[^}]*\}/g) ?? []
    expect(blurRules).toHaveLength(1)
    expect(blurRules[0]).toMatch(/data-entering='true'/)

    expect(reducedMotionBlock).toMatch(/filter:\s*none;/)

    const controller = readFileSync(
      resolve(process.cwd(), 'src/components/home/IndustriesStackController.tsx'),
      'utf8',
    )
    expect(controller).toMatch(/if \(progress < 1\) card\.setAttribute\('data-entering', 'true'\)/)
    expect(controller).toMatch(/else card\.removeAttribute\('data-entering'\)/)
    expect(controller).toMatch(/removeAttribute\('data-entering'\)/)
  })

  /*
   * The other half of the same instability. Even with the resize hidden, the
   * CTA blinked wherever a card sat on the collapse threshold: one pixel
   * decided the flag, and sub-pixel scrolling flipped it between frames. Two
   * thresholds put a dead band in the middle, so the flag has nothing to
   * chatter across.
   */
  test('gives the collapse flag hysteresis so the CTA cannot blink', () => {
    const controller = readFileSync(
      resolve(process.cwd(), 'src/components/home/IndustriesStackController.tsx'),
      'utf8',
    )

    const enter = Number(/const COLLAPSE_ENTER = (\d+)/.exec(controller)?.[1])
    const exit = Number(/const COLLAPSE_EXIT = (\d+)/.exec(controller)?.[1])
    expect(Number.isFinite(enter)).toBe(true)
    expect(Number.isFinite(exit)).toBe(true)
    // A band, not a line: entering collapse must cost more than leaving it.
    expect(enter).toBeGreaterThan(exit)

    // The threshold in use is chosen from the flag's current value.
    expect(controller).toMatch(
      /const collapsed = card\.getAttribute\('data-collapsed'\) === 'true'/,
    )
    expect(controller).toMatch(/const threshold = collapsed \? COLLAPSE_EXIT : COLLAPSE_ENTER/)
    expect(controller).toMatch(/clamped < full - threshold/)
    // The single fixed threshold this replaced.
    expect(controller).not.toMatch(/clamped < full - 1\b/)
  })

  /*
   * The frame keeps its padding while only the image inside it resizes. The
   * height comes from --industries-visible, the live strip measurement the
   * controller writes each frame, so the image shrinks continuously with the
   * scroll -- a two-value toggle could only snap between open and collapsed.
   */
  test('shrinks the collapsed hero image continuously while its frame padding holds', () => {
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-media-frame \{[^}]*align-content:\s*start;[^}]*padding:\s*var\(--industries-media-inset\) 0 var\(--industries-media-inset\)\s*var\(--industries-media-inset\);/s,
    )
    /*
     * Still driven by --industries-visible, so the shrink stays continuous;
     * the scale only decides what fraction of the strip the hero fills.
     */
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-media--wide \{[^}]*height:\s*calc\(\s*\(\s*var\(--industries-visible,\s*var\(--industries-card-height\)\) - 2 \*\s*var\(--industries-media-inset\)\s*\) \* var\(--industries-media-scale\)\s*\);/s,
    )
    /*
     * 1: the hero fills its frame, so the card ends where the image ends and a
     * collapsed strip keeps equal padding above and below. At 0.6667 a third of
     * every card sat empty below the image and the laptop hero read half-size.
     */
    expect(stylesheet).toMatch(/--industries-media-scale:\s*1;/)
  })

  /*
   * A collapsed card is a list row, so its CTA is hidden until the row is
   * hovered or focused. Declared outside the desktop block so it holds at every
   * width the cards collapse at.
   */
  test('hides the CTA on collapsed cards until hover', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='industries'\]\s*\.industries-showcase-card\[data-collapsed='true'\]\s*\.industries-showcase-cta \{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/s,
    )
    expect(stylesheet).toMatch(
      /\.industries-showcase-card\[data-collapsed='true'\]:is\(:hover,\s*:focus-within\)\s*\.industries-showcase-cta \{[^}]*opacity:\s*1;/s,
    )
  })

  /*
   * The card cannot fit title, description and product carousel in one viewport
   * height on a landscape screen, so the copy is dropped there. Keyed on the
   * aspect ratio because the constraint is vertical: a width-only rule left the
   * description showing on 1517x900 and 1920x1080 laptops, which have the least
   * room for it.
   */
  /*
   * Laptop drops the description so the product carousel has the height; every
   * other size keeps it. An aspect-ratio rule briefly extended this to any
   * landscape viewport, which also swallowed it on desktop -- hence the
   * negative assertion, so that does not come back unnoticed.
   */
  /*
   * The description reads after the product carousel. It is out of the card
   * body in the markup so the DOM order matches, and pinned to a row after the
   * rail's row 3 -- the rows either side are placed by hand, so an auto-placed
   * summary drops into the free row 2 and lands above the carousel instead.
   */
  test('places the industry description after the product carousel', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)
    const inner = container.querySelector('.industries-showcase-card-inner')
    const children = Array.from(inner?.children ?? [])
    const railIndex = children.findIndex(
      (c) =>
        c.querySelector('.industries-showcase-product-grid') ||
        c.classList.contains('industries-showcase-product-grid'),
    )
    const summaryIndex = children.findIndex((c) =>
      c.classList.contains('industries-showcase-card-summary'),
    )

    expect(railIndex).toBeGreaterThanOrEqual(0)
    expect(summaryIndex).toBeGreaterThan(railIndex)
    expect(
      inner?.querySelector('.industries-showcase-card-body .industries-showcase-card-summary'),
    ).toBeNull()
    expect(stylesheet).toMatch(/\.industries-showcase-card-summary \{[^}]*grid-row:\s*4;/s)
    expect(stylesheet).toMatch(/\.industries-showcase-product-grid \{[^}]*grid-row:\s*3;/s)
  })

  test('drops the industry description on laptop only', () => {
    expect(stylesheet).toMatch(
      /@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)[^]*?\.industries-showcase-card-summary \{[^}]*display:\s*none;/s,
    )
    expect(baseStylesheet).not.toMatch(/min-aspect-ratio/)
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
    // Breathing room around the wide hero is the frame's padding now, not a
    // margin on the image -- that is what stays put while the image resizes.
    expect(stylesheet).toMatch(
      /\.industries-showcase-card-media-frame \{[^}]*padding:\s*var\(--industries-media-inset\) 0 var\(--industries-media-inset\)\s*var\(--industries-media-inset\);/s,
    )
  })

  test('gives product rails a full-left bleed', () => {
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-grid \{[^}]*width:\s*calc\(100% \+ var\(--industries-gallery-bleed\)\);[^}]*margin-left:\s*calc\(-1 \* var\(--industries-gallery-bleed\)\);/s,
    )
  })

  /*
   * The rail runs past both ends of its box and overflow alone cut the first
   * and last cards off mid-image. A symmetric mask dissolves them instead.
   * The 0%/100% transparent stops on both sides are what make it symmetric --
   * a one-sided gradient would fade only the trailing edge.
   */
  test('fades the product rail at both ends instead of cutting it', () => {
    expect(stylesheet).toMatch(/--industries-rail-fade:\s*[\d.]+rem;/)
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-grid \{[^}]*mask-image:\s*linear-gradient\(\s*to right,\s*transparent 0,\s*#000 var\(--industries-rail-fade\),\s*#000 calc\(100% - var\(--industries-rail-fade\)\),\s*transparent 100%\s*\);/s,
    )
  })

  /*
   * The rail is driven from IndustryProductRail, not a CSS keyframe animation.
   * animation-play-state is binary, so hovering stopped it dead rather than
   * easing it down, and a drag cannot take an animation over and hand its
   * momentum back. Hover, focus, in-view and reduced motion are all handled in
   * the component now -- hence the negative assertions here.
   */
  test('drives the product rail from script rather than a keyframe animation', () => {
    // The declaration, not the word -- it still appears in a comment explaining
    // why the rail no longer uses one.
    expect(stylesheet).not.toMatch(/animation-play-state:\s*(?:running|paused)/)
    expect(stylesheet).not.toMatch(/@keyframes industries-product-marquee/)
    /*
     * No transform override under reduced motion. The component reads the same
     * media query and simply does not cruise; forcing the transform off would
     * also disable dragging, which is a deliberate action rather than motion
     * the reader did not ask for.
     */
    expect(reducedMotionBlock).not.toMatch(
      /\.industries-showcase-product-track \{[^}]*transform:\s*none/s,
    )

    const rail = readFileSync(
      resolve(process.cwd(), 'src/components/home/IndustryProductRail.tsx'),
      'utf8',
    )
    // Eased towards a target speed, never snapped to it.
    expect(rail).toMatch(/speed \+= \(target - speed\) \* \(1 - Math\.exp\(-dt \/ SPEED_TAU\)\)/)
    expect(rail).toMatch(/hovering \|\| !inView \? 0 : cruise\(\)/)
    expect(rail).toMatch(/matchMedia\('\(prefers-reduced-motion: reduce\)'\)/)
  })

  /*
   * Drag affordances: grabbable, and no selection highlight painted across the
   * cards while the pointer is dragged over them.
   */
  test('makes the product rail draggable without a selection highlight', () => {
    expect(stylesheet).toMatch(
      /\.industries-showcase-product-grid\[data-moving='true'\] \{[^}]*cursor:\s*grab;[^}]*user-select:\s*none;/s,
    )
    expect(stylesheet).toMatch(/\[data-dragging='true'\] \{[^}]*cursor:\s*grabbing;/s)
  })

  test('zooms a product image on hover, inside its own frame', () => {
    expect(stylesheet).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[^]*?\.industries-showcase-product-image \{[^}]*transform:\s*scale\(1\.12\);/s,
    )
    // Or the scaled image spills over the cards either side of it.
    expect(stylesheet).toMatch(/\.industries-showcase-product-frame \{[^}]*overflow:\s*hidden;/s)
  })

  /*
   * The industries section used to hold its place while the process section was
   * dragged up over it by a negative margin, masked by a cover strip. That read
   * as the band being stuck under a section driving over it, so once the cards
   * have collected the whole section scrolls away and the next one follows.
   *
   * The three pieces have to go together: leaving the spacer costs a viewport
   * of dead scroll, and leaving the cover paints a dark band over the bottom of
   * the industries band.
   */
  test('scrolls the industries section away instead of letting the next one overlap it', () => {
    expect(baseStylesheet).not.toMatch(/margin-bottom:\s*calc\(-100svh/)
    expect(baseStylesheet).toMatch(
      /\[data-responsive-layout='industries'\]\s*\{[^}]*margin-bottom:\s*0;[^}]*padding-bottom:\s*var\(--industries-end-gap\);/s,
    )
    expect(baseStylesheet).toMatch(/\.industries-showcase-stack::after \{[^}]*display:\s*none;/s)
    expect(baseStylesheet).not.toMatch(/--process-handoff-cover:\s*(?!0rem)[\d.]+rem;/)
  })

  test('does not clip full-bleed home sections to the centered site shell', () => {
    expect(stylesheet).not.toMatch(/main:has\(\.hero-section\)\s*\{[^}]*overflow:\s*clip;/s)
  })

  /*
   * Full-bleed sections bleed through one pair of tokens, and html reserves the
   * scrollbar gutter so the 100vw behind them excludes it.
   *
   * Without the gutter, 100vw counts the scrollbar while the containing width
   * does not, so every bleeding section sat a scrollbar wider than the content
   * box. body's overflow-x: clip hid that -- until a pinned section became
   * position: fixed, escaped the clip, and shifted the page sideways on entry
   * to the process band. Headless browsers hide scrollbars, so nothing here
   * reproduces it; these assertions stand in for that.
   */
  test('bleeds sections through the scrollbar-safe tokens', () => {
    expect(baseStylesheet).toMatch(/html \{[^}]*scrollbar-gutter:\s*stable;/s)
    expect(baseStylesheet).toMatch(/--bleed-width:\s*100vw;/)
    expect(baseStylesheet).toMatch(/--bleed-margin:\s*calc\(50% - 50vw\);/)
    // No section may go back to spelling the bleed out for itself.
    const declarations = baseStylesheet.replace(/\/\*[^]*?\*\//g, '')
    expect(declarations).not.toMatch(/width:\s*100vw;/)
    expect(declarations).not.toMatch(/margin[^:;]*:\s*(?:0 )?calc\(50% - 50vw\)/)
  })

  // The band bleeds full width, but its copy has to start on the same inline
  // edge as the sections below it — a hero-only cap put the headline left of
  // every other block on the page.
  test('keeps the hero full width with its copy on the shared page container', () => {
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-content \{[^}]*width: 100%;[^}]*max-width: var\(--max\);[^}]*margin-inline: auto;/s,
    )
    expect(stylesheet).not.toMatch(/^\s*width: 80rem;/m)
    // The point of the shared container: the hero's inline padding is the page
    // gutter itself, not a value that happens to look close to it.
    expect(stylesheet).toMatch(/--hero-inline-padding:\s*var\(--page-gutter\);/)
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
      /\[data-responsive-layout='hero'\] \.hero-content-band \{[^}]*margin-top:\s*calc\(-1 \* var\(--hero-heading-overlay-height\)\);[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*[\d.]+\);[^}]*backdrop-filter:\s*blur\([\d.]+px\);/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-copy \{[^}]*min-height:\s*var\(--hero-heading-overlay-height\);[^}]*background:\s*transparent;[^}]*backdrop-filter:\s*none;/s,
    )
    expect(stylesheet).not.toMatch(
      /\[data-responsive-layout='hero'\] \.hero-copy \{[^}]*border-top:/s,
    )
    expect(stylesheet).toMatch(
      /\[data-responsive-layout='hero'\] \.hero-summary \{[^}]*min-height:\s*var\(--hero-summary-reserved-height\);[^}]*padding:\s*1rem 1\.375rem 1\.25rem 1\.5625rem;[^}]*background:\s*transparent;/s,
    )
  })

  test('keeps hero copy on one fixed light tone over the blackish band', () => {
    // The band is now always a dark translucent panel, so the copy no longer
    // samples the media behind it to pick a tone.
    expect(stylesheet).toMatch(/--hero-heading-color:\s*#ffffff;/)
    expect(stylesheet).toMatch(
      /--hero-description-color:\s*(#ffffff|rgba\(255,\s*255,\s*255,\s*[\d.]+\));/,
    )
    expect(stylesheet).not.toMatch(/data-hero-copy-tone/)
    expect(stylesheet).not.toMatch(/transition:\s*color 360ms ease-in-out;/)
    expect(stylesheet).not.toMatch(/mix-blend-mode:\s*difference;/)
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
    // A label strip, not a band of its own: what it gives up goes to the video.
    expect(stylesheet).toMatch(
      /@media \(min-width: 90rem\)[^]*?\[data-responsive-layout='hero'\]\s*\{[^}]*--hero-marquee-height:\s*2\.625rem;/s,
    )
    /*
     * The 90rem boundary has to be found after the laptop block opens -- the
     * stylesheet carries earlier `min-width: 90rem` queries, and searching
     * from the top slices backwards into nothing.
     */
    const laptopStart = stylesheet.indexOf('@media (min-width: 48rem) and (max-width: 89.999rem)')
    const laptop = stylesheet.slice(
      laptopStart,
      stylesheet.indexOf('@media (min-width: 90rem)', laptopStart),
    )
    expect(laptop).toMatch(/--hero-marquee-height:\s*1\.75rem;/)

    /*
     * The strip is sized from that token alone, never a repeated literal.
     * Asserted against the whole sheet: the rule it sets lives in the section
     * styles above the responsive tail this file otherwise slices to.
     */
    expect(baseStylesheet).toMatch(
      /\.hero-services-marquee \{[^}]*height: var\(--hero-marquee-height, 3\.875rem\);/s,
    )
    expect(baseStylesheet).not.toMatch(/^\s*height: 3\.875rem;/m)
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
    const serviceImages = Array.from(container.querySelectorAll('.services-grid-card-image'))

    expect(heroSources).toHaveLength(2)
    expect(container.querySelector('.hero-image img')?.getAttribute('src')).toBe(
      '/images/home/hero-mobile.png',
    )
    expect(serviceImages).toHaveLength(6)
    expect(
      serviceImages.every((image) => {
        const src = image.getAttribute('src') || ''
        return !src.includes('figma.com') && decodeURIComponent(src).includes('/images/home/')
      }),
    ).toBe(true)
  })
})
