import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { ProductThumbnailCell } from '@/components/admin/ProductThumbnailCell'

// The component pulls in its own admin stylesheet, which vitest cannot parse.
vi.mock('@/components/admin/ProductThumbnailCell.scss', () => ({}))

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

/*
 * Seventy-five rows of "GSE-PMC-P6-052" are hard to tell apart by name alone,
 * so the Products list leads with the product's own card image.
 */
describe('product thumbnail cell', () => {
  afterEach(cleanup)

  test('shows the card image, preferring the thumbnail over the featured image', () => {
    const { container } = render(
      <ProductThumbnailCell
        rowData={{
          featuredImage: { url: '/api/media/file/featured.png' },
          thumbnailImage: { url: '/api/media/file/thumb.png' },
        }}
      />,
    )

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/media/file/thumb.png')
    // Decorative beside the title it sits next to.
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  test('falls back to the featured image, then to a placeholder', () => {
    const { container: featured } = render(
      <ProductThumbnailCell rowData={{ featuredImage: { url: '/api/media/file/featured.png' } }} />,
    )
    expect(featured.querySelector('img')?.getAttribute('src')).toBe('/api/media/file/featured.png')

    cleanup()

    // A row with neither gets a placeholder rather than a gap -- which also
    // makes the products still missing photography visible at a glance.
    const { container: empty } = render(<ProductThumbnailCell rowData={{}} />)
    expect(empty.querySelector('img')).toBeNull()
    expect(empty.querySelector('.product-thumb--empty')).not.toBeNull()
    expect(empty.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  test('survives a row whose relationship came back as a bare id', () => {
    const { container } = render(<ProductThumbnailCell rowData={{ thumbnailImage: 42 }} />)

    expect(container.querySelector('.product-thumb--empty')).not.toBeNull()
  })

  test('leads the Products list, and is registered for the admin to find', () => {
    const products = read('src/collections/Products.ts')
    const importMap = read('src/app/(payload)/admin/importMap.js')
    const path = '/components/admin/ProductThumbnailCell#ProductThumbnailCell'

    expect(products).toMatch(/defaultColumns: \['cardPreview', 'title', 'sku'/)
    expect(products).toMatch(
      new RegExp(`name: 'cardPreview',[\\s\\S]*?Cell: '${path.replace(/[/#]/g, '\\$&')}'`),
    )
    // A component the import map does not carry silently renders as nothing.
    expect(importMap).toContain(path)
  })
})
