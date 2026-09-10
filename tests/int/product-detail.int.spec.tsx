import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { ProductDetail } from '@/components/collections/product/ProductDetail'
import { ProductGallery } from '@/components/collections/product/ProductGallery'
import { RelatedProducts } from '@/components/collections/product/RelatedProducts'
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
  // A gallery and a description: enough of a page to link to.
  description: {
    root: {
      children: [{ children: [{ text: 'Straight ladders.', type: 'text' }], type: 'paragraph' }],
    },
  },
  gallery: [{ id: 'rg1', image: media({ id: 8, url: '/images/products/ladders-2.png' }) }],
} as unknown as Product

// Listed, but not written up yet: no gallery, no description.
const unfinishedProduct = {
  id: 21,
  title: 'Cowl Pylon Ladders',
  slug: 'cowl-pylon-ladders',
  featuredImage: media({ id: 9, url: '/images/products/cowl.png' }),
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

  /*
   * The gallery and description stay in the listing read, though no card shows
   * them: together they decide whether a card links to a page at all. Finished
   * products rank ahead of those with only a card image.
   */
  test('product listing reads a lighter card shape and ranks finished products first', () => {
    expect(catalogSource).toMatch(/const productListSelect = \{[\s\S]*layout: false,/)
    expect(catalogSource).not.toMatch(/const productListSelect = \{[^}]*gallery: false,/)
    expect(catalogSource).not.toMatch(/const productListSelect = \{[^}]*description: false,/)
    expect(catalogSource).toMatch(
      /const pageRank = Number\(hasProductPage\(b\)\) - Number\(hasProductPage\(a\)\)[\s\S]*?Number\(hasCardThumbnail\(b\)\)/,
    )
    expect(catalogSource).toMatch(/select: productListSelect,/)
    expect(catalogSource).toMatch(/function hasCardThumbnail\(product: Product\)/)
    expect(catalogSource).toMatch(/hasCardThumbnail\(product\) &&\s*matchesSearch/)
    expect(catalogSource).toMatch(
      /Number\(hasCardThumbnail\(b\)\) - Number\(hasCardThumbnail\(a\)\)/,
    )
    expect(catalogSource).toMatch(/return sortProductsForListing\(\s*docs\.filter\(/)
  })

  /*
   * The listing renders per request, for the page its address names -- that
   * is what gives every catalogue page a real address and real HTML -- from
   * one cached read of the collection, so a request costs filtering a cached
   * list, not a database query.
   *
   * /products/[slug] serves category pages too, and they read the query
   * string. A prerendered route cannot: in production Next refused the read
   * with DYNAMIC_SERVER_USAGE, and every category page was a 500 while dev
   * showed nothing. So the route renders per request, and must not come back
   * with generateStaticParams.
   */
  test('the listing and the slug route render per request from cached data', () => {
    expect(productsPageSource).not.toContain("dynamic = 'force-dynamic'")
    expect(productsPageSource).not.toContain('getProductFilters')
    expect(productsPageSource).toMatch(/getCatalogView\(\)/)
    expect(productsPageSource).toMatch(/props\.searchParams/)
    expect(productDetailPageSource).toMatch(/export const dynamic = 'force-dynamic'/)
    expect(productDetailPageSource).not.toMatch(/export (async )?function generateStaticParams/)
    expect(productDetailPageSource).toMatch(/if \(product && hasProductPage\(product\)\)/)
  })

  /*
   * What the product is made of, finished with, made by and used for. These
   * are relationships on the product that the page carried nowhere: a buyer
   * could read a size but not the material or the process.
   */
  test('surfaces materials, finishes, applications and processes', () => {
    render(
      <ProductDetail
        product={
          {
            ...fullProduct,
            applications: [{ id: 1, slug: 'ramp', title: 'Ramp operations' }],
            capabilities: [{ id: 2, slug: 'welding', title: 'Welding & Assembly' }],
            dimensions: { height: '2m', length: '3m', notes: null, width: '1m' },
            finishes: [{ id: 3, slug: 'powder', title: 'Powder coating' }],
            materials: [{ id: 4, slug: 'steel', title: 'Mild steel' }],
          } as unknown as Product
        }
        related={[]}
      />,
    )

    const block = document.querySelector('.pdp-attributes') as HTMLElement
    expect(
      Array.from(block.querySelectorAll('.pdp-attribute-title')).map((h) => h.textContent),
    ).toEqual(['Applications', 'Materials', 'Finishes', 'Manufacturing processes', 'Dimensions'])
    for (const label of ['Ramp operations', 'Mild steel', 'Powder coating', 'Welding & Assembly']) {
      expect(within(block).getByText(label), label).toBeTruthy()
    }
    expect(within(block).getByText('3m')).toBeTruthy()
  })

  /* A catalogue of seventy-five is not filled in evenly, so an empty group is
     dropped rather than rendered as a heading with nothing under it. */
  test('drops the attribute block entirely when the product carries none', () => {
    render(<ProductDetail product={fullProduct as unknown as Product} related={[]} />)

    expect(document.querySelector('.pdp-attributes')).toBeNull()
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
    render(<ProductDetail product={fullProduct} related={[relatedProduct, unfinishedProduct]} />)

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
    /*
     * A related product is a card for another product, so it carries that
     * product's card image, as every product card does -- the thumbnail, else
     * the featured image. (It once showed the featured image only; most
     * products have only a thumbnail, so the row came out as placeholders.)
     * The gallery rule above is separate and unchanged.
     */
    expect(within(related).getByAltText('Straight ladder card thumbnail')).toBeDefined()

    // A related product with no page of its own is shown, but leads nowhere.
    expect(screen.getByText('Cowl Pylon Ladders')).toBeDefined()
    expect(screen.queryByRole('link', { name: /Cowl Pylon Ladders/ })).toBeNull()
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

  /*
   * The related row reads the card image every other product card uses: the
   * thumbnail, else the featured image. It used to read the featured image
   * alone -- and most products carry only a thumbnail, so Folding Stand's
   * related row was five placeholders over products that all have renders.
   */
  test('shows each related product by its card image, thumbnail first', () => {
    const media = (url: string) => ({ alt: url, id: url.length, mimeType: 'image/png', url })
    render(
      <RelatedProducts
        products={
          [
            { id: 1, slug: 'b4', thumbnailImage: media('/b4-thumb.png'), title: 'B4' },
            {
              featuredImage: media('/b1-featured.png'),
              id: 2,
              slug: 'b1',
              thumbnailImage: media('/b1-thumb.png'),
              title: 'B1',
            },
            { featuredImage: media('/tail-featured.png'), id: 3, slug: 'tail', title: 'Tail Dock' },
          ] as unknown as Product[]
        }
      />,
    )

    const sources = Array.from(document.querySelectorAll('.pdp-related-media img')).map((img) =>
      decodeURIComponent(img.getAttribute('src') ?? ''),
    )
    // Only a thumbnail; both, with the thumbnail preferred; only a featured image.
    expect(sources[0]).toContain('/b4-thumb.png')
    expect(sources[1]).toContain('/b1-thumb.png')
    expect(sources[2]).toContain('/tail-featured.png')
    expect(document.querySelectorAll('.pdp-related-media img')).toHaveLength(3)
  })
})
