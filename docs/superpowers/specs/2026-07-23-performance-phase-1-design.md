# Performance Strategy — Phase 1 (Rendering/Caching + Images) — Design Spec

Date: 2026-07-23

## Goal
Deliver the two highest-impact performance wins for the SkyWings marketing site
(Next.js 16 + Payload 3.85 on Vercel) **without compromising SEO or content
freshness**:

1. **Rendering & caching** — convert content routes from per-request SSR to
   statically generated + ISR served from the CDN, with **on-demand
   revalidation** so CMS edits go live within seconds.
2. **Images** — enable the Next.js image optimizer to serve AVIF/WebP with
   responsive `srcset`, automatically resized and cached.

This is Phase 1 of a larger performance effort. Later workstreams (3D/GLB,
bundle splitting, Web Vitals/RUM, prefetching, compression tuning) are captured
in the **Phase 2 roadmap** at the end of this doc but are explicitly out of
scope now.

## Locked decisions (from brainstorming)
- **Scope:** highest-impact only — rendering/caching + images. Nothing else.
- **Freshness model:** ISR + on-demand revalidation (static/CDN pages; Payload
  hooks revalidate on publish). Chosen over time-based-only and stay-dynamic.
- **Image engine:** Next.js on-demand optimizer (flip `unoptimized` off).
  Chosen over Payload/Sharp-on-upload; accepts Vercel image-optimization units
  (bounded product-image set stays within the free tier).
- **`/contact` stays dynamic** (form route reading `?submitted`/`?product`).
- **Broad `media` invalidation is acceptable** (favor freshness over minimal
  invalidation; media edits are infrequent).

## Current-state audit (what we're fixing)
| Finding | Location | Impact |
|---|---|---|
| `images: { unoptimized: true }` disables all optimization | `next.config.ts:11` | No WebP/AVIF, no srcset, no resize on any `next/image` |
| `export const dynamic = 'force-dynamic'` on 8 pages | see route list below | Per-request SSR; no static/ISR/CDN HTML caching |
| No `unstable_cache` / cache tags | `src/data/*` | DB read on every render; no cross-request cache |
| No revalidation hooks | `src/collections/*` | No cache-invalidation story |
| `Media` has no `imageSizes`/`formats` | `src/collections/Media.ts` | Payload emits originals only (fine — Next optimizer handles variants) |

Already good (do not touch): `next/font` w/ `display: swap`; `Product3DViewer`
already `next/dynamic` lazy-loaded (`ProductGallery.tsx:38`); `SafeImage`/
`ProductImage` fallback pattern; tooling installed (`sharp`,
`@next/bundle-analyzer`, `@gltf-transform/cli`).

Routes with `force-dynamic` today: `/` , `/products`, `/products/[slug]`,
`/blog`, `/blog/[slug]`, `/industries`, `/capabilities`, `/brochures`,
`/contact`.

---

## Workstream A — Rendering & caching (ISR + on-demand revalidation)

### A1. Convert routes to static + ISR
Remove `export const dynamic = 'force-dynamic'` from the **8 content routes**
(all above except `/contact`). Each gets an ISR backstop:

```ts
export const revalidate = 3600 // 1h self-heal; on-demand hooks handle freshness
```

Add `generateStaticParams` to `/products/[slug]` and `/blog/[slug]` to prebuild
published slugs at build time (new slugs generate on first request via default
`dynamicParams`).

`/contact` is left unchanged (dynamic).

### A2. Tagged data cache
Introduce `src/data/cache.ts` exporting:
- A `TAGS` registry: `products`, `product(slug)`, `pages`, `page(slug)`,
  `industries`, `capabilities`, `brochures`, `blog`, `post(slug)`, `three-d`,
  `media`, `globals`.
- A `cachedQuery(fn, keyParts, tags)` helper wrapping `unstable_cache`.

Wrap the public read loaders in `src/data/*` so results cache across requests
and invalidate by tag. Each loader declares the tags it depends on:

| Loader (file) | Tags |
|---|---|
| `getProductBySlug` (`catalog.ts`) | `products`, `product:<slug>`, `media`, `brochures`, `three-d` |
| `getRelatedProductsFor` (`catalog.ts`) | `products` |
| `getProducts` (`catalog.ts`) | `products`, `industries`, `media` |
| `getIndustries` / `getCapabilities` / `getProductFamilies` / `getBrochures` (`catalog.ts`) | matching collection tag (+ `media` where images render) |
| `getBlogPosts` / `getBlogPostBySlug` (`catalog.ts`) | `blog` (+ `post:<slug>`), `media` |
| `getHomeLayout` (`home.ts`) | `pages`, `page:home`, `industries`, `products`, `media` |
| `getPageLayout` (`pages.ts`) | `pages`, `page:<slug>`, `media` |
| `getSiteHeader` / `getSiteFooter` / `getSiteMetadata` (`site.ts`) | `globals`, `media` |

Cross-cutting invalidation falls out of this: a product edit busts detail page +
catalog + home because all three read a loader tagged `products`.

**Constraint:** `unstable_cache` callbacks must not read `cookies()`/`headers()`.
The loaders use Payload's local API only (`getPayloadClient`, `draft: false`,
`overrideAccess: false`) and return JSON-serializable docs — both compatible.
The existing React `cache()` on `getPayloadClient` (per-request dedup) stays and
coexists with `unstable_cache` (cross-request).

### A3. `searchParams` fix (products route)
`/products` currently forces dynamic only because `getProductFilters` reads
`props.searchParams` for the initial industry. The catalog filters/paginate
entirely client-side (`ProductsCatalog.tsx:25`), so:
- Server stops reading `searchParams`; renders all products statically.
- `ProductsCatalog` reads the initial `?industry=` via `useSearchParams()` on
  the client to seed `useState`.

SEO unaffected: `/products` is canonical; `?industry=x` is the same cached page
with client-side initial filter.

---

## Workstream B — Cache invalidation

Add `afterChange` + `afterDelete` hooks to content collections. Payload is
mounted in the same Next server, so hooks import from `next/cache` and call
`revalidateTag()` directly (no webhook). One shared hook factory lives in
`src/collections/hooks/revalidate.ts` and each collection wires its tag(s).

| Collection | Revalidates | Refreshes |
|---|---|---|
| `Products`, `ProductFamilies` | `products` (+ `product:<slug>`) | detail, catalog, home |
| `Pages` | `pages` (+ `page:<slug>`) | home, section pages |
| `Industries` | `industries` | home, /industries, catalog filters |
| `BlogPosts` | `blog` (+ `post:<slug>`) | /blog, post |
| `Brochures` | `brochures` | /brochures, product detail |
| `ThreeDAssets` | `three-d` | product detail |
| `Media` | `media` | any page rendering that image (broad, deliberate) |
| Globals backing `site.ts` (header/footer/metadata) | `globals` | layout on all pages |

During implementation, confirm what backs `src/data/site.ts` (Payload global vs
collection) and wire its hook to `globals`. Any content collection rendered on a
cached route but *without* a hook relies on the 1h ISR backstop — acceptable, and
the pattern is trivially extendable if a gap is found.

**Result:** publish in admin → live within seconds (on-demand), self-healing
within 1h (backstop).

**Draft/preview note:** current loaders hardcode `draft: false`; frontend draft
preview is not wired. If added later, those requests must bypass the static cache
(`draftMode()` check). Out of scope now.

---

## Workstream C — Images (Next.js optimizer)

### C1. `next.config.ts`
Replace the `images` block:
```ts
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
  ],
  localPatterns: [
    { pathname: '/api/media/file/**' },
    { pathname: '/images/**' },
  ],
  minimumCacheTTL: 2678400, // 31d — Blob filenames are content-stable
}
```
Covers both URL shapes (absolute Blob URL vs same-origin `/api/media/file/…`);
confirm which Payload's vercel-blob adapter emits during build and prune the
unused pattern. No changes to `SafeImage`/`ProductImage` — they already wrap
`next/image`.

### C2. `sizes` + `priority` audit
- Every `fill` image passes an accurate `sizes` reflecting its real rendered
  width (gallery hero vs thumbnail vs card-grid column). This is what drives
  srcset quality.
- Exactly **one** LCP image per page uses `priority` (product hero, home hero);
  everything else stays lazy (Next default). Audit callers of `ProductImage`/
  `SafeImage` across `src/components/**`.

### C3. Loading state
Add a lightweight CSS skeleton to image containers, reusing the existing
`safe-image-fallback` / `ProductImagePlaceholder` styling. No true blur
placeholder (Payload doesn't emit `blurDataURL`).

---

## Acceptance criteria (evidence-based)
1. `next build` output shows the 8 converted routes as Static/ISR (`○`/`●`), not
   `ƒ` (Dynamic).
2. Browser preview → Network: product & home images arrive as **AVIF/WebP** with
   `?w=` width variants and correct `sizes`.
3. Editing a product in the Payload admin makes the change appear on the live
   route **within seconds** (revalidateTag verified).
4. Existing `vitest` int + Playwright e2e suites stay green.
5. No broken images / layout shift; `SafeImage` fallback still triggers on error.

## Testing plan
- **TDD (unit):** the revalidation hook factory in
  `src/collections/hooks/revalidate.ts` — a test asserts it calls `revalidateTag`
  with the expected tags for a given doc (mock `next/cache`).
- **Regression:** keep `tests/int/*` and Playwright green; update any test that
  asserted dynamic behavior.
- **Manual/preview:** build output inspection + Network panel + admin-edit
  freshness check (per acceptance criteria).

## Risks & tradeoffs
- **Vercel image-optimization usage** — bounded product-image set expected within
  free tier; revisit (→ Payload/Sharp-on-upload) if usage climbs.
- **Broad `media` invalidation** — one media edit busts all `media`-tagged pages.
  Accepted (correctness > minimal invalidation; media edits rare).
- **Blob hostname pattern** — must match the adapter's emitted URL; verified at
  build, both patterns included as a safety net.
- **Collections without hooks** — rely on 1h backstop; acceptable and extendable.

## Phase 2 roadmap (deferred — not in this phase)
Captured so the original broad ask isn't lost:
- **3D/GLB:** DRACO/Meshopt decoders on `useGLTF`; GLB compression pipeline via
  `@gltf-transform`; lazy-load `HomeGlobeScene` + `HomeProcessModel` (currently
  statically imported → Three.js eager on homepage); progressive loading + asset
  preload/cache.
- **Bundle & splitting:** wire `@next/bundle-analyzer`; dynamic-import heavy libs
  (gsap/motion/three) where feasible; prefetch tuning.
- **Monitoring:** Web Vitals reporting (`useReportWebVitals`) + RUM; Lighthouse
  budget in CI.
- **Queries:** refactor the N+1 fallback in `getHomeIndustryItems` (`home.ts`).
- **SEO:** per-product/per-post `generateMetadata` (real SEO win, separate task).
- **Compression/headers:** explicit static-asset cache headers beyond images.
