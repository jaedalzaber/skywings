import { render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

vi.mock('@/components/home/HomeProcessModel', () => ({
  HomeProcessModel: () => <div data-testid="process-model-canvas" />,
}))

vi.mock('@/components/home/HomeGlobeScene', () => ({
  HomeGlobeScene: () => <div data-testid="globe-scene-fallback" />,
}))

describe('HomeIndustriesAccordion', () => {
  test('renders the industries accordion directly after the services section with six cards', () => {
    const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} />)

    const servicesSection = container.querySelector('.services-showcase')
    const industriesSection = container.querySelector('#industries')
    const industriesQueries = within(industriesSection as HTMLElement)

    expect(servicesSection?.nextElementSibling).toBe(industriesSection)
    expect(screen.getByRole('heading', { level: 2, name: 'Metalwork Solutions Across Every Industries' })).toBeTruthy()
    expect(industriesQueries.getByText('Industries We Serve')).toBeTruthy()
    expect(industriesQueries.getByText('Construction & Infrastructure')).toBeTruthy()
    expect(industriesQueries.getByText('Architectural & Interior Metalwork')).toBeTruthy()
    expect(industriesQueries.getByText('Marine & Offshore')).toBeTruthy()
    expect(industriesQueries.getAllByRole('link', { name: 'Browse Related Products' })).toHaveLength(6)
    expect(industriesQueries.getAllByRole('link', { name: 'Browse Related Products' })[0]?.getAttribute('href')).toBe(
      '#products',
    )
    expect(container.querySelectorAll('.industries-showcase-card')).toHaveLength(6)
  })
})
