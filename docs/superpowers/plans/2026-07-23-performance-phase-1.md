# Performance Phase 1 (Rendering/Caching + Images) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the SkyWings content routes from per-request SSR to static/ISR served from the CDN with on-demand cache invalidation, and enable the Next.js image optimizer (AVIF/WebP + srcset) — the two highest-impact wins — without regressing SEO or content freshness.

**Architecture:** Public data loaders (`src/data/*`) get wrapped in `unstable_cache` with invalidation **tags**; Payload collection/global hooks call `revalidateTag()` on publish so edits appear within seconds; content `page.tsx` files drop `force-dynamic` for `revalidate` + `generateStaticParams`; `/products` moves its `?industry=` read to the client so it can be static; `next.config.ts` turns the image optimizer on.

**Tech Stack:** Next.js 16.2.6 (App Router), Payload 3.85.2, React 19, Vercel Postgres + Blob, Vitest + Testing Library (`tests/int/**/*.int.spec.{ts,tsx}`), Playwright e2e.

## Global Constraints
- **No DB schema changes in this phase.** Hooks are runtime config — no migration, no `payload generate:types` needed for schema (though `generate:types` is used as a "config still loads" smoke check).
- **No Tailwind.** Styling is custom CSS in `src/app/(frontend)/*.css` (see [[stack-conventions]]).
- **All `next/image` must stay behind `SafeImage`/`ProductImage`.** `tests/int/safe-image.int.spec.tsx` fails the build if any `src/**` file (except `SafeImage.tsx`) uses `next/image` or `<img>` directly. Never add raw `next/image`/`<img>`.
- **Loaders wrapped in `unstable_cache` must not call `cookies()`/`headers()`/`draftMode()`.** The loaders use Payload's local API (`getPayloadClient`, `draft: false`, `overrideAccess: false`) — compliant. Do not introduce request-scoped calls inside cached functions.
- **Preserve these exports** (existing tests import them): `defaultHomeLayout` (`src/data/home.ts`), `defaultHeaderData`/`defaultFooterData`/`defaultSiteMetadata`/`SiteHeaderData` (`src/data/site.ts`).
- **TDD, frequent commits.** Each commit message ends with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **ISR backstop interval:** `3600` seconds on every converted route.

## Preflight
The repo is on `main` with unrelated uncommitted work. Before Task 1, create an isolated branch so this phase's commits are separable:

```bash
git checkout -b perf/phase-1-rendering-images
```

Do **not** stage the pre-existing unrelated modifications; each task's commit stages only that task's files (paths are given explicitly).

---

## File Structure

**Created:**
- `src/data/tags.ts` — pure cache-tag registry (`TAGS`); no framework imports so collections/globals can import it freely.
- `src/data/cache.ts` — `cachedQuery()` wrapper around `unstable_cache`.
- `src/collections/hooks/revalidate.ts` — hook factories that call `revalidateTag()`.
- `tests/int/data-cache.int.spec.ts` — unit tests for `TAGS` + `cachedQuery`.
- `tests/int/revalidate-hooks.int.spec.ts` — unit tests for the hook factories.
- `tests/int/products-catalog.int.spec.tsx` — behavior test for the client-side industry filter.

**Modified:**
- `src/data/catalog.ts` — wrap loaders in `cachedQuery`; add `getAllProductSlugs`/`getAllBlogSlugs`.
- `src/data/home.ts` / `src/data/pages.ts` / `src/data/site.ts` — wrap loaders; keep error-fallback outside the cache.
- 9 collections + 5 globals — add `hooks` blocks (Task 4).
- 8 route `page.tsx` files — remove `force-dynamic`, add `revalidate` (+ `generateStaticParams` on the two `[slug]` routes).
- `src/components/page-builder/PageBlocks.tsx`, `src/components/collections/ListingSections.tsx`, `src/components/collections/catalog/ProductsCatalog.tsx`, `src/data/searchParams.ts` — client-side `?industry=` (Task 6).
- `next.config.ts` + `tests/int/next-image-config.int.spec.ts` — enable optimizer (Task 7).
- An image CSS file — loading skeleton (Task 8).

---

## Task 1: Cache-tag registry + `cachedQuery` helper

**Files:**
- Create: `src/data/tags.ts`
- Create: `src/data/cache.ts`
- Test: `tests/int/data-cache.int.spec.ts`

**Interfaces:**
- Produces: `TAGS` — object of static tag strings + builders `product(slug)`, `page(slug)`, `post(slug)`. `cachedQuery<Args, Result>(fn, keyParts: string[], tags: string[]) => (...args: Args) => Promise<Result>`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/data-cache.int.spec.ts
import { describe, expect, test, vi } from 'vitest'

vi.mock('next/cache', () => ({
  // Identity wrapper so we can test cachedQuery's pass-through deterministically.
  unstable_cache: (fn: unknown) => fn,
}))

import { cachedQuery } from '@/data/cache'
import { TAGS } from '@/data/tags'

describe('TAGS', () => {
  test('static tags are stable strings', () => {
    expect(TAGS.products).toBe('products')
    expect(TAGS.media).toBe('media')
    expect(TAGS.globals).toBe('globals')
    expect(TAGS.threeD).toBe('three-d')
  })

  test('entity tag builders namespace by slug', () => {
    expect(TAGS.product('folding-stand')).toBe('product:folding-stand')
    expect(TAGS.post('hello-world')).toBe('post:hello-world')
    expect(TAGS.page('home')).toBe('page:home')
  })
})

describe('cachedQuery', () => {
  test('returns a function that yields the loader result', async () => {
    const wrapped = cachedQuery(async (n: number) => n * 2, ['double'], [TAGS.products])
    expect(await wrapped(21)).toBe(42)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/data-cache.int.spec.ts`
Expected: FAIL — cannot resolve `@/data/cache` / `@/data/tags`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/data/tags.ts
// Pure cache-tag registry. No framework imports — safe to import from Payload
// collections/globals and from data loaders alike.
export const TAGS = {
  products: 'products',
  product: (slug: string) => `product:${slug}`,
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  industries: 'industries',
  capabilities: 'capabilities',
  brochures: 'brochures',
  blog: 'blog',
  post: (slug: string) => `post:${slug}`,
  threeD: 'three-d',
  media: 'media',
  globals: 'globals',
} as const
```

```ts
// src/data/cache.ts
import { unstable_cache } from 'next/cache'

/**
 * Wrap a data loader in Next's persistent cache with invalidation tags.
 * Results are cached across requests and busted via `revalidateTag(tag)`.
 * The wrapped loader MUST NOT read cookies()/headers()/draftMode().
 */
export function cachedQuery<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  tags: string[],
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, keyParts, { tags })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/int/data-cache.int.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/tags.ts src/data/cache.ts tests/int/data-cache.int.spec.ts
git commit -m "feat(perf): add cache-tag registry and cachedQuery helper"
```

---

## Task 2: Revalidation hook factories

**Files:**
- Create: `src/collections/hooks/revalidate.ts`
- Test: `tests/int/revalidate-hooks.int.spec.ts`

**Interfaces:**
- Consumes: nothing (tags are passed in by callers).
- Produces:
  - `makeCollectionRevalidateHooks(buildTags: (doc: any) => string[]) => { afterChange, afterDelete }` — both hooks call `revalidateTag` for each built tag and return `doc`.
  - `makeGlobalRevalidateHook(tags: string[]) => GlobalAfterChange` — returns `doc`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/int/revalidate-hooks.int.spec.ts
import { afterEach, describe, expect, test, vi } from 'vitest'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag: (t: string) => revalidateTag(t) }))

import {
  makeCollectionRevalidateHooks,
  makeGlobalRevalidateHook,
} from '@/collections/hooks/revalidate'

afterEach(() => revalidateTag.mockReset())

describe('makeCollectionRevalidateHooks', () => {
  test('afterChange revalidates built tags and returns the doc', async () => {
    const { afterChange } = makeCollectionRevalidateHooks((doc: { slug?: string }) => [
      'products',
      `product:${doc.slug}`,
    ])
    const doc = { slug: 'folding-stand' }
    const result = await (afterChange as any)({ doc })

    expect(revalidateTag).toHaveBeenCalledWith('products')
    expect(revalidateTag).toHaveBeenCalledWith('product:folding-stand')
    expect(result).toBe(doc)
  })

  test('afterDelete revalidates built tags too', async () => {
    const { afterDelete } = makeCollectionRevalidateHooks(() => ['brochures'])
    await (afterDelete as any)({ doc: { id: 1 } })
    expect(revalidateTag).toHaveBeenCalledWith('brochures')
  })
})

describe('makeGlobalRevalidateHook', () => {
  test('afterChange revalidates the static tags and returns the doc', async () => {
    const hook = makeGlobalRevalidateHook(['globals'])
    const doc = { id: 1 }
    const result = await (hook as any)({ doc })
    expect(revalidateTag).toHaveBeenCalledWith('globals')
    expect(result).toBe(doc)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/revalidate-hooks.int.spec.ts`
Expected: FAIL — cannot resolve `@/collections/hooks/revalidate`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/collections/hooks/revalidate.ts
import { revalidateTag } from 'next/cache'
import type { CollectionConfig, GlobalConfig } from 'payload'

// Derive exact hook types from the config shape (avoids TypeWithID generic friction).
type CollectionAfterChange = NonNullable<NonNullable<CollectionConfig['hooks']>['afterChange']>[number]
type CollectionAfterDelete = NonNullable<NonNullable<CollectionConfig['hooks']>['afterDelete']>[number]
type GlobalAfterChange = NonNullable<NonNullable<GlobalConfig['hooks']>['afterChange']>[number]

function revalidate(tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag)
    } catch (error) {
      // revalidateTag throws outside a request scope (seed scripts, migrations).
      // Content still self-heals via the route ISR backstop.
      console.warn(`[revalidate] skipped tag "${tag}"`, error)
    }
  }
}

export function makeCollectionRevalidateHooks(buildTags: (doc: any) => string[]): {
  afterChange: CollectionAfterChange
  afterDelete: CollectionAfterDelete
} {
  const afterChange: CollectionAfterChange = ({ doc }) => {
    revalidate(buildTags(doc))
    return doc
  }
  const afterDelete: CollectionAfterDelete = ({ doc }) => {
    revalidate(buildTags(doc))
    return doc
  }
  return { afterChange, afterDelete }
}

export function makeGlobalRevalidateHook(tags: string[]): GlobalAfterChange {
  const afterChange: GlobalAfterChange = ({ doc }) => {
    revalidate(tags)
    return doc
  }
  return afterChange
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/int/revalidate-hooks.int.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/collections/hooks/revalidate.ts tests/int/revalidate-hooks.int.spec.ts
git commit -m "feat(perf): add revalidation hook factories"
```

---

## Task 3: Wrap data loaders with cache tags + add slug loaders

**Files:**
- Modify: `src/data/catalog.ts`
- Modify: `src/data/home.ts`
- Modify: `src/data/pages.ts`
- Modify: `src/data/site.ts`

**Interfaces:**
- Consumes: `TAGS` (`@/data/tags`), `cachedQuery` (`@/data/cache`).
- Produces (same call signatures as today, plus two new): `getAllProductSlugs(): Promise<string[]>`, `getAllBlogSlugs(): Promise<string[]>`. All existing loaders keep their signatures; `getRelatedProductsFor` stays uncached (it takes a full `Product` — poor cache key — and is regenerated with its page).

**Pattern:** for a no-arg / value-arg loader, replace `export async function getX(...)` with `export const getX = cachedQuery(async function fetchX(...) {…}, [key], [tags])`. For a **slug** loader, keep a thin exported function that builds a per-call wrapper so the slug is in both the key and the per-entity tag. Keep any error `try/catch` **outside** the cached call so transient failures are never cached.

- [ ] **Step 1: `src/data/catalog.ts` — add imports (top of file, after existing imports)**

```ts
import { cachedQuery } from './cache'
import { TAGS } from './tags'
```

- [ ] **Step 2: `src/data/catalog.ts` — wrap the list loaders**

Replace `getCapabilities`, `getIndustries`, `getProductFamilies`, `getProducts`, `getBrochures`, `getBlogPosts` with cached versions (bodies unchanged, only the wrapper differs):

```ts
export const getCapabilities = cachedQuery(
  async function fetchCapabilities(): Promise<Capability[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'capabilities',
      depth: 1,
      draft: false,
      limit: 100,
      overrideAccess: false,
      sort: 'sortOrder',
    })
    return docs
  },
  ['capabilities'],
  [TAGS.capabilities, TAGS.media],
)

export const getIndustries = cachedQuery(
  async function fetchIndustries(): Promise<Industry[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'industries',
      depth: 1,
      draft: false,
      limit: 100,
      overrideAccess: false,
      sort: 'sortOrder',
    })
    return docs
  },
  ['industries'],
  [TAGS.industries, TAGS.media],
)

export const getProductFamilies = cachedQuery(
  async function fetchProductFamilies(): Promise<ProductFamily[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'product-families',
      depth: 1,
      draft: false,
      limit: 100,
      overrideAccess: false,
      sort: 'sortOrder',
    })
    return docs
  },
  ['product-families'],
  [TAGS.products],
)

export const getProducts = cachedQuery(
  async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: 200,
      overrideAccess: false,
      sort: 'title',
    })
    return docs.filter(
      (product) =>
        matchesSearch(product, filters.q) &&
        matchesFamily(product, filters.family) &&
        matchesIndustry(product, filters.industry) &&
        matchesType(product, filters.type),
    )
  },
  ['products'],
  [TAGS.products, TAGS.industries, TAGS.media],
)

export const getBrochures = cachedQuery(
  async function fetchBrochures(): Promise<Brochure[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'brochures',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'title',
    })
    return docs
  },
  ['brochures'],
  [TAGS.brochures, TAGS.media],
)

export const getBlogPosts = cachedQuery(
  async function fetchBlogPosts(): Promise<BlogPost[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'blog-posts',
      depth: 1,
      draft: false,
      limit: 100,
      overrideAccess: false,
      sort: '-publishedAt',
    })
    return docs
  },
  ['blog-posts'],
  [TAGS.blog, TAGS.media],
)
```

- [ ] **Step 3: `src/data/catalog.ts` — wrap the slug loaders (per-call wrapper for per-entity tag)**

Rename the existing `getProductBySlug` body to `fetchProductBySlug` and the `getBlogPostBySlug` body to `fetchBlogPostBySlug`, then export thin wrappers:

```ts
async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    depth: 3,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })

  const product = docs[0] ?? null
  if (!product) return null

  const model3D = await getPublicModelForProduct(product)
  return model3D ? { ...product, model3D } : product
}

export function getProductBySlug(slug: string): Promise<Product | null> {
  return cachedQuery(
    fetchProductBySlug,
    ['product-by-slug', slug],
    [TAGS.products, TAGS.product(slug), TAGS.media, TAGS.brochures, TAGS.threeD],
  )(slug)
}

async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'blog-posts',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

export function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return cachedQuery(
    fetchBlogPostBySlug,
    ['blog-post-by-slug', slug],
    [TAGS.blog, TAGS.post(slug), TAGS.media],
  )(slug)
}
```

Leave `getRelatedProductsFor` and `getPublicModelForProduct` exactly as they are (uncached; regenerated with the product page).

- [ ] **Step 4: `src/data/catalog.ts` — add slug list loaders for `generateStaticParams`**

Append:

```ts
export const getAllProductSlugs = cachedQuery(
  async function fetchAllProductSlugs(): Promise<string[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
  },
  ['all-product-slugs'],
  [TAGS.products],
)

export const getAllBlogSlugs = cachedQuery(
  async function fetchAllBlogSlugs(): Promise<string[]> {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'blog-posts',
      depth: 0,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })
    return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
  },
  ['all-blog-slugs'],
  [TAGS.blog],
)
```

- [ ] **Step 5: `src/data/pages.ts` — cache by slug, fallback outside the cache**

Replace the whole `getPageLayout` implementation with:

```ts
import type { Page } from '@/payload-types'

import { cachedQuery } from './cache'
import { getPayloadClient } from './payload'
import { TAGS } from './tags'

export type PageLayout = NonNullable<Page['layout']>
export type PageLayoutBlock = PageLayout[number]

async function fetchPageLayoutBySlug(slug: string): Promise<PageLayout | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'pages',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  return docs[0]?.layout?.length ? docs[0].layout : null
}

export async function getPageLayout(slug: string, fallbackLayout: PageLayout): Promise<PageLayout> {
  try {
    const layout = await cachedQuery(
      fetchPageLayoutBySlug,
      ['page-layout', slug],
      [TAGS.pages, TAGS.page(slug), TAGS.media],
    )(slug)
    return layout ?? fallbackLayout
  } catch (error) {
    console.error(`Unable to load Payload page layout for ${slug}`, error)
    return fallbackLayout
  }
}
```

- [ ] **Step 6: `src/data/home.ts` — extract fetcher, cache it, keep try/catch outside**

Add imports at the top:

```ts
import { cachedQuery } from './cache'
import { TAGS } from './tags'
```

Replace the exported `getHomeLayout` with a private fetcher + cached wrapper + public try/catch:

```ts
async function fetchHomeLayout(): Promise<HomeLayout> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'pages',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: 'home' } },
  })

  const layout = docs[0]?.layout?.filter(isHomeBlock) ?? []
  const homeLayout = layout.length > 0 ? layout : defaultHomeLayout

  return Promise.all(
    homeLayout.map((block) =>
      block.blockType === 'homeIndustries'
        ? syncHomeIndustriesBlock(block as HomeIndustriesLayoutBlock)
        : block,
    ),
  )
}

const getCachedHomeLayout = cachedQuery(
  fetchHomeLayout,
  ['home-layout'],
  [TAGS.pages, TAGS.page('home'), TAGS.industries, TAGS.products, TAGS.media],
)

export async function getHomeLayout(): Promise<HomeLayout> {
  try {
    return await getCachedHomeLayout()
  } catch (error) {
    console.error('Unable to load Payload home page layout', error)
    return defaultHomeLayout
  }
}
```

- [ ] **Step 7: `src/data/site.ts` — cache header/footer/metadata, keep try/catch outside**

Add imports at the top:

```ts
import { cachedQuery } from './cache'
import { TAGS } from './tags'
```

Refactor each of the three loaders to a private fetcher (no try/catch — let it throw) wrapped by `cachedQuery`, with the try/catch fallback in the exported function. Replace `getSiteHeader`, `getSiteFooter`, `getSiteMetadata` with:

```ts
async function fetchSiteHeader(): Promise<SiteHeaderData> {
  const payload = await getPayloadClient()
  const [header, siteSettings] = await Promise.all([
    payload.findGlobal({ slug: 'header', depth: 1, overrideAccess: false }),
    payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false }),
  ])
  return {
    ...defaultHeaderData,
    logo: getMedia(siteSettings.logo),
    navigation: header.navigation?.length ? header.navigation : defaultHeaderData.navigation,
    cta: header.cta?.[0] ?? defaultHeaderData.cta,
  }
}

const getCachedSiteHeader = cachedQuery(fetchSiteHeader, ['site-header'], [TAGS.globals, TAGS.media])

export async function getSiteHeader(): Promise<SiteHeaderData> {
  try {
    return await getCachedSiteHeader()
  } catch (error) {
    console.error('Unable to load Payload header global', error)
    return defaultHeaderData
  }
}

async function fetchSiteFooter(): Promise<SiteFooterData> {
  const payload = await getPayloadClient()
  const footer = await payload.findGlobal({ slug: 'footer', depth: 1, overrideAccess: false })
  return {
    addresses: footer.addresses?.length ? footer.addresses : defaultFooterData.addresses,
    copyright: footer.copyright || defaultFooterData.copyright,
    emailAddress: footer.emailAddress || defaultFooterData.emailAddress,
    emailLabel: footer.emailLabel || defaultFooterData.emailLabel,
    headline: footer.headline || defaultFooterData.headline,
    legalLinks: footer.legalLinks?.length ? footer.legalLinks : defaultFooterData.legalLinks,
    linkGroups: footer.linkGroups?.length ? footer.linkGroups : defaultFooterData.linkGroups,
    newsletterButtonLabel: footer.newsletterButtonLabel || defaultFooterData.newsletterButtonLabel,
    newsletterHeading: footer.newsletterHeading || defaultFooterData.newsletterHeading,
    newsletterPlaceholder: footer.newsletterPlaceholder || defaultFooterData.newsletterPlaceholder,
    newsletterPrivacyLinks: footer.newsletterPrivacyLinks?.length
      ? footer.newsletterPrivacyLinks
      : defaultFooterData.newsletterPrivacyLinks,
    newsletterPrivacyText: footer.newsletterPrivacyText || defaultFooterData.newsletterPrivacyText,
    phoneLabel: footer.phoneLabel || defaultFooterData.phoneLabel,
    phoneNumbers: footer.phoneNumbers?.length
      ? footer.phoneNumbers.map(({ number }) => number)
      : defaultFooterData.phoneNumbers,
  }
}

const getCachedSiteFooter = cachedQuery(fetchSiteFooter, ['site-footer'], [TAGS.globals, TAGS.media])

export async function getSiteFooter(): Promise<SiteFooterData> {
  try {
    return await getCachedSiteFooter()
  } catch (error) {
    console.error('Unable to load Payload footer global', error)
    return defaultFooterData
  }
}

async function fetchSiteMetadata(): Promise<SiteMetadataData> {
  const payload = await getPayloadClient()
  const [siteSettings, seoDefaults] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 1, overrideAccess: false }),
    payload.findGlobal({ slug: 'seo-defaults', depth: 1, overrideAccess: false }),
  ])
  const favicon = getMedia(siteSettings.favicon)
  return {
    description:
      seoDefaults.defaultDescription || siteSettings.tagline || defaultSiteMetadata.description,
    faviconHref: getResolvableFaviconHref(favicon),
    title: seoDefaults.defaultTitle || siteSettings.siteName || defaultSiteMetadata.title,
  }
}

const getCachedSiteMetadata = cachedQuery(
  fetchSiteMetadata,
  ['site-metadata'],
  [TAGS.globals, TAGS.media],
)

export async function getSiteMetadata(): Promise<SiteMetadataData> {
  try {
    return await getCachedSiteMetadata()
  } catch (error) {
    console.error('Unable to load Payload site metadata', error)
    return defaultSiteMetadata
  }
}
```

- [ ] **Step 8: Typecheck + run existing tests (verification)**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm test:int`
Expected: all int tests PASS (they import only types/defaults from these modules — importing the wrapped loaders must not error).

- [ ] **Step 9: Commit**

```bash
git add src/data/catalog.ts src/data/home.ts src/data/pages.ts src/data/site.ts
git commit -m "perf(data): cache public loaders with invalidation tags"
```

---

## Task 4: Wire revalidation hooks into collections and globals

**Files (modify):**
- Collections: `src/collections/Products.ts`, `ProductFamilies.ts`, `Industries.ts`, `Capabilities.ts`, `BlogPosts.ts`, `Brochures.ts`, `ThreeDAssets.ts`, `Media.ts`, `Pages.ts`
- Globals: `src/globals/Header.ts`, `Footer.ts`, `SiteSettings.ts`, `SEODefaults.ts`, `SocialLinks.ts`

**Interfaces:**
- Consumes: `makeCollectionRevalidateHooks`, `makeGlobalRevalidateHook` (`@/collections/hooks/revalidate`), `TAGS` (`@/data/tags`).

None of these files currently have a `hooks` block (verified), so add one — do not merge. Relative import depth: from `src/collections/*` use `./hooks/revalidate` and `../data/tags`; from `src/globals/*` use `../collections/hooks/revalidate` and `../data/tags`.

**Collection template** (shown fully for `Products.ts`; every other collection is identical except the two import-anchored `buildTags` arrays given in the table):

- [ ] **Step 1: `src/collections/Products.ts`**

Add imports at the top:

```ts
import { TAGS } from '../data/tags'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'
```

Add a `hooks` key inside the config object (e.g. immediately after the `access` block, before `admin`):

```ts
  hooks: makeCollectionRevalidateHooks((doc) => [
    TAGS.products,
    ...(doc.slug ? [TAGS.product(doc.slug)] : []),
  ]),
```

`makeCollectionRevalidateHooks` returns `{ afterChange, afterDelete }`, which is exactly the shape of a Payload collection `hooks` object — assign it directly.

- [ ] **Step 2: Apply the same pattern to the remaining collections**

For each file, add the two imports (same as above) and a `hooks:` key whose `buildTags` body is:

| File | `buildTags((doc) => …)` returns |
|---|---|
| `ProductFamilies.ts` | `[TAGS.products]` |
| `Industries.ts` | `[TAGS.industries]` |
| `Capabilities.ts` | `[TAGS.capabilities]` |
| `BlogPosts.ts` | `[TAGS.blog, ...(doc.slug ? [TAGS.post(doc.slug)] : [])]` |
| `Brochures.ts` | `[TAGS.brochures]` |
| `ThreeDAssets.ts` | `[TAGS.threeD]` |
| `Media.ts` | `[TAGS.media]` |
| `Pages.ts` | `[TAGS.pages, ...(doc.slug ? [TAGS.page(doc.slug)] : [])]` |

Example for `Industries.ts`:

```ts
import { TAGS } from '../data/tags'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'
// …
  hooks: makeCollectionRevalidateHooks((doc) => [TAGS.industries]),
```

- [ ] **Step 3: Wire the globals**

For each global file add:

```ts
import { TAGS } from '../data/tags'
import { makeGlobalRevalidateHook } from '../collections/hooks/revalidate'
```

and a `hooks` key inside the `GlobalConfig` object:

```ts
  hooks: {
    afterChange: [makeGlobalRevalidateHook([TAGS.globals])],
  },
```

Apply identically to `Header.ts`, `Footer.ts`, `SiteSettings.ts`, `SEODefaults.ts`, `SocialLinks.ts`.

- [ ] **Step 4: Verify the Payload config still loads and typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm generate:types`
Expected: completes without error (this imports the full config → collections → globals → `next/cache`; confirms the import graph is safe outside the Next runtime). `git checkout src/payload-types.ts` afterward if it produced no meaningful diff.

- [ ] **Step 5: Commit**

```bash
git add src/collections/ src/globals/
git commit -m "feat(perf): revalidate cached content on Payload publish/delete"
```

---

## Task 5: Convert 7 content routes to static + ISR

**Files (modify):**
- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/products/[slug]/page.tsx`
- `src/app/(frontend)/blog/page.tsx`
- `src/app/(frontend)/blog/[slug]/page.tsx`
- `src/app/(frontend)/industries/page.tsx`
- `src/app/(frontend)/capabilities/page.tsx`
- `src/app/(frontend)/brochures/page.tsx`

**Interfaces:**
- Consumes: `getAllProductSlugs`, `getAllBlogSlugs` (`@/data/catalog`).

(`/products` and `/contact` are handled in Task 6 / left dynamic respectively.)

- [ ] **Step 1: Listing routes — swap `force-dynamic` for `revalidate`**

In each of `page.tsx` (home), `blog/page.tsx`, `industries/page.tsx`, `capabilities/page.tsx`, `brochures/page.tsx`, replace the line:

```ts
export const dynamic = 'force-dynamic'
```

with:

```ts
export const revalidate = 3600
```

- [ ] **Step 2: `products/[slug]/page.tsx` — ISR + prebuild slugs**

Replace `export const dynamic = 'force-dynamic'` with `export const revalidate = 3600`, add `getAllProductSlugs` to the existing catalog import, and add `generateStaticParams`:

```ts
import { getAllProductSlugs, getProductBySlug, getRelatedProductsFor } from '@/data/catalog'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    // Build without DB reachability still succeeds; pages generate on-demand.
    return []
  }
}
```

- [ ] **Step 3: `blog/[slug]/page.tsx` — ISR + prebuild slugs**

Replace `export const dynamic = 'force-dynamic'` with `export const revalidate = 3600`, add `getAllBlogSlugs` to the catalog import, and add:

```ts
import { getAllBlogSlugs, getBlogPostBySlug } from '@/data/catalog'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Build and confirm these routes are static/ISR**

Run: `pnpm build`
Expected: build succeeds; in the route table these 7 routes render as `○` (Static) or `●` (SSG with `generateStaticParams`) / show a `Revalidate` interval — **not** `ƒ` (Dynamic). `/products` and `/contact` may still be `ƒ` at this point (Task 6 handles `/products`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(frontend)/page.tsx" "src/app/(frontend)/products/[slug]/page.tsx" "src/app/(frontend)/blog/page.tsx" "src/app/(frontend)/blog/[slug]/page.tsx" "src/app/(frontend)/industries/page.tsx" "src/app/(frontend)/capabilities/page.tsx" "src/app/(frontend)/brochures/page.tsx"
git commit -m "perf(routes): serve content routes as static + ISR"
```

---

## Task 6: Make `/products` static (client-side `?industry=`)

**Files:**
- Modify: `src/app/(frontend)/products/page.tsx`
- Modify: `src/components/page-builder/PageBlocks.tsx`
- Modify: `src/components/collections/ListingSections.tsx`
- Modify: `src/components/collections/catalog/ProductsCatalog.tsx`
- Modify: `src/data/searchParams.ts`
- Test: `tests/int/products-catalog.int.spec.tsx`

**Interfaces:**
- `ProductsCatalog` drops its `initialIndustry` prop and reads `?industry=` from `window.location.search` in a mount effect. All products remain server-rendered (SEO), so the grid stays in the static HTML; only the initial filter is applied client-side.

**Why not `useSearchParams()`:** using it here would push the whole product grid behind a Suspense/client boundary, dropping product cards from the prerendered HTML and regressing SEO. The mount-effect approach keeps the full grid static.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/int/products-catalog.int.spec.tsx
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { ProductsCatalog } from '@/components/collections/catalog/ProductsCatalog'
import type { ProductLite } from '@/components/collections/catalog/ProductShopCard'

const products: ProductLite[] = [
  { id: 1, image: null, industrySlugs: ['aviation'], number: 1, sku: 'A1', slug: 'a1', summary: '', title: 'Aviation Stand' },
  { id: 2, image: null, industrySlugs: ['marine'], number: 2, sku: 'M1', slug: 'm1', summary: '', title: 'Marine Rack' },
]

const industries = [
  { slug: 'aviation', title: 'Aviation' },
  { slug: 'marine', title: 'Marine' },
]

afterEach(() => window.history.replaceState({}, '', '/products'))

describe('ProductsCatalog', () => {
  test('shows all products when no industry is in the URL', () => {
    window.history.replaceState({}, '', '/products')
    render(<ProductsCatalog heading="Products" industries={industries} products={products} />)
    expect(screen.getByText('Aviation Stand')).toBeTruthy()
    expect(screen.getByText('Marine Rack')).toBeTruthy()
  })

  test('applies the ?industry= filter from the URL on mount', async () => {
    window.history.replaceState({}, '', '/products?industry=aviation')
    render(<ProductsCatalog heading="Products" industries={industries} products={products} />)
    expect(await screen.findByText('Aviation Stand')).toBeTruthy()
    expect(screen.queryByText('Marine Rack')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/products-catalog.int.spec.tsx`
Expected: FAIL — `ProductsCatalog` still requires `initialIndustry` typing / does not read the URL (the second test still shows "Marine Rack").

- [ ] **Step 3: Update `ProductsCatalog.tsx`**

Change the imports and the top of the component so it reads the URL on mount and no longer takes `initialIndustry`:

```tsx
import { useEffect, useMemo, useState } from 'react'
```

```tsx
export function ProductsCatalog(props: {
  eyebrow?: string | null
  heading: string
  industries: IndustryOption[]
  products: ProductLite[]
}) {
  const { eyebrow, heading, industries, products } = props
  const [industry, setIndustry] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  // Read the initial industry from the URL on the client so the route stays
  // statically rendered (all products are in the prerendered HTML for SEO);
  // the filter is applied after mount.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('industry')
    if (param) {
      setIndustry(param)
      setPage(0)
    }
  }, [])
```

Leave the rest of the component (the `filtered`/`visible` memo, markup, pagination) unchanged.

- [ ] **Step 4: Remove the server-side filter plumbing**

`src/components/collections/ListingSections.tsx` — in `ProductListingSection`, drop the `filters` prop and the `initialIndustry` pass-through:

```tsx
export async function ProductListingSection(
  props: ListingCopy & { showFilters?: boolean | null },
) {
  const [industries, products] = await Promise.all([getIndustries(), getProducts({})])
  // …unchanged productsLite / industryOptions…
  return (
    <ProductsCatalog
      eyebrow={props.eyebrow}
      heading={props.heading}
      industries={industryOptions}
      products={productsLite}
    />
  )
}
```

Remove the now-unused `ProductFilters` from the import on line 9 (keep `getIndustries`, `getProducts`, `getMediaImage`, etc.).

`src/components/page-builder/PageBlocks.tsx` — remove `filters` from the type and the `ProductListingSection` call:

```tsx
type PageBlocksProps = {
  blocks: PageLayout
  submitted?: boolean
}
```

```tsx
    case 'productListing':
      return <ProductListingSection key={key} showFilters={block.showFilters} {...block} />
```

Remove the now-unused `import type { ProductFilters } from '@/data/catalog'` line.

- [ ] **Step 5: Make `/products` static**

`src/app/(frontend)/products/page.tsx` — remove the searchParams read:

```tsx
import { PageBlocks } from '@/components/page-builder/PageBlocks'
import { productsLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'

export const revalidate = 3600

export default async function ProductsPage() {
  const layout = await getPageLayout('products', productsLayout)
  return <PageBlocks blocks={layout} />
}
```

`src/data/searchParams.ts` — delete the now-unused `getProductFilters` function and its `ProductFilters` import (keep `RouteSearchParams`, `first`, and `hasSubmitted` — `/contact` still uses them):

```ts
export type RouteSearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function hasSubmitted(searchParams: RouteSearchParams) {
  const params = await searchParams
  return first(params.submitted) === '1'
}
```

- [ ] **Step 6: Run the test + typecheck**

Run: `pnpm exec vitest run tests/int/products-catalog.int.spec.tsx`
Expected: PASS (2 tests).

Run: `pnpm exec tsc --noEmit`
Expected: no errors (no lingering references to `getProductFilters`/`initialIndustry`/`context.filters`).

- [ ] **Step 7: Build and confirm `/products` is static**

Run: `pnpm build`
Expected: `/products` now renders as `○`/`●`, not `ƒ`.

- [ ] **Step 8: Commit**

```bash
git add "src/app/(frontend)/products/page.tsx" src/components/page-builder/PageBlocks.tsx src/components/collections/ListingSections.tsx src/components/collections/catalog/ProductsCatalog.tsx src/data/searchParams.ts tests/int/products-catalog.int.spec.tsx
git commit -m "perf(products): static catalog with client-side industry filter"
```

---

## Task 7: Enable the Next.js image optimizer

**Files:**
- Modify: `tests/int/next-image-config.int.spec.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Rewrite the config test to express the new desired state (failing)**

```ts
// tests/int/next-image-config.int.spec.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

describe('Next image configuration', () => {
  test('optimizes media into modern formats with the Blob CDN allow-listed', () => {
    const config = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8')

    // Optimizer is ON.
    expect(config).not.toMatch(/unoptimized:\s*true/)
    // Modern formats requested.
    expect(config).toMatch(/image\/avif/)
    expect(config).toMatch(/image\/webp/)
    // Vercel Blob CDN allow-listed for remote optimization.
    expect(config).toMatch(/public\.blob\.vercel-storage\.com/)
    // Same-origin Payload media + bundled public images still allowed.
    expect(config).toMatch(/pathname:\s*['"]\/api\/media\/file\/\*\*['"]/)
    expect(config).toMatch(/pathname:\s*['"]\/images\/\*\*['"]/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/int/next-image-config.int.spec.ts`
Expected: FAIL (config still has `unoptimized: true`, no formats/remotePatterns).

- [ ] **Step 3: Update `next.config.ts` images block**

Replace the `images` object:

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
  },
```

Leave `webpack`, `turbopack`, and `withPayload` untouched.

- [ ] **Step 4: Run test + build**

Run: `pnpm exec vitest run tests/int/next-image-config.int.spec.ts`
Expected: PASS.

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Verify optimized delivery in the browser preview**

Start the app (preview_start with the dev/`start` config), open a product detail page, and check the Network panel: hero/gallery/card images are requested via `/_next/image?url=…&w=…` and returned as `image/avif` (or `image/webp`). Capture one request's response `Content-Type` as evidence.

If media is served as absolute Blob URLs and a request 400s on `remotePatterns`, confirm the emitted `media.url` shape and keep whichever of `remotePatterns`/`localPatterns` matches (both are present as a safety net); prune the unused one.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts tests/int/next-image-config.int.spec.ts
git commit -m "perf(images): enable Next optimizer with AVIF/WebP + Blob remotePatterns"
```

---

## Task 8: Image loading skeleton + delivery verification

**Files:**
- Modify: `src/app/(frontend)/styles.css` (append a skeleton rule near the existing `.safe-image-fallback` styles)

The `sizes`/`priority` hygiene is already correct in the codebase — `ProductGallery` hero uses `priority sizes="100vw"`, thumbs use `sizes="8rem"`, `IndustryHeroMedia` uses responsive `sizes` + `loading="lazy"`. So this task adds a loading state and verifies delivery; it changes markup only if the Network panel reveals an oversized transfer.

- [ ] **Step 1: Add a skeleton shimmer for image frames**

Append to `src/app/(frontend)/styles.css` (reuse the existing fallback token palette; keep it CSS-only, no Tailwind):

```css
/* Loading skeleton for image frames while the optimized source streams in. */
.pdp-hero-frame,
.industries-showcase-card-media,
.shop-card-media {
  position: relative;
  background: linear-gradient(100deg, #e9edf2 30%, #f4f7fa 50%, #e9edf2 70%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.pdp-hero-frame img,
.industries-showcase-card-media img,
.shop-card-media img {
  position: relative;
  z-index: 1;
}

@keyframes skeleton-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .pdp-hero-frame,
  .industries-showcase-card-media,
  .shop-card-media {
    animation: none;
  }
}
```

Before writing, confirm the three container class names exist in the codebase (grep `pdp-hero-frame`, `industries-showcase-card-media`, `shop-card-media`); drop any that don't resolve and add the actual product-card media container class if it differs.

- [ ] **Step 2: Verify in the browser preview**

Reload a product page and the `/products` catalog. Confirm: (a) images arrive as AVIF/WebP at sensible widths (Network panel `w=` values track the rendered size, not full-res); (b) exactly one above-the-fold image per page loads eagerly (product hero) while below-the-fold/thumbnail images are lazy; (c) no layout shift and the `SafeImage` fallback still renders on a broken URL. Capture a screenshot of a product page as evidence.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(frontend)/styles.css"
git commit -m "perf(images): add loading skeleton for image frames"
```

---

## Final verification (whole phase)

- [ ] `pnpm test:int` — all int suites green (including the 3 new specs).
- [ ] `pnpm build` — the 8 content routes render as `○`/`●` (Static/ISR), only `/contact` (+ Payload admin/api) remain `ƒ`.
- [ ] Browser preview: product/home images delivered as AVIF/WebP with width variants; screenshot captured.
- [ ] Freshness check: edit a product title in `/admin`, save, reload the live product page within a few seconds → the change is visible (confirms `revalidateTag`). Repeat for a global (footer) → change shows site-wide.
- [ ] Playwright e2e (`pnpm test:e2e`) still green.

---

## Self-Review

**Spec coverage:**
- ISR + on-demand revalidation → Tasks 1–5 (cache + hooks + route conversion). ✓
- `searchParams` fix / `/products` static → Task 6. ✓
- Tagged cache invalidation model (loader tags + collection/global hooks) → Tasks 3–4; mapping matches the spec's tables. ✓
- `/contact` stays dynamic → left untouched in Tasks 5–6. ✓
- Broad `media` invalidation → `Media.ts` hook returns `[TAGS.media]`; image loaders tagged `media`. ✓
- Next optimizer / AVIF-WebP / srcset / Blob remotePatterns → Task 7. ✓
- `sizes`/`priority`/loading state → Task 8. ✓
- Acceptance criteria (build output, network formats, freshness, tests green) → Final verification. ✓
- SEO preserved: `/products` grid stays server-rendered (Task 6 rationale); static/ISR improves TTFB; no metadata/markup changes. ✓

**Placeholder scan:** No "TBD/TODO/handle edge cases". Task 4's per-file variation is a concrete tag-array table (deterministic), not a "similar to" reference. Task 8 gates its one conditional change on a concrete grep. ✓

**Type consistency:** `TAGS` keys/builders (`product`, `post`, `page`, `threeD`) are used identically in Tasks 1, 3, 4. `makeCollectionRevalidateHooks` returns `{ afterChange, afterDelete }` (assigned directly as a collection `hooks` object in Task 4). `getAllProductSlugs`/`getAllBlogSlugs` defined in Task 3, consumed in Task 5. `ProductsCatalog` prop shape (no `initialIndustry`) matches its Task-6 call site in `ListingSections`. ✓
