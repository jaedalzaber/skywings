import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

describe('HomeServicesScroller', () => {
  test('renders the service container directly after the hero with five service cards', () => {
    const heroOnlyLayout = defaultHomeLayout.filter((block) => block.blockType === 'homeHero')
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    const hero = container.querySelector('#top')
    const servicesSection = container.querySelector('.services-showcase')

    expect(hero?.nextElementSibling).toBe(servicesSection)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'What We Do',
      }),
    ).toBeTruthy()
    expect(screen.getByText('Our Services')).toBeTruthy()
    expect(screen.getAllByText('Custom Equipment Manufacturing')).toHaveLength(2)
    expect(screen.getByText('Structural Steel Fabrication')).toBeTruthy()
    expect(screen.getByText('Metal Product Fabrication')).toBeTruthy()
    expect(screen.getByText('Erection')).toBeTruthy()
    expect(container.querySelectorAll('.services-showcase-card')).toHaveLength(5)
  })
})
