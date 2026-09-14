import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { BrandLogoSpin } from '@/components/layout/BrandLogoSpin'
import { defaultBrandLogoMotion } from '@/data/site'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
const header = readFileSync(resolve(process.cwd(), 'src/components/layout/SiteHeader.tsx'), 'utf8')

/** The bar's two marks: the full lockup and, once scrolled, the symbol. */
function mountBar() {
  document.body.innerHTML =
    '<header class="nav-container"><a class="brand"><span class="brand-logo"></span></a></header>'
  const mark = document.querySelector<HTMLElement>('.brand-logo') as HTMLElement
  const animate = vi.fn()
  Object.defineProperty(mark, 'animate', { configurable: true, value: animate, writable: true })

  return { animate, mark }
}

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
    writable: true,
  })
}

describe('BrandLogoSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    document.body.innerHTML = ''
  })

  test('turns the mark once the bar has settled, then again after the rest', () => {
    const { animate } = mountBar()
    render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)

    // Nothing while the entrance reveal is still setting the bar down.
    vi.advanceTimersByTime(1100)
    expect(animate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(animate).toHaveBeenCalledTimes(1)
    const [frames, options] = animate.mock.calls[0]
    // Anticlockwise, seen from above, in even steps through the whole turn.
    expect(frames).toHaveLength(25)
    expect(frames[0].transform).toBe('rotateY(0deg) scale(1.0000)')
    expect(frames[6].transform).toMatch(/^rotateY\(-90deg\) scale\(/)
    expect(frames[24].transform).toBe('rotateY(-360deg) scale(1.0000)')
    // Eased both ends, so it reads as a turn rather than a flick.
    expect(options).toMatchObject({ duration: 1600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' })

    // The rest is counted from the end of the turn, not its start.
    vi.advanceTimersByTime(10000)
    expect(animate).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(600)
    expect(animate).toHaveBeenCalledTimes(2)
  })

  test('stays still when the setting is off or the visitor asks for less motion', () => {
    const off = mountBar()
    const { unmount } = render(
      <BrandLogoSpin motion={{ ...defaultBrandLogoMotion, enabled: false }} />,
    )
    vi.advanceTimersByTime(20000)
    expect(off.animate).not.toHaveBeenCalled()
    unmount()

    setReducedMotion(true)
    const reduced = mountBar()
    render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)
    vi.advanceTimersByTime(20000)
    expect(reduced.animate).not.toHaveBeenCalled()
  })

  test('drops its timer when the bar unmounts', () => {
    const { animate } = mountBar()
    const { unmount } = render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)

    unmount()
    vi.advanceTimersByTime(30000)
    expect(animate).not.toHaveBeenCalled()
  })

  /*
   * 0 turns at one speed, 1 creeps in and settles: both handles of the curve
   * move in together, so it stays symmetrical whatever is asked for.
   */
  test('pulls the easing curve in by the amount set', () => {
    const steady = mountBar()
    const { unmount } = render(
      <BrandLogoSpin motion={{ ...defaultBrandLogoMotion, easeAmount: 0 }} />,
    )
    vi.advanceTimersByTime(1300)
    expect(steady.animate.mock.calls[0][1]).toMatchObject({
      easing: 'cubic-bezier(0.00, 0, 1.00, 1)',
    })
    unmount()

    const hard = mountBar()
    render(<BrandLogoSpin motion={{ ...defaultBrandLogoMotion, easeAmount: 1 }} />)
    vi.advanceTimersByTime(1300)
    expect(hard.animate.mock.calls[0][1]).toMatchObject({
      easing: 'cubic-bezier(1.00, 0, 0.00, 1)',
    })
  })

  /*
   * A flat silhouette turning on its own reads as a sideways squash, so the
   * turn carries its own lighting: the surface dims as it comes side on and
   * again on its back, and a light travels across it as it goes. The light is
   * a background, which the mask the mark is cut by carries with it.
   */
  test('lights the mark as it turns instead of leaving it flat', () => {
    const { animate } = mountBar()
    render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)
    vi.advanceTimersByTime(1300)

    const frames = animate.mock.calls[0][0] as Record<string, string>[]
    const shade = (frame: Record<string, string>) => Number.parseFloat(frame.opacity)
    const sweep = (frame: Record<string, string>) => Number.parseFloat(frame.backgroundPosition)
    /** The strongest stop in the light, as it stands at this point in the turn. */
    const lit = (frame: Record<string, string>) =>
      Math.max(...[...frame.backgroundImage.matchAll(/,\s*([\d.]+)\)/g)].map((m) => Number(m[1])))

    // Square on, fully lit; side on, down to the shade the light misses.
    expect(shade(frames[0])).toBe(1)
    expect(shade(frames[6])).toBeCloseTo(0.55, 2)
    // Its back catches less than its face does.
    expect(shade(frames[12])).toBeLessThan(shade(frames[0]))

    // The light runs its whole length across the mark over the turn, evenly.
    expect(sweep(frames[0])).toBe(100)
    expect(sweep(frames[12])).toBe(50)
    expect(sweep(frames[24])).toBe(0)

    /*
     * And it is not there at all at either end of the turn, which is what the
     * mark looks like at rest -- so it arrives and leaves rather than being
     * switched on with the turn and off again at the end of it.
     */
    expect(lit(frames[0])).toBe(0)
    expect(lit(frames[24])).toBe(0)
    expect(lit(frames[12])).toBeGreaterThan(0.5)
    expect(frames[12].backgroundImage).toContain('linear-gradient')
  })

  /*
   * Which way round the streak is painted follows the mark it crosses. On the
   * hero the lockup is white, and a white streak on it is no streak at all --
   * there is nothing brighter than the mark already is -- so what travels
   * across it is grey. On a bar where the mark is dark the light is what
   * shows, and that is what it gets.
   */
  test('crosses a pale mark in grey and a dark one in light', () => {
    const toneOf = (frames: Record<string, string>[]) =>
      Number(/rgba\((\d+),/.exec(frames[12].backgroundImage)![1])

    const pale = mountBar()
    pale.mark.style.backgroundColor = 'rgb(255, 255, 255)'
    const { unmount } = render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)
    vi.advanceTimersByTime(1300)
    expect(toneOf(pale.animate.mock.calls[0][0])).toBe(0)
    unmount()

    const dark = mountBar()
    dark.mark.style.backgroundColor = 'rgb(28, 28, 28)'
    render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)
    vi.advanceTimersByTime(1300)
    expect(toneOf(dark.animate.mock.calls[0][0])).toBe(255)
  })

  /*
   * Seen in perspective, the edge swinging towards the viewer is drawn larger,
   * which would push the mark's top and bottom past where it sits at rest. The
   * turn takes that back out step by step, so nothing around it moves: the
   * widest correction falls where the mark is side-on, a quarter of the way
   * round.
   */
  test('takes the perspective swell back out so the mark holds its place', () => {
    const { animate, mark } = mountBar()
    Object.defineProperty(mark, 'offsetWidth', { configurable: true, value: 160 })
    const computed = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) =>
      element === mark.parentElement
        ? ({ perspective: '544px' } as CSSStyleDeclaration)
        : computed(element),
    )

    render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)
    vi.advanceTimersByTime(1300)

    const frames = animate.mock.calls[0][0] as { transform: string }[]
    const scaleOf = (frame: { transform: string }) =>
      Number.parseFloat(/scale\(([\d.]+)\)/.exec(frame.transform)![1])

    /*
     * Flat on, there is nothing to take out. Side-on, the near edge stands
     * 80px proud of a 544px depth: drawn back to 544 / (544 + 80) it ends up
     * at exactly the size it rests at, since the scale pulls that edge in too
     * before perspective magnifies what is left of it.
     */
    expect(scaleOf(frames[0])).toBe(1)
    expect(scaleOf(frames[6])).toBeCloseTo(544 / (544 + 80), 3)
    // Which is what it is for: scaled down, then magnified, it comes out at 1.
    const edgeOn = scaleOf(frames[6])
    expect((544 / (544 - 80 * edgeOn)) * edgeOn).toBeCloseTo(1, 3)
    expect(Math.min(...frames.map(scaleOf))).toBe(scaleOf(frames[6]))
  })

  /*
   * The turn is a rotation in depth, so the perspective belongs to the parent
   * -- on the mark itself it would flatten to a horizontal squash. The mark
   * paints its own background through a mask, which no overflow clips.
   */
  test('gives the mark a 3D room to turn in, as deep as the setting says', () => {
    expect(stylesheet).toMatch(/\.brand \{[^}]*perspective:\s*var\(--brand-perspective, 34rem\);/s)
    expect(header).toMatch(/--brand-perspective.*perspectiveRem/)
    expect(header).toMatch(/--brand-perspective.*perspectiveRem/)
    expect(stylesheet).toMatch(/\.brand-logo \{[^}]*transform-style:\s*preserve-3d;/s)
    expect(stylesheet).toMatch(/\.brand-logo \{[^}]*backface-visibility:\s*visible;/s)
  })
  /*
   * With no mask there is no shape to hold the light: the gradient would show
   * around the artwork rather than on it, so such a mark is only dimmed.
   */
  test('leaves the light off a mark that is shown as a plain picture', () => {
    const { animate, mark } = mountBar()
    mark.innerHTML = '<span class="safe-image-fallback"></span>'
    render(<BrandLogoSpin motion={defaultBrandLogoMotion} />)
    vi.advanceTimersByTime(1300)

    const frames = animate.mock.calls[0][0] as Record<string, string>[]
    expect(frames[0].backgroundImage).toBeUndefined()
    expect(frames[0].opacity).toBe('1.000')
  })
})
