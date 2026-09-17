import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

// A stand-in for the App Router context these tests don't provide; the
// pathname value itself does not matter to any test below except the one
// that changes it to exercise a route change.
const pathname = { current: '/' }
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { HeaderSurfaceController } from '@/components/layout/HeaderSurfaceController'
import { defaultHomeLayout } from '@/data/home'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
const settle = async () => {
  await nextFrame()
  await nextFrame()
}
const controller = read('src/components/layout/HeaderSurfaceController.tsx')
const stylesheet = read('src/app/(frontend)/styles.css')

/*
 * The header theme is meant to be reusable: a section adds one attribute and
 * the stylesheet does the rest. These guard that contract, because the easy
 * regression is someone hard-coding a single section's colours into the JS.
 */
describe('header surface theming', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
    pathname.current = '/'
    delete document.documentElement.dataset.navStuck
    delete document.documentElement.dataset.navSurface
  })

  test('mirrors whichever marked section the bar is over onto the document', () => {
    // Any [data-nav-surface], not one hard-coded value.
    expect(controller).toMatch(/const surfaceSelector = '\[data-nav-surface\]'/)
    expect(controller).toMatch(/write\('navSurface', active\)/)
    // Probed at the bar's midline, so the swap happens when it is visually over.
    expect(controller).toMatch(/bounds\.top \+ bounds\.height \/ 2/)
    // No per-section branching in the controller.
    expect(controller).not.toMatch(/manufacturing-process|process-pin/)
  })

  /*
   * Every dark band has to declare itself, or the bar keeps its light treatment
   * over it and the type disappears. The services band is #1c1c1c and was the
   * one section missing the attribute.
   */
  test('marks each dark home band so the bar goes light over it', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    for (const selector of ['.services-grid', '#manufacturing-process']) {
      const section = container.querySelector(selector)
      expect(section, `${selector} should render`).not.toBeNull()
      expect(section?.getAttribute('data-nav-surface'), selector).toBe('dark')
    }
  })

  test('defines the themes in CSS, keyed by the mirrored value', () => {
    expect(stylesheet).toMatch(/html\[data-nav-surface='white'\] \{[^}]*--nav-surface:\s*#fff;/s)
    expect(stylesheet).toMatch(/html\[data-nav-surface='dark'\] \{[^}]*--nav-surface:\s*#1c1c1c;/s)
    expect(stylesheet).toMatch(/html\[data-nav-surface='dark'\] \{[^}]*--nav-ink:\s*#ffffff;/s)
    // Links, the masked brand mark and the CTA all follow the dark theme.
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \.nav-item > a,[^{]*\{[^}]*color:\s*var\(--nav-ink\);/s,
    )
    /*
     * The bar's own links only. The dropdown panels are light on every page,
     * and a descendant `.nav-links a` outranked their colours: on a dark page
     * the Industries items and the Products headings went white on white.
     */
    expect(stylesheet).not.toMatch(/html\[data-nav-surface='dark'\] \.nav-links a\b/)
    /*
     * The bar's bottom rule has to be opaque. Its dark fill stops above the
     * border, so a translucent line let anything light scrolling underneath
     * show through as a bright rule.
     */
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \{[^}]*--nav-line:\s*#[0-9a-f]{6};/s,
    )
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \.brand-logo:not\(:has\(\.safe-image-fallback\)\) \{[^}]*background:\s*var\(--nav-ink\);/s,
    )
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \.nav-cta \{[^}]*background:\s*var\(--nav-ink\);/s,
    )
  })

  /*
   * The mirroring is done by a script, and a script only runs once the page
   * is hydrated -- so the hero theme cannot wait on it, or the bar is drawn
   * white across the top of the footage on every load. Every hero rule reads
   * the page's own markup as well as the mirrored value, so the bar is clear
   * from the first frame.
   *
   * And only until the controller starts, which is the second guard. Markup
   * cannot say where a page has been scrolled to: with the fallback keyed on
   * the surface value alone, scrolling the home page down to a section that
   * asks for no treatment -- the industries cards, say -- dropped the value,
   * matched the fallback again and left white type on a clear bar over white
   * cards.
   */
  test('themes the hero bar from the markup, before any script has run', () => {
    const heroRules = stylesheet.match(/html:is\(\s*\[data-nav-surface='hero'\][^{]*\{/gs) ?? []
    expect(heroRules.length).toBeGreaterThan(0)
    expect(stylesheet).not.toMatch(/html\[data-nav-surface='hero'\]/)

    for (const rule of heroRules) {
      expect(rule).toContain(':not([data-nav-ready]):has(')
      // The hero opens the page, whether it is main's own first child (home)
      // or the first child of the page wrapper (industry pages).
      expect(rule).toContain("main > [data-nav-surface='hero']:first-child")
      expect(rule).toContain("main > :first-child > [data-nav-surface='hero']:first-child")
    }

    // The other half of that guard: the controller closes the door behind it.
    expect(controller).toMatch(/root\.dataset\.navReady = 'true'/)
  })

  /*
   * Smooth scrolling keeps firing scroll events long after the page has come
   * to rest. Re-assigning an identical attribute still produces a mutation
   * record, and the scroll scenes listen for those to re-measure -- so a
   * controller that writes unconditionally had pinned sections refreshing
   * about thirteen times a second while nothing moved, which cancelled any
   * CSS transition running inside one (the process panel's CTA on hover).
   */
  test('writes an attribute only when its value actually changes', async () => {
    document.body.innerHTML =
      '<div class="nav-container"></div><section data-nav-surface="dark"></section>'
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 400, writable: true })

    render(<HeaderSurfaceController />)
    await settle()
    expect(document.documentElement.dataset.navStuck).toBe('true')
    expect(document.documentElement.dataset.navSurface).toBe('dark')

    const records: MutationRecord[] = []
    const observer = new MutationObserver((batch) => records.push(...batch))
    observer.observe(document.documentElement, { attributes: true })
    for (let i = 0; i < 5; i += 1) {
      window.dispatchEvent(new Event('scroll'))
      await settle()
    }
    observer.disconnect()

    expect(records.map((record) => record.attributeName)).toEqual([])
  })

  test('still writes when the value genuinely changes', async () => {
    document.body.innerHTML =
      '<div class="nav-container"></div><section data-nav-surface="dark"></section>'
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 400, writable: true })

    render(<HeaderSurfaceController />)
    await settle()
    expect(document.documentElement.dataset.navStuck).toBe('true')

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true })
    window.dispatchEvent(new Event('scroll'))
    await settle()
    expect(document.documentElement.dataset.navStuck).toBeUndefined()
  })

  /*
   * The root layout, and this controller with it, stays mounted across a
   * client-side navigation -- only the page content swaps. An effect that
   * only ever scanned for `[data-nav-surface]` sections once, at that first
   * mount, kept measuring the previous page's sections after they were
   * removed from the DOM. A detached element's getBoundingClientRect() is all
   * zeros, which never lands under the header, so the bar's theme got stuck
   * cleared on the very first navigation -- and with no theme active, it fell
   * back to its blurred glass treatment over whatever the new page was still
   * rendering in.
   */
  test('re-scans for the current page’s sections on a route change', async () => {
    document.body.innerHTML =
      '<div class="nav-container"></div><section id="a" data-nav-surface="dark"></section>'
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 400, writable: true })

    const { rerender } = render(<HeaderSurfaceController />)
    await settle()
    expect(document.documentElement.dataset.navSurface).toBe('dark')

    // A navigation: the old page's section leaves the DOM, a new one with a
    // different surface takes its place, and the route changes underneath.
    document.querySelector('#a')?.remove()
    document.body.insertAdjacentHTML(
      'beforeend',
      '<section id="b" data-nav-surface="white"></section>',
    )
    pathname.current = '/products'
    rerender(<HeaderSurfaceController />)
    await settle()

    expect(document.documentElement.dataset.navSurface).toBe('white')
  })

  test('leaves no reference to the attribute the controller used to set', () => {
    expect(stylesheet).not.toMatch(/data-section-nav-active/)
    expect(controller).not.toMatch(/sectionNavActive/)
  })
})
