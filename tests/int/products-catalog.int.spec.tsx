import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { ProductsCatalog } from '@/components/collections/catalog/ProductsCatalog'
import type { ProductLite } from '@/components/collections/catalog/ProductShopCard'

const products: ProductLite[] = [
  {
    id: 1,
    image: { alt: 'Tow tractor thumbnail', url: '/tow-tractor.png' },
    industrySlugs: ['aviation'],
    number: 1,
    sku: 'GSE-TOW-01',
    slug: 'tow-tractor',
    summary: 'Aircraft movement and towing equipment.',
    title: 'Tow Tractor',
  },
  {
    id: 2,
    image: { alt: 'Pipe rack thumbnail', url: '/pipe-rack.png' },
    industrySlugs: ['construction'],
    number: 2,
    sku: 'PIPE-RACK-02',
    slug: 'pipe-rack',
    summary: 'Custom fabricated storage rack.',
    title: 'Pipe Rack',
  },
]

describe('ProductsCatalog', () => {
  afterEach(cleanup)

  test('filters products with an autosuggest search field', () => {
    render(
      <ProductsCatalog
        heading="Product Database"
        industries={[
          { slug: 'aviation', title: 'Aviation' },
          { slug: 'construction', title: 'Construction' },
        ]}
        products={products}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Tow Tractor' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Pipe Rack' })).toBeDefined()

    const search = screen.getByLabelText('Search products')
    fireEvent.change(search, { target: { value: 'tow' } })

    const suggestions = screen.getByRole('listbox')
    expect(within(suggestions).getByRole('option', { name: /Tow Tractor/ })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Tow Tractor' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Pipe Rack' })).toBeNull()

    fireEvent.click(within(suggestions).getByRole('option', { name: /Tow Tractor/ }))

    expect((search as HTMLInputElement).value).toBe('Tow Tractor')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Tow Tractor' })).toBeDefined()
  })

  test('combines search suggestions with the selected industry filter', () => {
    render(
      <ProductsCatalog
        heading="Product Database"
        industries={[
          { slug: 'aviation', title: 'Aviation' },
          { slug: 'construction', title: 'Construction' },
        ]}
        products={products}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Construction' }))
    fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'tow' } })

    expect(screen.queryByRole('heading', { name: 'Tow Tractor' })).toBeNull()
    expect(screen.getByText('No products match this search yet.')).toBeDefined()
  })
})
