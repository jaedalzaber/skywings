# Home Process Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Figma-inspired manufacturing process section directly after industries with a six-step timed accordion and persistent rotating wireframe product placeholder.

**Architecture:** Keep Payload's existing `homeProcess` block as the content source. Render it once beside the hero-injected industries block through a focused client component; isolate the React Three Fiber canvas so accordion state changes never remount WebGL.

**Tech Stack:** Next.js 16, React 19, Payload CMS, Motion, React Three Fiber, Three.js, Vitest, Testing Library.

## Global Constraints

- Render directly after the industries section and suppress the later duplicate block.
- Use exactly six process cells, split three left and three right.
- Advance every 4 seconds, activate immediately on hover, and resume from the hovered step on leave.
- Keep the center canvas mounted and honor reduced-motion preferences.
- Use Inter for titles and Roboto for body copy through existing global font variables.

---

### Task 1: Process placement and structure

**Files:**
- Modify: `tests/int/home-process.int.spec.tsx`
- Modify: `src/components/home/HomeBlocks.tsx`
- Create: `src/components/home/HomeProcessSection.tsx`

**Interfaces:**
- Consumes: `HomeProcessLayoutBlock` from `src/data/home.ts`.
- Produces: `HomeProcessSection({ block }: { block: HomeProcessLayoutBlock })`.

- [x] Write a rendering test asserting industries is followed by process, exactly six cells render, and the center viewer exists.
- [x] Run `pnpm vitest run tests/int/home-process.int.spec.tsx --config ./vitest.config.mts` and confirm failure because the new section does not exist.
- [x] Add renderer injection/deduplication and the minimal semantic process component.
- [x] Re-run the focused test and confirm it passes.

### Task 2: Timed and hover interaction

**Files:**
- Modify: `tests/int/home-process.int.spec.tsx`
- Modify: `src/components/home/HomeProcessSection.tsx`

**Interfaces:**
- Active cells expose `data-active="true"` and `aria-expanded="true"`.
- Hover changes active index immediately; leave restarts the 4000 ms sequence from that index.

- [x] Add fake-timer tests for the 4-second progression, six-to-one loop, hover activation, and leave resumption.
- [x] Run the focused test and confirm the interaction assertions fail.
- [x] Implement one interval-driven active index, pointer handlers, and Motion presence/layout transitions.
- [x] Re-run the focused test and confirm all interaction assertions pass.

### Task 3: Persistent wireframe viewer and Figma styling

**Files:**
- Create: `src/components/home/HomeProcessModel.tsx`
- Modify: `src/components/home/HomeProcessSection.tsx`
- Modify: `src/app/(frontend)/styles.css`

**Interfaces:**
- Produces: dynamically loaded `HomeProcessModel`, rendered inside `.process-model-stage`.
- Canvas contains a blue rotating box with white edge lines and a grid-like technical presentation.

- [x] Add structural assertions for the model stage, labels, descriptions, and image placeholders.
- [x] Run the focused test and confirm missing viewer/styling hooks fail.
- [x] Build the stable React Three Fiber canvas and responsive three-column layout matching the supplied Figma composition.
- [x] Add reduced-motion and mobile stacked behavior.
- [x] Re-run the focused integration test.

### Task 4: Verification

**Files:**
- Verify all changed files.

- [x] Run `pnpm vitest run tests/int/home-process.int.spec.tsx tests/int/home-industries.int.spec.tsx --config ./vitest.config.mts`.
- [x] Run `pnpm build`.
- [x] Inspect desktop and mobile in-browser, verify a nonblank canvas, observe the six-step loop, test hover/resume, and ensure no overlap with industries.
