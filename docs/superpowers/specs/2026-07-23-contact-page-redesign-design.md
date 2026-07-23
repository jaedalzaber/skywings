# Contact Page Redesign — Design Spec

Date: 2026-07-23
References: user-supplied mockups (deep-blue and light colorways of the same
layout; light chosen), user decisions from brainstorming: **form-forward**,
**light colorway**.

## Goal
Replace the existing `/contact` page (generic `pageHero` + `contactRFQ`
section) with a high-converting, light, form-forward design based on the
mockups: a hero with the big friendly heading and a prominent RFQ card,
direct email/phone rows, and a branches/map band with Sharjah/Thoban cards,
map pins, and a giant outlined "UAE" wordmark.

## Locked decisions
- **Form-forward:** the RFQ form card sits in the hero's right column,
  displacing the mockup's large logo (the site header already carries
  branding; no logo repeat).
- **Light colorway:** light-gray bands, dot-grid texture, faint aircraft
  watermark, site blues (`#3867ff` accents). The blue mockup is not built.
- **No Payload schema changes** — no DB push, no edits to collection/global
  config files (they are under concurrent edit by the user).
- **No git commits.** All work stays uncommitted in the working tree
  alongside the user's in-flight WIP; the paused perf branch is untouched.
  (Deviation from the usual commit-the-spec step, deliberate: the branch
  state is frozen until the entanglement is resolved.)

## Data flow
- **Copy** comes from the existing `contactRFQ` block fields (`eyebrow`,
  `heading`, `description`) — CMS-editable, no schema change. The fallback
  copy in `src/data/pageDefaults.ts` `contactLayout` is updated to the
  mockup's: eyebrow `Contact Us`, heading
  `Feel Free To Get In Touch With Us.`, description
  `Supported by modern machinery and experienced technicians, we deliver
  customized fabrication solutions.` The `pageHero` block is removed from
  `contactLayout` — the new section is the page hero.
- **Contact details** come from the Footer global via `getSiteFooter()`
  (`SiteFooterData`): `emailAddress`, `emailLabel` ("Send email"),
  `phoneLabel` ("Call now"), `phoneNumbers` (4), `addresses` (2:
  `{ address, phone }`). The mockup's values already match this data
  verbatim.
- **Branch card titles** are not in the CMS (addresses have no title
  field). Display titles come from a component-level defaults array
  `['Sharjah Branch', 'Thoban Branch']` by index; any address beyond the
  first two falls back to a zero-padded `Branch NN` (e.g. `Branch 03`).
  Pin labels reuse the title's first word (`Sharjah`, `Thoban`).
  Adding CMS title fields is out of scope (would require a schema change).
- **Prefill (new behavior):** `contact/page.tsx` reads `?product=<slug>`
  alongside the existing `?submitted`. The slug is resolved to the product
  title via `getProductBySlug(slug)` (fallback: the raw param value) and
  passed as `productInterest` through `PageBlocks` → `ContactSection` →
  `RFQForm`. This makes the product configurator's existing
  `/contact?product=<slug>` link work end-to-end for the first time.

## Components
- `src/components/contact/ContactSection.tsx` — presentational server
  component. Props: `{ eyebrow?, heading, description?, footer:
  SiteFooterData, productInterest?, submitted? }`. Renders the hero band
  (left: eyebrow → `h1` heading → Send Email / Call Now link rows → blurb;
  right: white RFQ card wrapping the existing `RFQForm`) and
  `<ContactBranches>`.
- `src/components/contact/ContactBranches.tsx` — branches/map band: two
  white branch cards (blue `01`/`02` numerals, title, `<address>`, phone),
  pins, outlined UAE wordmark.
- `src/components/contact/contact-art.tsx` — `aria-hidden` inline SVG
  decorations: `PlaneWatermark`, `MapLines`, `MapPin`. The UAE wordmark is
  styled text, not SVG. No raster assets anywhere (keeps the SafeImage
  guard test happy).
- `src/components/page-builder/PageBlocks.tsx` — the `contactRFQ` case
  awaits `getSiteFooter()` and renders `ContactSection`, replacing the old
  `.rfq-section` markup. `PageBlocksProps` gains `productInterest?: string`.
- `src/components/forms/RFQForm.tsx` — reused **unchanged** (it already
  accepts `productInterest`); restyled purely via CSS scoping.

## Styling
- New `src/app/(frontend)/contact.css`, imported in the frontend
  `layout.tsx` after `products-catalog.css`. Custom CSS only (no Tailwind);
  reuse `:root` tokens, `--font-title` (Inter) / `--font-body` (Roboto).
- **No edits to `styles.css`** (old `.rfq-section` rules go dormant; the
  file is under concurrent edit).
- Hero band: near-`#f4f5f7` background, CSS radial-gradient dot grid,
  watermark absolutely positioned behind the right column. Grid ≥ 48rem:
  left copy column + ~26rem form-card column. Card: white, 1.25rem radius
  (matches industries cards), soft shadow, 2-col field grid with
  full-width message (existing `.field-full` convention), blue submit.
- Branches band: subtle SVG street-line texture, cards column (~20rem)
  left, map art filling the rest; UAE wordmark via `-webkit-text-stroke`
  with transparent fill (solid light-gray fallback), band `overflow:
  hidden`, wordmark bleeding off the right edge.
- Responsive < 48rem: single column — eyebrow/heading → form card →
  email/phone rows → blurb → branch cards; pins hidden; UAE scaled down.
- `#rfq-form` anchor stays on the form card (existing `Start RFQ` links
  keep working). Email/phone rows are real `mailto:`/`tel:` links.

## SEO / accessibility
- The section heading is the page `h1` (the old `pageHero` heading it
  replaces was the page's primary heading).
- All decorative art `aria-hidden`; branch addresses in `<address>`;
  form labels unchanged (already correct); everything server-rendered.

## Testing / acceptance
- New `tests/int/contact-section.int.spec.tsx`, rendering
  `ContactSection` with `defaultFooterData` and the new default copy:
  1. eyebrow + `h1` heading render;
  2. `mailto:` and `tel:` links present (email + all 4 numbers);
  3. all 7 RFQ fields + submit render; `#rfq-form` anchor exists;
  4. `productInterest` prefills the "Product or requirement" field;
  5. branch cards render `Sharjah Branch` / `Thoban Branch` with addresses.
- `pnpm exec tsc --noEmit` clean; `pnpm test:int` — no regressions vs the
  current working-tree baseline.
- Live verification on the user's running dev server
  (`localhost:3000/contact`, HMR — no server restarts, no commits):
  two-column hero at desktop, mobile stack at < 48rem, prefill via
  `/contact?product=<slug>`.

## Out of scope
- Blue colorway; real map embed; CMS fields for branch titles; editing
  `RFQForm` internals; any git commits; the paused perf-phase work.
