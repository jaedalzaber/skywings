# Globe Section Design

## Goal

Add a full-width "where we deliver" section immediately after the manufacturing process. It presents Sky Wings' two UAE branches, a UAE-centered interactive 3D delivery globe, and a continuously looping client marquee while preserving the visual proportions of Figma node `210:1099`.

## Layout

- The section uses a charcoal `#2d2d2d` background and occupies approximately one viewport height on desktop.
- A constrained inner layout follows the Figma split: heading and branch cards on the left, globe on the right, and the client marquee spanning the bottom edge.
- The heading uses Inter and mixed weights: light for "We deliver all over" and the ampersand, bold for "Middle-East, Europe" and "Africa".
- The Sharjah card sits slightly above and left of the Thoban card, matching the staggered Figma composition.
- The globe is large, partially cropped by the right and bottom edges, and remains an unframed part of the section rather than a card.
- Mobile layouts stack the text and branch cards above a stable-aspect-ratio globe stage, followed by the marquee.

## Globe Scene

- Implement the globe with the project's existing React Three Fiber, Drei, and Three.js dependencies; do not add a globe package.
- Generate a dark sphere with a dotted/point-cloud surface and subtle blue geographic accents.
- Keep the UAE-facing camera orientation as the permanent center. The globe never freely spins or exposes the rear hemisphere as the primary view.
- Apply a slow looping yaw of no more than `2deg` in either direction.
- Pointer movement adds no more than `3deg` of yaw/pitch parallax and eases back to the UAE-centered rest pose on pointer leave.
- Disable loop and pointer motion when reduced motion is requested.
- Render a non-WebGL fallback that preserves the dark globe silhouette, route arcs, labels, and section layout.

## Routes And Labels

- Use UAE as the shared origin and display destination groups for Saudi Arabia, Europe, and Africa.
- Build elevated route arcs from geographic vectors using Three.js curves and tube/line geometry.
- Route endpoints use white markers and dashed or segmented white strokes inspired by the Figma.
- Labels are accessible DOM overlays with rounded white or pale-blue backgrounds, blue uppercase text, and soft shadows.
- Labels remain anchored to projected geographic points while the constrained globe moves.
- UAE receives the largest primary label; destination labels use smaller pills.

## Branch Content

- Sharjah Branch: `A2, Plot No. 10576015-3, Sajja Industrial Area, Sharjah, UAE`, phone `+971 509 469 979`.
- Thoban Branch: `Plot No. D-81, Thoban Industrial Area, Fujairah, UAE`, phone `+971 505 389 979`.
- Phone numbers are functional `tel:` links.

## Client Marquee

- Display the Figma client sequence: Uber, Rappi, GE, Glovo, Telenor, FairMoney, and Vinted.
- Duplicate the track so it loops continuously from right to left without a visible gap, using the existing hero marquee pattern.
- Render wordmarks in white with restrained typographic approximations when no local logo asset exists.
- Disable marquee animation for reduced-motion users.

## Architecture

- `HomeGlobeSection.tsx` owns semantic section content, branch cards, route label data, and marquee markup.
- `HomeGlobeScene.tsx` owns Canvas setup, globe geometry, route geometry, pointer response, animation, and fallback detection.
- `HomeBlocks.tsx` inserts the globe section immediately after `HomeProcessSection` in the hero-driven home sequence.
- Styling lives in `src/app/(frontend)/styles.css` and uses existing Inter/Roboto font variables.
- No Payload schema change is required for this first implementation; content remains local alongside the other Figma-specific home sections.

## Accessibility And Performance

- Canvas is decorative and receives an accessible summary through the surrounding section rather than exposing mesh internals.
- Branch addresses and phone links remain normal DOM content.
- Clamp device pixel ratio and avoid per-frame geometry allocation.
- Reuse geometry/material instances and update only the globe group rotation each frame.
- Respect reduced motion and provide a nonblank fallback when WebGL is unavailable.

## Verification

- Integration tests verify placement directly after manufacturing process, both branch cards and phone links, four location labels, two marquee tracks, and the globe stage/fallback contract.
- Existing home-section tests continue to pass.
- A production build verifies client-only Three.js code compiles in Next.js.
- Browser verification checks desktop and mobile screenshots, nonblank canvas pixels, no label overlap, the UAE-centered rest view, bounded pointer movement, and a seamless marquee loop.
