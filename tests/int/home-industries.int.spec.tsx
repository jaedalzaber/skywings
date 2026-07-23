import { render, screen, within } from '@testing-library/react'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { IndustryProductRail } from '@/components/home/IndustryProductRail'
import { defaultHomeLayout } from '@/data/home'

vi.mock('@/components/home/HomeProcessModel', () => ({
  HomeProcessModel: () => <div data-testid="process-model-canvas" />,
}))

vi.mock('@/components/home/HomeGlobeScene', () => ({
  HomeGlobeScene: () => <div data-testid="globe-scene-fallback" />,
}))

const homeSourcePath = resolve(process.cwd(), 'src/data/home.ts')
const homeSource = existsSync(homeSourcePath) ? readFileSync(homeSourcePath, 'utf8') : ''

describe('HomeIndustriesAccordion', () => {
  test('renders the industries accordion directly after the services section with six cards', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    const servicesSection = container.querySelector('.services-showcase')
    const industriesSection = container.querySelector('#industries')
    const industriesQueries = within(industriesSection as HTMLElement)

    expect(servicesSection?.nextElementSibling).toBe(industriesSection)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Metalwork built around your industry requirements.',
      }),
    ).toBeTruthy()
    expect(industriesQueries.getByText('Industries we serve')).toBeTruthy()
    expect(industriesQueries.getByText('Construction & Infrastructure')).toBeTruthy()
    expect(industriesQueries.getByText('01')).toBeTruthy()
    expect(industriesQueries.getByText('Architectural & Interior Metalwork')).toBeTruthy()
    expect(industriesQueries.getByText('Marine & Offshore')).toBeTruthy()
    expect(
      industriesQueries.getAllByRole('link', { name: 'Browse Related Products' }),
    ).toHaveLength(6)
    expect(
      industriesQueries
        .getAllByRole('link', { name: 'Browse Related Products' })[0]
        ?.getAttribute('href'),
    ).toBe('#products')
    expect(container.querySelector('#products')).not.toBeNull()
    expect(container.querySelectorAll('.industries-showcase-card')).toHaveLength(6)
  })

  test('uses product card thumbnails in industry product cards', () => {
    expect(homeSource).toMatch(
      /getMediaImage\(product\.thumbnailImage\)\s*\?\?\s*getMediaImage\(product\.featuredImage\)/,
    )
  })

  test('supports up to twelve CMS products and activates motion only above three', () => {
    const products = Array.from({ length: 4 }, (_, index) => ({
      id: index + 1,
      image: null,
      slug: `product-${index + 1}`,
      summary: '',
      title: `Product ${index + 1}`,
    }))
    const { container } = render(<IndustryProductRail ctaHref="/products" products={products} />)
    const rail = container.querySelector('.industries-showcase-product-grid')
    const sets = container.querySelectorAll('.industries-showcase-product-set')

    expect(homeSource).toMatch(/limit:\s*12/)
    expect(homeSource).toMatch(/getCuratedProductsById\(relatedProductIds\)/)
    expect(homeSource).toMatch(/in:\s*numericProductIds/)
    expect(rail?.getAttribute('data-moving')).toBe('true')
    expect(sets).toHaveLength(2)
    expect(sets[1]?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelectorAll('.industries-showcase-product-card')).toHaveLength(8)
  })

  test('keeps three-product rails static without duplicate content', () => {
    const products = Array.from({ length: 3 }, (_, index) => ({
      id: index + 1,
      image: null,
      slug: `product-${index + 1}`,
      summary: '',
      title: `Product ${index + 1}`,
    }))
    const { container } = render(<IndustryProductRail ctaHref="/products" products={products} />)

    expect(
      container.querySelector('.industries-showcase-product-grid')?.getAttribute('data-moving'),
    ).toBeNull()
    expect(container.querySelectorAll('.industries-showcase-product-set')).toHaveLength(1)
  })
})
