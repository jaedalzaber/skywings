// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import { vi } from 'vitest'

/*
 * jsdom has no window.matchMedia, but GSAP's ScrollTrigger calls it while
 * registering. A never-matching stub lets scroll scenes register in tests and
 * stay inert, which is the static composition the specs assert against.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    }),
  })
}

/*
 * Scroll scenes load GSAP lazily after mount. Under jsdom the real library
 * has nothing to measure, and a module still loading when a spec finishes
 * is reported as an unhandled error, so every GSAP entry resolves to one
 * inert stub: any property is callable, returns itself, and never runs a
 * scene callback. Specs assert the scenes from source and static markup.
 */
interface Inert {
  (...args: unknown[]): Inert
  [key: string]: Inert
}
const inertGsap = new Proxy(function inert() {}, {
  apply: () => inertGsap,
  construct: () => inertGsap,
  get: (_target, key) => {
    if (key === 'then') return undefined
    if (key === Symbol.toPrimitive) return () => 0
    return inertGsap
  },
}) as unknown as Inert

vi.mock('gsap', () => ({ default: inertGsap, gsap: inertGsap }))
vi.mock('gsap/ScrollTrigger', () => ({ default: inertGsap, ScrollTrigger: inertGsap }))
vi.mock('gsap/Draggable', () => ({ default: inertGsap, Draggable: inertGsap }))
vi.mock('gsap/InertiaPlugin', () => ({ default: inertGsap, InertiaPlugin: inertGsap }))

/*
 * jsdom has no IntersectionObserver, and the home page's entrance reveals ask
 * for one as they mount. An inert stub -- it observes nothing and never
 * reports -- leaves every revealed element in its resting markup, which is
 * what the specs assert against: content and structure, not the animation.
 */
if (typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'function') {
  class InertIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: readonly number[] = []
    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
    unobserve() {}
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: InertIntersectionObserver,
    writable: true,
  })
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    value: InertIntersectionObserver,
    writable: true,
  })
}
