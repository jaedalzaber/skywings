# Manufacturing Process Scroll Pin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the manufacturing process a full-viewport pinned blue scene and switch the sticky navbar to opaque white only while that scene is active.

**Architecture:** `HomeProcessSection` owns a client-side GSAP ScrollTrigger tied to its section element. The trigger pins the scene for `5vh` (`0.05` viewport heights) and toggles a document-level data attribute; CSS uses that attribute to switch the existing navbar surface without coupling the header component to the home page.

**Tech Stack:** Next.js, React, TypeScript, GSAP ScrollTrigger, Lenis, Vitest, Testing Library, CSS.

## Global Constraints

- Keep the existing six-step process timing, hover behavior, model stage, and grid geometry unchanged.
- Disable pinning for `prefers-reduced-motion: reduce`.
- Remove the document state and ScrollTrigger instance during teardown.
- Do not change Payload schemas or content.

---

### Task 1: Define the scroll-scene contract

**Files:**
- Modify: `tests/int/home-process.int.spec.tsx`
- Modify: `tests/int/site-header.int.spec.tsx`

**Interfaces:**
- Consumes: `HomeProcessSection` markup and `styles.css`.
- Produces: regression assertions for `data-scroll-scene="pinned"`, `100svh`, `5vh`, and `[data-process-nav-active='true'] .topbar`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(processSection?.getAttribute('data-scroll-scene')).toBe('pinned')
expect(styles).toMatch(/min-height:\s*100svh/)
expect(styles).toMatch(/--process-pin-distance:\s*5vh/)
expect(styles).toMatch(/html\[data-process-nav-active='true'\]\s+\.topbar/)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm.cmd exec vitest run tests/int/home-process.int.spec.tsx tests/int/site-header.int.spec.tsx --config ./vitest.config.mts --maxWorkers=1`

Expected: FAIL because the scroll-scene marker, viewport height, pin distance, and navbar state selector do not exist.

### Task 2: Implement the pinned scene and navbar state

**Files:**
- Modify: `src/components/home/HomeProcessSection.tsx`
- Modify: `src/app/(frontend)/styles.css`

**Interfaces:**
- Consumes: GSAP `ScrollTrigger` and the existing Lenis-to-ScrollTrigger update integration.
- Produces: one trigger that pins `#manufacturing-process`, exposes `html[data-process-nav-active='true']`, and cleans up on unmount.

- [ ] **Step 1: Add a section ref and ScrollTrigger lifecycle**

```ts
const sectionRef = useRef<HTMLElement>(null)

useEffect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  // Dynamically import GSAP and ScrollTrigger, create a pin with
  // start: 'top top', end: window.innerHeight * 0.05, pin: true, anticipatePin: 1.
  // Toggle documentElement.dataset.processNavActive on enter/leave callbacks.
  // Kill the trigger and remove the dataset key during teardown.
}, [])
```

- [ ] **Step 2: Add full-height and navbar state CSS**

```css
.manufacturing-process {
  --process-pin-distance: 5vh;
  min-height: 100svh;
}

html[data-process-nav-active='true'] .topbar {
  background: #fff;
  backdrop-filter: none;
}
```

- [ ] **Step 3: Run focused tests to verify they pass**

Run: `pnpm.cmd exec vitest run tests/int/home-process.int.spec.tsx tests/int/site-header.int.spec.tsx --config ./vitest.config.mts --maxWorkers=1`

Expected: PASS.

### Task 3: Verify runtime scroll behavior

**Files:**
- Verify: `src/components/home/HomeProcessSection.tsx`
- Verify: `src/app/(frontend)/styles.css`

**Interfaces:**
- Consumes: local Next.js development page.
- Produces: evidence that pinning and navbar restoration work in both scroll directions.

- [ ] **Step 1: Run the production build**

Run: `pnpm.cmd exec next build`

Expected: build and TypeScript complete with exit code 0.

- [ ] **Step 2: Verify in a desktop browser**

Check that the process scene fills the viewport, stays pinned for approximately `0.05` viewport scroll lengths, makes `.topbar` opaque white with no blur while active, and restores the default navbar after leaving in either direction.
