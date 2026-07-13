import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'

describe('HomeHero', () => {
  test('renders a full-screen hero container with a video-ready background layer', () => {
    const heroOnlyLayout = defaultHomeLayout.filter((block) => block.blockType === 'homeHero')
    const { container } = render(<HomeBlockRenderer blocks={heroOnlyLayout} />)

    const hero = container.querySelector('#top')

    expect(hero?.classList.contains('hero-section')).toBe(true)
    expect(hero?.classList.contains('hero-container')).toBe(true)
    expect(hero?.querySelector('.hero-video-layer')).not.toBeNull()
    expect(hero?.querySelector('.hero-content-band')).not.toBeNull()
    expect(hero?.querySelector('.hero-services-marquee')).not.toBeNull()
    expect(hero?.querySelectorAll('.hero-services-track')).toHaveLength(2)
    expect(screen.getAllByText('Construction & Infrastructure')).toHaveLength(2)
    expect(screen.getAllByText('Aviation Ground Support Equipment')).toHaveLength(2)
    expect(hero?.querySelector('.wireframe-board')).toBeNull()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'From drawing, sample, or problem to manufactured product.',
      }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Request Quote' }).getAttribute('href')).toBe(
      '/contact',
    )
  })
})
