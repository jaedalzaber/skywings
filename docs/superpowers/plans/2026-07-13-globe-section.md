# Globe Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Figma-derived UAE delivery globe section directly after manufacturing process with two branch cards, constrained R3F globe motion, geographic route labels, and a looping client marquee.

**Architecture:** `HomeGlobeSection` owns semantic DOM content and the marquee. `HomeGlobeScene` owns Canvas, custom point-cloud globe geometry, route curves, anchored labels, constrained pointer motion, and the WebGL fallback; `HomeBlocks` inserts the section in the existing hero-driven home sequence.

**Tech Stack:** Next.js, React 19, TypeScript, React Three Fiber, Drei, Three.js, CSS, Vitest, Testing Library.

## Global Constraints

- Keep UAE continuously visible; globe loop is at most `2deg` and pointer parallax at most `3deg`.
- Do not add a globe package or Payload schema.
- Use Inter for headings and Roboto for body copy.
- Disable scene and marquee motion for reduced-motion users.
- Clamp Canvas DPR and avoid per-frame geometry allocation.

---

### Task 1: Section Structure And Placement

**Files:**
- Create: `tests/int/home-globe.int.spec.tsx`
- Create: `src/components/home/HomeGlobeSection.tsx`
- Modify: `src/components/home/HomeBlocks.tsx`

**Interfaces:**
- Produces: `HomeGlobeSection(): JSX.Element` with `#global-delivery`, two `.globe-branch-card` articles, four location labels, two `.globe-client-track` elements, and one `data-testid="globe-stage"`.

- [ ] **Step 1: Write the failing integration test**

```tsx
expect(process?.nextElementSibling).toBe(globe)
expect(within(globe).getByRole('heading', { level: 2 })).toHaveTextContent('We deliver all over')
expect(globe.querySelectorAll('.globe-branch-card')).toHaveLength(2)
expect(globe.querySelectorAll('[data-globe-label]')).toHaveLength(4)
expect(globe.querySelectorAll('.globe-client-track')).toHaveLength(2)
```

- [ ] **Step 2: Run the test and confirm it fails because the globe section is absent**

Run: `pnpm.cmd exec vitest run tests/int/home-globe.int.spec.tsx --config ./vitest.config.mts --maxWorkers=1`

- [ ] **Step 3: Add the semantic section and insert it after `HomeProcessSection`**

```tsx
<HomeProcessSection block={processBlock} />
<HomeGlobeSection />
```

- [ ] **Step 4: Run the focused test and confirm it passes**

### Task 2: Custom R3F Globe Scene

**Files:**
- Create: `src/components/home/HomeGlobeScene.tsx`
- Modify: `src/components/home/HomeGlobeSection.tsx`
- Test: `tests/int/home-globe.int.spec.tsx`

**Interfaces:**
- Produces: `HomeGlobeScene()` and a `.globe-scene-fallback` when WebGL is unavailable.
- Uses: route records `{ label, lat, lon, tone }` shared by the scene and DOM overlay.

- [ ] **Step 1: Add a failing fallback/stage contract test**

```tsx
expect(screen.getByTestId('globe-stage')).toBeTruthy()
expect(screen.getByTestId('globe-scene-fallback')).toBeTruthy()
```

- [ ] **Step 2: Run the test and confirm the fallback assertion fails**

- [ ] **Step 3: Implement the scene**

```tsx
<Canvas camera={{ fov: 34, position: [0, 0, 5.4] }} dpr={[1, 1.5]}>
  <GlobePoints />
  <RouteArcs />
</Canvas>
```

Generate point positions once with `useMemo`, create route curves once, update only the globe group rotation in `useFrame`, and constrain pointer targets to `3deg`.

- [ ] **Step 4: Run the focused test and confirm it passes**

### Task 3: Figma Styling And Marquee Motion

**Files:**
- Modify: `src/app/(frontend)/styles.css`
- Test: `tests/int/home-globe.int.spec.tsx`

**Interfaces:**
- Produces: full-width charcoal layout, responsive globe stage, staggered branch cards, rounded labels, and duplicated right-to-left marquee tracks.

- [ ] **Step 1: Add failing CSS contract assertions**

```ts
expect(styles).toMatch(/\.global-delivery\s*\{[^}]*background:\s*#2d2d2d;/s)
expect(styles).toMatch(/@keyframes globe-client-slide/)
expect(styles).toMatch(/\.globe-client-rail\s*\{[^}]*animation:\s*globe-client-slide/s)
```

- [ ] **Step 2: Run the test and confirm the CSS contract fails**

- [ ] **Step 3: Implement desktop, mobile, and reduced-motion CSS matching the Figma measurements**

- [ ] **Step 4: Run the focused globe and existing home tests**

Run: `pnpm.cmd exec vitest run tests/int/home-globe.int.spec.tsx tests/int/home-process.int.spec.tsx tests/int/home-industries.int.spec.tsx --config ./vitest.config.mts --maxWorkers=1`

### Task 4: Runtime Verification

**Files:**
- Verify: `src/components/home/HomeGlobeScene.tsx`
- Verify: `src/app/(frontend)/styles.css`

**Interfaces:**
- Produces: verified nonblank, correctly framed desktop/mobile WebGL scene.

- [ ] **Step 1: Run `pnpm.cmd exec next build` and require exit code 0**
- [ ] **Step 2: Verify desktop screenshot, canvas pixel variance, four nonoverlapping labels, and UAE visibility**
- [ ] **Step 3: Verify mobile screenshot and stable stacked layout**
- [ ] **Step 4: Confirm pointer movement remains bounded and marquee track does not resize the section**
