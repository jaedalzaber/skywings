# Responsive Home Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce the supplied 390 px, 1024 px, and 1920 px Figma home-page layouts with shared CMS markup and consistent animation behavior.

**Architecture:** Keep the existing Payload-backed React component tree and give each major home section a stable responsive-layout hook. Add one authoritative home-specific responsive stylesheet after the legacy global stylesheet, and move GSAP's service pin threshold to the agreed 768 px laptop boundary while retaining native mobile scrolling and reduced-motion behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Payload CMS 3, global CSS, GSAP ScrollTrigger, Motion, Vitest, Testing Library, Playwright.

## Global Constraints

- Mobile is below 768 px, laptop/tablet is 768-1439 px, and desktop is 1440 px or wider.
- Figma node `275:2` at 1024 px is the structural source of truth; nodes `282:1365` and `100:486` define the mobile and desktop compositions.
- Keep a single semantic React tree and existing Payload field contracts.
- Keep GSAP, Motion, automatic process cycling, focus/hover activation, and reduced-motion support.
- Do not introduce Tailwind, breakpoint-specific duplicate page trees, or new expiring Figma asset dependencies.
- Prevent horizontal document overflow at all three ranges.

---

### Task 1: Responsive Contract Regression Test

**Files:**
- Create: `tests/int/home-responsive-layout.int.spec.tsx`
- Test: `tests/int/home-responsive-layout.int.spec.tsx`

**Interfaces:**
- Consumes: `HomeBlockRenderer({ blocks: HomeLayout })`, `defaultHomeLayout`, and the home stylesheet text.
- Produces: an executable contract for section hooks, exact breakpoint boundaries, mobile hero separation, laptop service sizing, desktop industry composition, and reduced-motion rules.

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
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

const stylesheet = readFileSync(
  resolve(process.cwd(), 'src/app/(frontend)/home-responsive.css'),
  'utf8',
)

describe('responsive home layout', () => {
  test('uses one laptop-led semantic layout across every home section', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    expect(container.querySelector('#top')?.getAttribute('data-responsive-layout')).toBe('hero')
    expect(container.querySelector('.services-showcase')?.getAttribute('data-responsive-layout')).toBe('services')
    expect(container.querySelector('#industries')?.getAttribute('data-responsive-layout')).toBe('industries')
    expect(container.querySelector('#manufacturing-process')?.getAttribute('data-responsive-layout')).toBe('process')
  })

  test('defines mobile, laptop, and desktop compositions at the agreed boundaries', () => {
    expect(stylesheet).toMatch(/@media \(min-width: 48rem\) and \(max-width: 89\.999rem\)/)
    expect(stylesheet).toMatch(/@media \(min-width: 90rem\)/)
    expect(stylesheet).toMatch(/\.hero-summary\s*\{[^}]*background:\s*#fff;/s)
    expect(stylesheet).toMatch(/\.services-showcase-card\s*\{[^}]*width:\s*16\.1875rem;/s)
    expect(stylesheet).toMatch(/\.industries-showcase-card\s*\{[^}]*grid-template-columns:/s)
  })

  test('keeps mobile native scrolling and reduced-motion fallbacks', () => {
    expect(stylesheet).toMatch(/\.services-showcase-viewport\s*\{[^}]*overflow-x:\s*auto;/s)
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(stylesheet).toMatch(/animation:\s*none;/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:int tests/int/home-responsive-layout.int.spec.tsx`

Expected: FAIL because `home-responsive.css` and the `data-responsive-layout` hooks do not exist.

- [ ] **Step 3: Leave production code unchanged**

The failing test is the deliverable for this task; implementation begins in Task 2.

---

### Task 2: Shared Markup and Animation Hooks

**Files:**
- Modify: `src/components/home/HomeBlocks.tsx:89-136`
- Modify: `src/components/home/HomeServicesScroller.tsx:86-150`
- Modify: `src/components/home/HomeIndustriesAccordion.tsx:27-31`
- Modify: `src/components/home/HomeProcessSection.tsx:211-219`
- Test: `tests/int/home-responsive-layout.int.spec.tsx`

**Interfaces:**
- Consumes: the existing section class names and refs used by CSS, GSAP, Motion, and integration tests.
- Produces: `data-responsive-layout="hero|services|industries|process"` hooks and laptop/tablet service pinning at `48rem`.

- [ ] **Step 1: Add stable section hooks**

```tsx
<section
  aria-label="Sky Wings hero"
  className="hero-section hero-container"
  data-responsive-layout="hero"
  id="top"
>
```

Apply the same attribute pattern to services, industries, and process using the exact values asserted by Task 1.

- [ ] **Step 2: Align the service animation with the laptop breakpoint**

```ts
media.add('(min-width: 48rem)', () => {
  // Keep the existing measured-distance tween, ScrollTrigger options, cleanup,
  // and clearProps behavior unchanged.
})
```

- [ ] **Step 3: Run the semantic contract test**

Run: `pnpm test:int tests/int/home-responsive-layout.int.spec.tsx -t "uses one laptop-led semantic layout"`

Expected: PASS.

---

### Task 3: Three-Range Home Styles

**Files:**
- Create: `src/app/(frontend)/home-responsive.css`
- Modify: `src/app/(frontend)/layout.tsx:10-12`
- Test: `tests/int/home-responsive-layout.int.spec.tsx`

**Interfaces:**
- Consumes: all existing home section classes plus Task 2's stable data attributes.
- Produces: mobile-first 390 px composition, a 1024 px laptop/tablet composition between `48rem` and `89.999rem`, and a 1920 px desktop composition from `90rem` upward.

- [ ] **Step 1: Import the authoritative stylesheet after legacy styles**

```ts
import './styles.css'
import './home-responsive.css'
```

- [ ] **Step 2: Implement the mobile-first rules**

Create `home-responsive.css` with these complete behavior groups:

```css
main:has(.hero-section) {
  overflow: clip;
}

[data-responsive-layout='hero'] {
  min-height: 55rem;
  overflow: hidden;
  background: #fff;
}

[data-responsive-layout='hero'] .hero-video-layer {
  bottom: auto;
  height: 41.6875rem;
}

[data-responsive-layout='hero'] .hero-content-band {
  display: contents;
}

[data-responsive-layout='hero'] .hero-content {
  display: block;
  width: 100%;
  padding: 0;
}

[data-responsive-layout='hero'] .hero-copy {
  position: absolute;
  top: 32.25rem;
  left: 0;
  width: 100%;
  min-height: 9.4375rem;
  padding: 1.875rem 1.375rem 1.5rem 1.5625rem;
  background: rgba(217, 217, 217, 0.75);
  backdrop-filter: blur(0.9375rem);
}

[data-responsive-layout='hero'] .hero-copy .eyebrow {
  display: none;
}

[data-responsive-layout='hero'] h1 {
  max-width: none;
  margin: 0;
  font-family: var(--font-title), Inter, sans-serif;
  font-size: 1.9375rem;
  font-weight: 400;
  line-height: 0.97;
  letter-spacing: -0.01em;
}

[data-responsive-layout='hero'] .hero-summary {
  position: absolute;
  top: 44.5rem;
  left: 1.5625rem;
  width: calc(100% - 2.9375rem);
  max-width: none;
  gap: 1.625rem;
  background: #fff;
}

[data-responsive-layout='hero'] .hero-services-marquee {
  display: none;
}

[data-responsive-layout='services'] .services-showcase-pin {
  padding: 1.5625rem 0 3rem;
}

[data-responsive-layout='services'] .services-showcase-heading {
  gap: 1.75rem;
}

[data-responsive-layout='services'] .services-showcase-title-group {
  gap: 1.625rem;
}

[data-responsive-layout='services'] .services-showcase h2 {
  font-size: 2rem;
}

[data-responsive-layout='services'] .services-showcase-viewport {
  margin-top: 2rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
}

[data-responsive-layout='services'] .services-showcase-card {
  width: min(16.1875rem, calc(100vw - 3.125rem));
  scroll-snap-align: start;
}

[data-responsive-layout='services'] .services-showcase-card-surface {
  min-height: 20.875rem;
}

[data-responsive-layout='industries'] {
  padding-top: 3.4375rem;
}

[data-responsive-layout='industries'] .industries-showcase-card-inner {
  padding-inline: 1.5625rem;
}

[data-responsive-layout='industries'] .industries-showcase-product-grid {
  grid-template-columns: repeat(3, minmax(10rem, 1fr));
  overflow-x: auto;
}

[data-responsive-layout='process'] {
  min-height: 41.25rem;
  padding: 2.5rem 1.5625rem;
}

@media (prefers-reduced-motion: reduce) {
  .hero-services-rail {
    animation: none;
  }

  .services-showcase-track {
    transform: none !important;
  }
}
```

- [ ] **Step 3: Add laptop/tablet rules**

```css
@media (min-width: 48rem) and (max-width: 89.999rem) {
  [data-responsive-layout='hero'] {
    min-height: 37.5rem;
    align-items: flex-end;
  }

  [data-responsive-layout='hero'] .hero-video-layer {
    inset: 0;
    height: auto;
  }

  [data-responsive-layout='hero'] .hero-content-band {
    display: block;
    min-height: 9.3125rem;
    background: rgba(217, 217, 217, 0.75);
    backdrop-filter: blur(1.253rem);
  }

  [data-responsive-layout='hero'] .hero-content {
    display: grid;
    grid-template-columns: minmax(0, 29.9375rem) minmax(0, 24.5625rem);
    justify-content: space-between;
    padding: 1.875rem 2.5rem 1.5rem;
  }

  [data-responsive-layout='hero'] .hero-copy,
  [data-responsive-layout='hero'] .hero-summary {
    position: static;
    width: auto;
    min-height: 0;
    padding: 0;
    background: transparent;
    backdrop-filter: none;
  }

  [data-responsive-layout='hero'] h1 {
    font-size: 2.125rem;
  }

  [data-responsive-layout='hero'] .hero-services-marquee {
    display: block;
    height: 2.5rem;
  }

  [data-responsive-layout='services'] .services-showcase-pin {
    padding: 1.5625rem 0;
  }

  [data-responsive-layout='services'] .services-showcase-card {
    width: 16.1875rem;
  }

  [data-responsive-layout='services'] .services-showcase-card-surface {
    min-height: 20.875rem;
  }

  [data-responsive-layout='industries'] .industries-showcase-card {
    grid-template-columns: minmax(0, 43.75rem) minmax(16rem, 1fr);
  }

  [data-responsive-layout='process'] {
    --process-columns: minmax(0, 18.75rem) minmax(0, 23.3125rem) minmax(0, 18.75rem);
    min-height: 37.4375rem;
    padding: 2.5rem 1.5625rem;
  }

  [data-responsive-layout='process'] .process-header {
    min-height: 7.6875rem;
  }
}
```

- [ ] **Step 4: Add desktop rules**

```css
@media (min-width: 90rem) {
  [data-responsive-layout='hero'] {
    min-height: clamp(47.625rem, 52.9167vw, 63.5rem);
    align-items: flex-end;
  }

  [data-responsive-layout='hero'] .hero-video-layer {
    inset: 0;
    height: auto;
  }

  [data-responsive-layout='hero'] .hero-content-band {
    display: block;
    min-height: 19.875rem;
    background: rgba(217, 217, 217, 0.75);
    backdrop-filter: blur(2.365625rem);
  }

  [data-responsive-layout='hero'] .hero-content {
    display: grid;
    grid-template-columns: 28.25rem 35.25rem;
    width: 80rem;
    justify-content: space-between;
    padding: 3.5625rem 2.5rem;
  }

  [data-responsive-layout='hero'] .hero-copy,
  [data-responsive-layout='hero'] .hero-summary {
    position: static;
    width: auto;
    min-height: 0;
    padding: 0;
    background: transparent;
    backdrop-filter: none;
  }

  [data-responsive-layout='hero'] h1 {
    font-size: 2.5rem;
  }

  [data-responsive-layout='hero'] .hero-services-marquee {
    display: block;
    height: 3.875rem;
  }

  [data-responsive-layout='services'] .services-showcase-pin {
    padding: 9.5rem 0 10rem;
  }

  [data-responsive-layout='services'] .services-showcase-card {
    width: 23.4375rem;
  }

  [data-responsive-layout='services'] .services-showcase-card-surface {
    min-height: 26.6875rem;
  }

  [data-responsive-layout='industries'] .industries-showcase-card {
    grid-template-columns: minmax(0, var(--industries-content)) var(--industries-image);
  }

  [data-responsive-layout='process'] {
    --process-columns: minmax(17rem, 1fr) minmax(30rem, 1.25fr) minmax(17rem, 1fr);
  }
}
```

- [ ] **Step 5: Run the responsive contract test**

Run: `pnpm test:int tests/int/home-responsive-layout.int.spec.tsx`

Expected: PASS with 3 passing tests.

---

### Task 4: Regression and Visual Verification

**Files:**
- Modify if required by observed regressions: `src/app/(frontend)/home-responsive.css`
- Test: `tests/int/home-hero.int.spec.tsx`
- Test: `tests/int/home-services.int.spec.tsx`
- Test: `tests/int/home-industries.int.spec.tsx`
- Test: `tests/int/home-process.int.spec.tsx`

**Interfaces:**
- Consumes: the completed responsive component and stylesheet contract.
- Produces: evidence that functionality, type safety, lint, build output, and the three target viewport compositions remain correct.

- [ ] **Step 1: Run focused home tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/home-responsive-layout.int.spec.tsx tests/int/home-hero.int.spec.tsx tests/int/home-services.int.spec.tsx tests/int/home-industries.int.spec.tsx tests/int/home-process.int.spec.tsx`

Expected: all focused tests pass with zero failures.

- [ ] **Step 2: Run static verification**

Run: `pnpm lint`

Expected: exit 0 with no ESLint errors.

Run: `pnpm build`

Expected: exit 0 with a successful Next.js production build.

- [ ] **Step 3: Compare target viewports**

Run the local site and capture `/` at 390 × 844, 1024 × 768, and 1920 × 1080. Confirm the hero, services, industries, process, globe, navigation, and footer track the corresponding Figma composition; confirm `document.documentElement.scrollWidth === window.innerWidth` at each width.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check && git status --short && git diff --stat`

Expected: no whitespace errors and only the planned home responsive files plus this plan are changed.
