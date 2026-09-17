import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

// The drag engine is GSAP; the filtering under test does not need it.
vi.mock('@/components/industry/useDraggableRail', () => ({
  useDraggableRail: () => ({
    edges: { atEnd: false, atStart: true },
    progress: 0,
    step: vi.fn(),
    trackRef: { current: null },
    viewportRef: { current: null },
  }),
}))

import { ProductGallery, type GalleryProduct } from '@/components/industry/ProductGallery'

const product = (id: string, title: string, familyId: string): GalleryProduct => ({
  familyId,
  featured: false,
  hasPage: false,
  id,
  image: null,
  slug: id,
  summary: `${title} summary`,
  title,
})

const products = [
  product('a', 'Structural Frame', 'steel'),
  product('b', 'Maintenance Platform', 'access'),
  product('c', 'Emergency Staircase', 'access'),
  product('d', 'Handrail', 'tubes'),
]

const filters = [
  { familyId: 'steel', id: 'f-steel', label: 'Structural Steel' },
  { familyId: 'access', id: 'f-access', label: 'Access Platforms' },
  { familyId: 'tubes', id: 'f-tubes', label: 'Tubular Products' },
]

const titles = () =>
  Array.from(document.querySelectorAll('.industry-gallery-card-title')).map((el) => el.textContent)

afterEach(cleanup)

describe('industry product gallery', () => {
  test('narrows the rail to one family, and All brings every card back', () => {
    render(<ProductGallery browse={null} filters={filters} products={products} />)
    const group = screen.getByRole('group', { name: 'Filter products' })

    expect(titles()).toEqual(['Structural Frame', 'Maintenance Platform', 'Emergency Staircase', 'Handrail'])

    act(() => fireEvent.click(within(group).getByRole('button', { name: 'Access Platforms' })))
    expect(titles()).toEqual(['Maintenance Platform', 'Emergency Staircase'])
    expect(within(group).getByRole('button', { name: 'Access Platforms' }).getAttribute('aria-pressed')).toBe('true')

    act(() => fireEvent.click(within(group).getByRole('button', { name: 'All' })))
    expect(titles()).toHaveLength(4)
  })

  /*
   * The regression: the viewport reveal fires once, so a rail swapped in by
   * a filter mounted its cards at the hidden starting state and left them
   * there. Each filter's rail now plays its own entrance, driven by whether
   * the section has been revealed rather than by the one-shot viewport event.
   */
  test('gives every filter its own rail entrance instead of the one-shot viewport reveal', () => {
    render(<ProductGallery browse={null} filters={filters} products={products} />)
    const firstRail = document.querySelector('.industry-gallery-rail')

    act(() =>
      fireEvent.click(
        within(screen.getByRole('group', { name: 'Filter products' })).getByRole('button', {
          name: 'Tubular Products',
        }),
      ),
    )

    // A new rail element, so it runs its own entrance.
    expect(document.querySelector('.industry-gallery-rail')).not.toBe(firstRail)
    expect(titles()).toEqual(['Handrail'])
  })

  test('says so when a family has no products', () => {
    render(
      <ProductGallery
        browse={null}
        filters={[...filters, { familyId: 'empty', id: 'f-empty', label: 'Empty' }]}
        products={products}
      />,
    )

    act(() =>
      fireEvent.click(
        within(screen.getByRole('group', { name: 'Filter products' })).getByRole('button', { name: 'Empty' }),
      ),
    )
    expect(screen.getByText('No products in this category yet.')).toBeTruthy()
  })
})
