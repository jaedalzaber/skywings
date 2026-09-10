import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

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
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \{[^}]*--nav-ink:\s*#ffffff;/s,
    )
    // Links, the masked brand mark and the CTA all follow the dark theme.
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \.nav-links a,[^{]*\{[^}]*color:\s*var\(--nav-ink\);/s,
    )
    expect(stylesheet).toMatch(
      /html\[data-nav-surface='dark'\] \.brand-logo:not\(:has\(\.safe-image-fallback\)\) \{[^}]*background:\s*var\(--nav-ink\);/s,
    )
    expect(stylesheet).toMatch(/html\[data-nav-surface='dark'\] \.nav-cta \{[^}]*background:\s*var\(--nav-ink\);/s)
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

  test('leaves no reference to the attribute the controller used to set', () => {
    expect(stylesheet).not.toMatch(/data-section-nav-active/)
    expect(controller).not.toMatch(/sectionNavActive/)
  })
})
