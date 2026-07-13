# Manufacturing Process Scroll Pin Design

## Goal

Present the manufacturing process as a full-viewport blue scene, hold it in place for a short scroll interval, and make the sticky navigation solid white only while that scene is active.

## Interaction

- The manufacturing process occupies at least `100svh` and its blue background spans the full viewport width and height.
- On desktop, GSAP ScrollTrigger pins the process section when its top reaches the viewport top.
- The pin lasts for `5vh` (`0.05` viewport heights) of scroll distance, then releases naturally into the following section.
- Scrolling upward reverses the same behavior without a jump.
- Existing process-cell sequencing, hover activation, title fades, and model motion remain unchanged.
- Reduced-motion users receive the full-height blue section without pinning.

## Navigation State

- While ScrollTrigger considers the process scene active, the document exposes a process-active state.
- The sticky navigation responds with a fully opaque white background and no backdrop blur.
- On leaving the process scene in either direction, the navigation returns to its existing translucent, blurred presentation.
- The state is removed during component teardown so route changes cannot leave the navigation white.

## Implementation Boundaries

- ScrollTrigger setup belongs to the client-side manufacturing-process component.
- Styling remains in the shared frontend stylesheet and is driven by a stable document data attribute.
- The existing Lenis integration continues to notify ScrollTrigger through `ScrollTrigger.update()`.
- No CMS schema or content changes are required.

## Verification

- Integration tests assert the full-height scene contract, pin configuration hooks, and navigation active-state styling.
- Existing process and site-header tests continue to pass.
- A production build verifies the client-only GSAP integration compiles under Next.js.
- Desktop browser verification checks pin duration, full viewport coverage, solid-white navigation during the pin, and restored navigation before and after it.
