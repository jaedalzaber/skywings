import { cleanup, render, within } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { pageBuilderBlocks } from '@/blocks'
import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import {
  defaultHomeEngineeringBlock,
  defaultHomeLayout,
  defaultHomeLocationsBlock,
  defaultHomeMachiningBlock,
  type HomeLayout,
} from '@/data/home'

/**
 * The machining, engineering and locations sections render from committed
 * defaults with no CMS block at all, and from the block once the home page
 * carries one. These cover the second path: content authored in the admin
 * reaching the page.
 */
function renderWith(...blocks: HomeLayout) {
  const authored = new Map(blocks.map((block) => [block.blockType, block]))
  const layout = defaultHomeLayout.map((block) => authored.get(block.blockType) ?? block)

  return render(<HomeBlockRenderer blocks={layout as HomeLayout} />)
}

describe('home section blocks', () => {
  afterEach(cleanup)

  test('registers all three in the page builder', () => {
    const slugs = pageBuilderBlocks.map((block) => block.slug)

    expect(slugs).toContain('homeMachining')
    expect(slugs).toContain('homeEngineering')
    expect(slugs).toContain('homeLocations')
  })

  test('carries the three blocks in the committed layout, in render order', () => {
    const order = defaultHomeLayout.map((block) => block.blockType)

    expect(order).toEqual([
      'homeHero',
      'homeServices',
      'homeIndustries',
      'homeMachining',
      'homeEngineering',
      'homeProcess',
      'homeLocations',
    ])
  })

  test('takes the machining heading, figures and machine groups from the block', () => {
    const { container } = renderWith({
      ...defaultHomeMachiningBlock,
      eyebrow: 'What we run',
      groups: [
        {
          id: 'press-brakes',
          images: [{ alt: 'Press brake', url: '/images/home/service-01.png' }],
          machines: ['PRESS BRAKE 200T'],
          title: 'Press braking',
        },
      ],
      heading: 'Shop\nfloor',
      stats: [{ label: 'Cells', value: '9' }],
    })
    const section = within(container.querySelector('#machining-capability') as HTMLElement)

    expect(section.getByRole('heading', { level: 2 }).textContent).toBe('Shop floor')
    expect(section.getByText('What we run')).toBeTruthy()
    expect(section.getByText('Cells')).toBeTruthy()
    expect(section.getByText('9')).toBeTruthy()
    expect(section.getByRole('heading', { level: 3, name: 'Press braking' })).toBeTruthy()
    expect(section.getByText('PRESS BRAKE 200T')).toBeTruthy()
  })

  test('takes the engineering disciplines and closing note from the block', () => {
    const { container } = renderWith({
      ...defaultHomeEngineeringBlock,
      code: '9.9',
      disciplines: [
        {
          eyebrow: 'Modelled to the millimetre',
          id: 'cad',
          items: ['Creo 11'],
          listLead: 'Systems in use:',
          paragraphs: ['One paragraph of authored copy.'],
          title: 'CAD',
        },
      ],
      heading: 'Design office',
      note: {
        items: ['Fit-up'],
        listLead: 'Checked for',
        paragraphs: ['Authored simulation note.'],
      },
    })
    const section = within(container.querySelector('#engineering') as HTMLElement)

    expect(section.getByRole('heading', { level: 2 }).textContent).toBe('Design office')
    expect(section.getByRole('heading', { level: 3, name: 'CAD' })).toBeTruthy()
    expect(section.getByText('Modelled to the millimetre')).toBeTruthy()
    expect(section.getByText('One paragraph of authored copy.')).toBeTruthy()
    expect(section.getByText('Systems in use:')).toBeTruthy()
    expect(section.getByText('Creo 11')).toBeTruthy()
    expect(section.getByText('Authored simulation note.')).toBeTruthy()
    expect(section.getByText('Fit-up')).toBeTruthy()
  })

  test('takes the locations headline and, when filled in, the facilities from the block', () => {
    const { container } = renderWith({
      ...defaultHomeLocationsBlock,
      locations: [
        {
          addressLines: ['Plot 4,', 'Hamriyah Free Zone,', 'Sharjah, UAE'],
          kind: 'Works',
          name: 'Hamriyah',
          phone: '+971 500 000 000',
        },
      ],
      title: {
        lead: 'Two plants, one team.',
        reach: 'Shipping worldwide.',
        regions: ['Gulf', 'Asia'],
      },
    })
    const section = within(container.querySelector('#locations') as HTMLElement)

    expect(section.getByRole('heading', { level: 2 }).textContent).toBe(
      'Two plants, one team.Shipping worldwide.',
    )
    expect(container.querySelector('.locations-reach')?.textContent).toBe('Gulf·Asia')
    expect(section.getByRole('heading', { level: 3, name: /Hamriyah/ })).toBeTruthy()
    expect(section.getByText('Works')).toBeTruthy()
    expect(section.getByText('Hamriyah Free Zone,')).toBeTruthy()
  })

  /*
   * Facilities stay on the Footer unless the block overrides them, so an empty
   * rows list has to leave the Footer addresses in place rather than blanking
   * the list.
   */
  test('leaves the Footer addresses in place when the block lists no facilities', () => {
    const { container } = render(
      <HomeBlockRenderer
        blocks={defaultHomeLayout}
        locations={{ addresses: [{ address: 'Plot 9014, Sajaa Industrial Area, Sharjah, UAE', phone: '+971 1' }] }}
      />,
    )
    const section = within(container.querySelector('#locations') as HTMLElement)

    expect(section.getByText('Plot 9014,')).toBeTruthy()
    expect(section.getByText('+971 1')).toBeTruthy()
  })
})
