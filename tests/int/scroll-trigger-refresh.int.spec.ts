import { readFileSync } from 'node:fs'
import { describe, expect, test, vi } from 'vitest'

import { onFirstMediaMatch, watchHeaderCondense } from '@/components/home/scrollTriggerRefresh'

type Listener = (event: { matches: boolean }) => void

/** A controllable matchMedia: `flip` fires the change listeners. */
function stubMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>()
  const list = {
    addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
    matches,
    removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
  }
  const original = window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => list,
    writable: true,
  })
  return {
    flip: (next: boolean) => listeners.forEach((listener) => listener({ matches: next })),
    listeners,
    restore: () =>
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: original,
        writable: true,
      }),
  }
}

/*
 * The scenes only play wide and without reduced motion, so GSAP is fetched
 * only once that is true -- a phone never downloads it. Both scroll scenes
 * on the home page start through this gate.
 */
describe('onFirstMediaMatch', () => {
  test('starts at once when the query already matches', () => {
    const media = stubMatchMedia(true)
    const start = vi.fn()
    onFirstMediaMatch('(min-width: 64rem)', start)
    expect(start).toHaveBeenCalledTimes(1)
    expect(media.listeners.size).toBe(0)
    media.restore()
  })

  test('waits for the first match, then starts once and stops listening', () => {
    const media = stubMatchMedia(false)
    const start = vi.fn()
    onFirstMediaMatch('(min-width: 64rem)', start)
    expect(start).not.toHaveBeenCalled()

    media.flip(false)
    expect(start).not.toHaveBeenCalled()
    media.flip(true)
    media.flip(true)
    expect(start).toHaveBeenCalledTimes(1)
    expect(media.listeners.size).toBe(0)
    media.restore()
  })

  test('can be cancelled before the viewport ever matches', () => {
    const media = stubMatchMedia(false)
    const start = vi.fn()
    const cancel = onFirstMediaMatch('(min-width: 64rem)', start)
    cancel()
    media.flip(true)
    expect(start).not.toHaveBeenCalled()
    expect(media.listeners.size).toBe(0)
    media.restore()
  })

  test('the home scroll scene fetches GSAP through the gate', () => {
    for (const [file, media] of [
      ['src/components/home/HomeProcessSection.tsx', 'PROCESS_ACCORDION_MEDIA'],
    ]) {
      const source = readFileSync(file, 'utf8')
      expect(source).toContain(`onFirstMediaMatch(${media}, () => void setup())`)
      expect(source).not.toMatch(/^\s*void setup\(\)/m)
      expect(source).toMatch(/cancelStart\(\)\s*\n\s*active = false/)
    }
  })
})

/*
 * The header condensing is a page-level layout change (~144px above any pinned
 * section). Every scroll-driven section relies on this one helper to
 * re-measure, so its contract is pinned here rather than in each section.
 */
describe('watchHeaderCondense', () => {
  test('refreshes once, debounced, when data-nav-stuck flips, and stops on release', async () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const stop = watchHeaderCondense({ refresh })

    document.documentElement.dataset.navStuck = 'true'
    delete document.documentElement.dataset.navStuck
    document.documentElement.dataset.navStuck = 'true'
    // Attribute mutations are delivered as microtasks.
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(70)
    expect(refresh).toHaveBeenCalledTimes(1)

    stop()
    delete document.documentElement.dataset.navStuck
    await vi.advanceTimersByTimeAsync(100)
    expect(refresh).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  /*
   * A refresh tears a pinned section's pin down and re-applies it, cancelling
   * any CSS transition running inside it. A write that set the attribute to
   * the value it already had must therefore not count as a change.
   */
  test('ignores a write that leaves the value as it was', async () => {
    vi.useFakeTimers()
    document.documentElement.dataset.navStuck = 'true'
    const refresh = vi.fn()
    const stop = watchHeaderCondense({ refresh })

    for (let i = 0; i < 5; i += 1) document.documentElement.dataset.navStuck = 'true'
    await vi.advanceTimersByTimeAsync(200)
    expect(refresh).not.toHaveBeenCalled()

    delete document.documentElement.dataset.navStuck
    await vi.advanceTimersByTimeAsync(200)
    expect(refresh).toHaveBeenCalledTimes(1)

    stop()
    vi.useRealTimers()
  })

  test('ignores unrelated attributes', async () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const stop = watchHeaderCondense({ refresh })

    document.documentElement.dataset.navSurface = 'dark'
    await vi.advanceTimersByTimeAsync(100)
    expect(refresh).not.toHaveBeenCalled()

    stop()
    delete document.documentElement.dataset.navSurface
    vi.useRealTimers()
  })
})
