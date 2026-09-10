import { render } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { PageScrollbar } from '@/components/layout/PageScrollbar'

const root = document.documentElement

/* jsdom lays nothing out: give the page and the bar the sizes a browser would. */
function layOut(pageHeight: number) {
  Object.defineProperty(root, 'scrollHeight', { configurable: true, value: pageHeight })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 800 })
}

function section(surface: string, top: number, bottom: number) {
  const element = document.createElement('section')
  element.dataset.navSurface = surface
  element.getBoundingClientRect = () => ({ bottom, top }) as DOMRect
  document.body.append(element)
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
  delete (root as { scrollHeight?: number }).scrollHeight
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
})

describe('PageScrollbar', () => {
  test('floats a decorative thumb sized to the share of the page in view', () => {
    layOut(3200)
    const { container } = render(<PageScrollbar />)
    const bar = container.querySelector('.page-scrollbar') as HTMLElement
    const thumb = bar.querySelector('.page-scrollbar-thumb') as HTMLElement

    expect(bar.getAttribute('aria-hidden')).toBe('true')
    expect(bar.dataset.ready).toBe('true')
    // 800 of 3200 in view: a quarter of the 800px track.
    expect(thumb.style.height).toBe('200px')
  })

  test('shows nothing on a page with nothing to scroll', () => {
    layOut(800)
    const { container } = render(<PageScrollbar />)

    expect((container.querySelector('.page-scrollbar') as HTMLElement).dataset.ready).toBeUndefined()
  })

  test('turns light over a dark section', () => {
    layOut(3200)
    // The thumb sits at the top, 0-200px: over the dark section.
    section('dark', 0, 600)
    section('white', 600, 3200)
    const { container } = render(<PageScrollbar />)

    expect((container.querySelector('.page-scrollbar') as HTMLElement).dataset.surface).toBe('dark')
  })
})
