# Responsive Home Layout Design

## Goal

Update the CMS-driven home page to reproduce the supplied Sky Wings Figma frames at three responsive ranges while keeping one accessible content structure and consistent animation behavior.

## Reference Frames

- Desktop: Figma node `100:486`, designed at 1920 px.
- Laptop/tablet: Figma node `275:2`, designed at 1024 px and treated as the structural source of truth.
- Mobile: Figma node `282:1365`, designed at 390 px.

## Responsive Ranges

- Mobile: viewport widths below 768 px.
- Laptop/tablet: viewport widths from 768 px through 1439 px.
- Desktop: viewport widths at or above 1440 px.

The page will use fluid values inside each range so intermediate widths remain composed rather than matching only the three reference widths.

## Architecture

The home page will retain one semantic React tree backed by the existing Payload home layout. CSS media queries will alter grid structure, sizing, alignment, and section spacing at the two agreed boundaries. Breakpoint-specific duplicate page trees will not be introduced.

Existing home components remain responsible for their current sections:

- `HomeBlocks.tsx` composes hero, services, industries, process, and globe sections from CMS data.
- `HomeServicesScroller.tsx` owns the horizontal service-card experience.
- `HomeIndustriesAccordion.tsx` owns the responsive industries presentation.
- `HomeProcessSection.tsx` owns the interactive manufacturing process.
- `HomeGlobeSection.tsx` and the existing site layout continue to render the delivery and footer regions.

Section markup may receive small wrappers or data attributes when a Figma layout cannot be expressed cleanly with the current element boundaries. CMS field contracts and collection schemas will not change.

## Layout Behavior

### Hero

Desktop and laptop/tablet place the title and supporting copy in the translucent band over the hero media. Mobile keeps the title inside the hero band and moves the supporting paragraph and actions into a separate white content block immediately below it, matching the 390 px frame. The moving services rail remains visible on larger ranges and follows the mobile frame when space permits without forcing horizontal page overflow.

### Services

The section keeps five cards and the existing scroll-linked horizontal motion. Desktop uses the wide offset carousel from the 1920 px frame. Laptop/tablet adopts the tighter 1024 px heading, copy, card dimensions, and track offset. Mobile becomes a directly touch-scrollable horizontal rail and does not pin the page.

### Industries

Laptop/tablet is the structural baseline: section heading and descriptive content lead into product imagery and the industry list. Desktop retains the broader two-column sticky composition shown in node `100:486`. Mobile stacks content, products, and industry items in source order with no viewport-width overflow. Existing CMS industry titles and product links remain the content source.

### Manufacturing Process

All ranges render the same six steps and model. Desktop and laptop/tablet keep the three-column process stage, with dimensions tuned independently for 1920 px and 1024 px frames. Mobile uses the compact vertical composition from the 390 px frame. Automatic step cycling, hover/focus activation, reduced-motion support, and section/nav surface behavior remain shared.

### Globe, Header, and Footer

The existing components remain shared and receive only responsive sizing and spacing corrections needed to match their three reference compositions. Desktop navigation remains full; compact navigation behavior is used when the available width no longer supports the complete link row.

## Animation and Accessibility

- GSAP service scrolling is enabled only where the viewport can support the pinned horizontal scene; mobile retains native horizontal touch scrolling.
- The process animation uses the existing Motion state model at every range.
- `prefers-reduced-motion` disables marquee and scroll-linked transforms and shortens Motion transitions to effectively immediate changes.
- Source order remains logical when visual placement changes.
- Existing headings, links, button labels, focus behavior, and ARIA relationships are preserved.
- No animation may create horizontal document overflow.

## Assets and Styling

The implementation will reuse existing project components, CSS variables, CMS content, and committed local assets. Figma-generated React and Tailwind are measurement references only; the page continues to use the project's React/Next.js components and global CSS system. Expiring Figma asset URLs will not be added as new permanent dependencies.

## Testing and Verification

Implementation follows test-first development:

- Integration tests assert the shared semantic structure and required responsive hooks before production changes.
- Existing hero, services, industries, and process behavior tests remain green.
- CSS tests assert the 768 px and 1440 px boundaries and mobile/laptop/desktop rules that carry the composition.
- The full integration suite, lint, and production build run after implementation.
- Browser screenshots at 390 px, 1024 px, and 1920 px are compared against the supplied Figma frames.
- Reduced-motion and horizontal-overflow behavior are checked at all three widths.

## Out of Scope

- Payload schema or content-model changes.
- Replacing the current animation libraries.
- Rebuilding unrelated interior pages.
- Introducing Tailwind or a second styling system.
