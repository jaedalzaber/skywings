import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { ProductDetail } from '@/components/collections/product/ProductDetail'
import { ProductGallery } from '@/components/collections/product/ProductGallery'
import { DEFAULT_LIGHTING_PRESET } from '@/lib/three/lightingPreset'
import type { Media, Product } from '@/payload-types'

const catalogSourcePath = resolve(process.cwd(), 'src/data/catalog.ts')
const catalogSource = existsSync(catalogSourcePath) ? readFileSync(catalogSourcePath, 'utf8') : ''
const productsCollectionPath = resolve(process.cwd(), 'src/collections/Products.ts')
const productsCollectionSource = existsSync(productsCollectionPath)
  ? readFileSync(productsCollectionPath, 'utf8')
  : ''
const listingSectionsPath = resolve(process.cwd(), 'src/components/collections/ListingSections.tsx')
const listingSectionsSource = existsSync(listingSectionsPath)
  ? readFileSync(listingSectionsPath, 'utf8')
  : ''
const productsPagePath = resolve(process.cwd(), 'src/app/(frontend)/products/page.tsx')
const productsPageSource = existsSync(productsPagePath)
  ? readFileSync(productsPagePath, 'utf8')
  : ''
const productDetailPagePath = resolve(process.cwd(), 'src/app/(frontend)/products/[slug]/page.tsx')
const productDetailPageSource = existsSync(productDetailPagePath)
  ? readFileSync(productDetailPagePath, 'utf8')
  : ''
const productDetailStylesPath = resolve(process.cwd(), 'src/app/(frontend)/product-detail.css')
const productDetailStyles = existsSync(productDetailStylesPath)
  ? readFileSync(productDetailStylesPath, 'utf8')
  : ''
const migrationsIndexPath = resolve(process.cwd(), 'src/migrations/index.ts')
const migrationsIndexSource = existsSync(migrationsIndexPath)
  ? readFileSync(migrationsIndexPath, 'utf8')
  : ''

function media(overrides: Partial<Media> = {}): Media {
  return {
    id: 1,
    alt: 'Folding stand render',
    url: '/images/products/folding-stand.png',
    width: 1280,
    height: 720,
    updatedAt: '2026-07-21T00:00:00.000Z',
    createdAt: '2026-07-21T00:00:00.000Z',
    ...overrides,
  } as Media
}

const fullProduct = {
  id: 10,
  title: 'Folding Stand',
  slug: 'folding-stand',
  sku: 'GSE-FS-038',
  summary: 'Foldable work stand.',
  breadcrumb: 'Aviation / GSE / Stands',
  industryLabel: 'Aviation GSE',
  categoryLabel: 'Maintenance & Stand',
  keySpecs: [
    { id: 'k1', label: 'Type', value: 'Folding' },
    { id: 'k2', label: 'Capacity', value: '200kg' },
  ],
  featuredImage: media(),
  gallery: [
    { id: 'g1', image: media({ id: 2, url: '/images/products/thumb-2.png' }) },
    {
      id: 'g-card',
      image: media({
        alt: 'Folding stand card thumbnail',
        id: 8,
        url: '/images/products/folding-stand-card.png',
      }),
    },
  ],
  thumbnailImage: media({
    alt: 'Folding stand card thumbnail',
    id: 8,
    url: '/images/products/folding-stand-card.png',
  }),
  howItWorks: {
    heading: 'How it works',
    image: media({ id: 3, url: '/images/products/fold-unfold.png' }),
    caption: 'Fold and unfold in seconds.',
  },
  specifications: [
    { id: 's1', label: 'Weight', value: '700', unit: 'kg' },
    { id: 's2', label: 'Material', value: 'Steel Construction' },
  ],
  accessories: [{ id: 'a1', label: 'Movement', value: '2 Persons' }],
  technicalDrawing: media({ id: 4, url: '/images/products/drawing.png' }),
  brochure: {
    coverImage: media({
      alt: 'Product brochure cover',
      id: 7,
      url: '/images/products/brochure-cover.png',
    }),
    id: 5,
    pageCount: 2,
    title: 'Product brochure',
    slug: 'product-brochure',
    url: '/brochures/product.pdf',
  } as never,
  brochures: [{ id: 6, title: 'Spec sheet', slug: 'spec', url: '/brochures/spec.pdf' } as never],
  configurationOptions: [
    {
      id: 'c1',
      group: 'Material',
      options: [
        { id: 'o1', label: 'Steel', value: 'steel' },
        { id: 'o2', label: 'Aluminium', value: 'aluminium' },
      ],
    },
  ],
} as unknown as Product

const relatedProduct = {
  id: 20,
  title: 'Straight Ladders',
  slug: 'straight-ladders',
  featuredImage: media({ id: 6, url: '/images/products/ladders.png' }),
  thumbnailImage: media({
    alt: 'Straight ladder card thumbnail',
    id: 7,
    url: '/images/products/ladders-card.png',
  }),
} as unknown as Product

function setMobileViewport(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

describe('ProductDetail', () => {
  afterEach(cleanup)

  test('product queries exclude unused layout blocks from detail reads', () => {
    expect(catalogSource).toMatch(/const productWithoutLayoutSelect = \{\s*layout: false,/s)
    expect(catalogSource).toMatch(/fetchProductBySlug[\s\S]*select: productWithoutLayoutSelect,/)
    expect(catalogSource).toMatch(/getRelatedProductsFor[\s\S]*select: productListSelect,/)
    expect(productsCollectionSource).toMatch(/defaultPopulate:\s*\{\s*layout:\s*false,/s)
  })

  test('product listing reads a lighter card shape and ranks featured-image products first', () => {
    expect(catalogSource).toMatch(/const productListSelect = \{[\s\S]*gallery: false,/)
    expect(catalogSource).toMatch(/const productListSelect = \{[\s\S]*layout: false,/)
    expect(catalogSource).toMatch(/select: productListSelect,/)
    expect(catalogSource).toMatch(/function hasCardThumbnail\(product: Product\)/)
    expect(catalogSource).toMatch(/hasCardThumbnail\(product\) &&\s*matchesSearch/)
    expect(catalogSource).toMatch(
      /Number\(hasCardThumbnail\(b\)\) - Number\(hasCardThumbnail\(a\)\)/,
    )
    expect(catalogSource).toMatch(/return sortProductsForListing\(\s*docs\.filter\(/)
  })

  test('product routes can use cached rendering instead of forced dynamic SSR', () => {
    expect(productsPageSource).not.toContain("dynamic = 'force-dynamic'")
    expect(productsPageSource).not.toContain('searchParams')
    expect(productsPageSource).not.toContain('getProductFilters')
    expect(productDetailPageSource).not.toContain("dynamic = 'force-dynamic'")
    expect(productDetailPageSource).toMatch(/export async function generateStaticParams\(\)/)
    expect(productDetailPageSource).toMatch(/getAllProductSlugs\(\)/)
  })

  test('product card thumbnails are editable and migrated', () => {
    expect(productsCollectionSource).toMatch(/name:\s*'thumbnailImage'[\s\S]*relationTo:\s*'media'/)
    expect(listingSectionsSource).toMatch(/const image = getMediaImage\(product\.thumbnailImage\)/)
    expect(listingSectionsSource).not.toMatch(
      /getMediaImage\(product\.thumbnailImage\)\s*\?\?\s*getMediaImage\(product\.featuredImage\)/,
    )
    expect(migrationsIndexSource).toContain('20260723_120000_product_card_thumbnail')
  })

  test('renders every populated section from the product', () => {
    render(<ProductDetail product={fullProduct} related={[relatedProduct]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Folding Stand' })).toBeDefined()
    expect(screen.getByText('Aviation / GSE / Stands')).toBeDefined()
    expect(screen.getByText('Industry: Aviation GSE')).toBeDefined()
    expect(screen.getByText('Category: Maintenance & Stand')).toBeDefined()
    expect(screen.queryByText('Type:')).toBeNull()
    expect(screen.getByText('ID: GSE-FS-038')).toBeDefined()

    // Spec + accessories tables
    expect(screen.getByText('Specification')).toBeDefined()
    expect(screen.getByText('700 kg')).toBeDefined()
    expect(screen.getByText('Accessories')).toBeDefined()
    expect(screen.getByText('2 Persons')).toBeDefined()

    // Technical drawing + brochure
    expect(screen.getByText('Technical Drawing')).toBeDefined()
    expect(screen.getByText('Product ID:')).toBeDefined()
    expect(screen.getByText('GSE-FS-038')).toBeDefined()
    expect(screen.getByText('Pages:')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByAltText('Product brochure cover')).toBeDefined()
    const brochure = screen.getByRole('link', { name: 'Download Product brochure' })
    expect(brochure?.getAttribute('href')).toBe('/brochures/product.pdf')

    // Configurator (scope to the option-group legend — "Material" also appears
    // as a specification row label).
    expect(screen.getByText('Material', { selector: '.pdp-option-label' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Steel' })).toBeDefined()
    const cta = screen.getByRole('link', { name: 'Add to Quote' })
    expect(cta.getAttribute('href')).toBe('/contact?product=folding-stand')

    // Product-card thumbnails stay out of the product detail gallery.
    expect(screen.queryByAltText('Folding stand card thumbnail')).toBeNull()

    // Related
    const related = screen.getByRole('link', { name: /Straight Ladders/ })
    expect(related.getAttribute('href')).toBe('/products/straight-ladders')
    expect(within(related).queryByAltText('Straight ladder card thumbnail')).toBeNull()
    expect(within(related).getByAltText('Folding stand render')).toBeDefined()
  })

  test('keeps the quote CTA to one option column on non-mobile layouts', () => {
    expect(productDetailStyles).toMatch(
      /@media \(min-width: 48rem\)[\s\S]*?\.pdp-option-groups\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s,
    )
    expect(productDetailStyles).toMatch(
      /@media \(min-width: 48rem\)[\s\S]*?\.pdp-quote-row\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s,
    )
    expect(productDetailStyles).toMatch(
      /@media \(min-width: 48rem\)[\s\S]*?\.pdp-add-to-quote\s*\{[\s\S]*?grid-column:\s*3;[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;/s,
    )
  })

  test('omits optional sections that have no data', () => {
    const minimal = {
      id: 11,
      title: 'Basic Stand',
      slug: 'basic-stand',
      summary: 'A simple stand.',
      featuredImage: media(),
    } as unknown as Product

    const { container } = render(<ProductDetail product={minimal} related={[]} />)

    expect(screen.queryByText('How it works')).toBeNull()
    expect(screen.queryByText('Technical Drawing')).toBeNull()
    expect(screen.queryByText('Download Brochure')).toBeNull()
    expect(screen.queryByText('Related Products')).toBeNull()
    expect(container.querySelector('.pdp-collapsible')).toBeNull()
    // Summary still shows.
    expect(within(container).getByText('A simple stand.')).toBeDefined()
  })

  test('falls back to additional brochures when no single product brochure is set', () => {
    const product = {
      ...fullProduct,
      brochure: null,
    } as unknown as Product

    render(<ProductDetail product={product} related={[]} />)

    const brochure = screen.getByRole('link', { name: 'Download Spec sheet' })
    expect(brochure?.getAttribute('href')).toBe('/brochures/spec.pdf')
  })

  test('uses the optional mobile gallery below laptop width', async () => {
    setMobileViewport(true)
    const product = {
      ...fullProduct,
      mobileGallery: [
        {
          id: 'mg1',
          image: media({
            alt: 'Mobile folding stand render',
            id: 30,
            url: '/images/products/mobile-folding-stand.png',
          }),
        },
      ],
    } as unknown as Product

    render(<ProductDetail product={product} related={[]} />)

    await waitFor(() => {
      expect(screen.getAllByAltText('Mobile folding stand render').length).toBeGreaterThan(0)
    })
    expect(
      within(screen.getByLabelText('Folding Stand images')).queryByAltText('Folding stand render'),
    ).toBeNull()
  })

  test('falls back to desktop images on mobile when no mobile gallery is set', async () => {
    setMobileViewport(true)

    render(<ProductDetail product={fullProduct} related={[]} />)

    await waitFor(() => {
      expect(screen.getAllByAltText('Folding stand render').length).toBeGreaterThan(0)
    })
  })

  test('uses desktop images at laptop width even when mobile gallery is set', async () => {
    setMobileViewport(false)
    const product = {
      ...fullProduct,
      mobileGallery: [
        {
          id: 'mg1',
          image: media({
            alt: 'Mobile folding stand render',
            id: 30,
            url: '/images/products/mobile-folding-stand.png',
          }),
        },
      ],
    } as unknown as Product

    render(<ProductDetail product={product} related={[]} />)

    await waitFor(() => {
      expect(
        within(screen.getByLabelText('Folding Stand images')).getAllByAltText(
          'Folding stand render',
        ).length,
      ).toBeGreaterThan(0)
    })
    expect(screen.queryByAltText('Mobile folding stand render')).toBeNull()
  })

  test('desktop gallery thumbnails select the clicked image', async () => {
    setMobileViewport(false)

    render(
      <ProductGallery
        images={[
          { alt: 'First product view', url: '/images/products/first-view.png' },
          { alt: 'Second product view', url: '/images/products/second-view.png' },
        ]}
        model={{
          actions: ['auto-rotate', 'reset-view'],
          camera: [3, 2, 4],
          lighting: DEFAULT_LIGHTING_PRESET,
          scale: 1,
          url: null,
        }}
        title="Clickable gallery"
      />,
    )

    const secondThumb = screen.getByRole('button', { name: 'Show view 2' })
    fireEvent.pointerDown(secondThumb, { clientX: 0, pointerId: 1 })
    fireEvent.pointerUp(secondThumb, { clientX: 0, pointerId: 1 })
    fireEvent.click(secondThumb)

    await waitFor(() => {
      expect(secondThumb.hasAttribute('data-active')).toBe(true)
    })
  })
})
