import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { ProductDetail } from '@/components/collections/product/ProductDetail'
import type { Media, Product } from '@/payload-types'

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
  gallery: [{ id: 'g1', image: media({ id: 2, url: '/images/products/thumb-2.png' }) }],
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
  brochures: [{ id: 5, title: 'Spec sheet', slug: 'spec', url: '/brochures/spec.pdf' } as never],
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
} as unknown as Product

describe('ProductDetail', () => {
  afterEach(cleanup)

  test('renders every populated section from the product', () => {
    render(<ProductDetail product={fullProduct} related={[relatedProduct]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Folding Stand' })).toBeDefined()
    expect(screen.getByText('Aviation / GSE / Stands')).toBeDefined()
    expect(screen.getByText('Industry: Aviation GSE')).toBeDefined()
    expect(screen.getByText('Category: Maintenance & Stand')).toBeDefined()
    expect(screen.getByText('Type:')).toBeDefined()
    expect(screen.getByText('ID: GSE-FS-038')).toBeDefined()

    // Spec + accessories tables
    expect(screen.getByText('Specification')).toBeDefined()
    expect(screen.getByText('700 kg')).toBeDefined()
    expect(screen.getByText('Accessories')).toBeDefined()
    expect(screen.getByText('2 Persons')).toBeDefined()

    // Technical drawing + brochure
    expect(screen.getByText('Technical Drawing')).toBeDefined()
    const brochure = screen.getByText('Download Brochure').closest('a')
    expect(brochure?.getAttribute('href')).toBe('/brochures/spec.pdf')

    // Configurator (scope to the option-group legend — "Material" also appears
    // as a specification row label).
    expect(screen.getByText('Material', { selector: '.pdp-option-label' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Steel' })).toBeDefined()
    const cta = screen.getByRole('link', { name: 'Add to Quote' })
    expect(cta.getAttribute('href')).toBe('/contact?product=folding-stand')

    // Related
    const related = screen.getByRole('link', { name: /Straight Ladders/ })
    expect(related.getAttribute('href')).toBe('/products/straight-ladders')
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
})
