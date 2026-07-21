# Product Detail Page — Design Spec

Date: 2026-07-21
Figma: laptop `466-875`, mobile `480-1662` (Sky Wings file `2KMN08Gx6UuFqLr3qxFlza`)

## Goal
Rebuild the single product detail page to match the Figma, responsive across
mobile / laptop / desktop, and drive **every** section from the Payload
`Products` collection so any product can be authored from the admin. The page
acts as the template for all products.

## Reuse (do not rebuild)
- `SiteHeader` (sticky nav) and `SiteFooter` (SKYWINGS footer) already wrap all
  pages via `src/app/(frontend)/layout.tsx`. Build only the page body.
- Custom CSS design system in `src/app/(frontend)/styles.css` (`:root` tokens,
  `clamp()`). New rules live in `src/app/(frontend)/product-detail.css`, imported
  from the layout. No Tailwind. Headings `--font-title` (Inter), body
  `--font-body` (Roboto).
- Data access via `getProductBySlug` (depth 2) in `src/data/catalog.ts`.

## Backend — extend `src/collections/Products.ts`
All new fields are **optional**; sections render only when populated (graceful
degradation keeps the template reusable and existing products valid).

| Design element | Field | Type |
|---|---|---|
| Breadcrumb "Aviation / GSE / Stands" | `breadcrumb` | text |
| "Industry: …" | `industryLabel` | text |
| "Category: …" | `categoryLabel` | text |
| Hero metadata grid (Type/Material/Surface/Size/Weight/Capacity) | `keySpecs` | array `{ label, value }` |
| Fold/Unfold "how it works" | `howItWorks` | group `{ heading, image (upload), caption }` |
| Accessories table | `accessories` | array `{ label, value }` |
| Technical Drawing | `technicalDrawing` | upload |
| Color swatch on option pills | `configurationOptions.options[].swatch` | text (hex, optional) |

Reused as-is: `title`, `sku` (→ "ID: …"), `summary`/`description`,
`featuredImage` + `gallery` (hero + thumbnails), `specifications`
(Specification table), `configurationOptions` (Choose Options), `brochures`
(Download Brochure), `relatedProducts` (Related Products).

Regenerate `payload-types.ts` after the collection change.

## Frontend components (`src/components/collections/product/`)
- `ProductDetail.tsx` (server) — orchestrates sections in Figma order.
- `ProductGallery.tsx` (client) — hero image + clickable thumbnails (swap main).
- `ProductOverview.tsx` — breadcrumb, industry/category, `keySpecs` grid, description.
- `ProductHowItWorks.tsx` — optional media section.
- `ProductSpecs.tsx` — Specification + Accessories tables; collapsible via native
  `<details>`/`<summary>` with +/- indicator (accessible, no JS).
- `ProductTechnicalDrawing.tsx` — collapsible image.
- `ProductBrochure.tsx` — download-link row (first brochure file).
- `ProductConfigurator.tsx` (client) — pill toggle groups from `configurationOptions`
  + quantity stepper; "Add to Quote" links to `/contact?product=<slug>` (visual-only).
- `RelatedProducts.tsx` — card row; falls back to same-`productFamily` products
  when `relatedProducts` empty.

Simple UI icons (download, +/-, chevron, arrow) are inline lucide-style SVGs —
not committed Figma assets (which expire in ~7 days).

## Section order (both frames)
Hero (image + title + thumbnails) → Overview (breadcrumb / industry+category /
keySpecs / description) → `sku` id line → How it works (optional) →
Specification + Accessories → Technical Drawing → Download Brochure →
Choose Options + Quantity + Add to Quote → Related Products.

## Responsive
Mobile-first.
- **< 768px**: full-width hero, title overlaid; single column everywhere;
  configurator groups stacked; full-width Add to Quote; related products stacked.
- **768–1220px (laptop)**: two-column overview; side-by-side Spec/Accessories;
  3-column configurator; horizontal related-products row.
- **> 1220px (desktop)**: same layout capped at `--max`, centered.

## Demo data & verification
Seed one "Folding Stand" product via a Payload local-API script
(`src/scripts/seed-demo-product.ts` or similar), using the Figma content and a
few sample images committed under `public/images/products/`. Verify in the
browser preview. If local DB credentials are unavailable, flag it and verify the
render another way.

## Tests
Vitest integration test (mirroring `tests/int/*.int.spec.tsx`) rendering
`ProductDetail` with a mock product: asserts populated sections appear and empty
optional sections are omitted.

## Out of scope (explicit)
- Functional quote cart / RFQ submission wiring (button is visual-only for now).
- Real product photography (per-product CMS uploads, not committed to the repo
  beyond the demo samples).
