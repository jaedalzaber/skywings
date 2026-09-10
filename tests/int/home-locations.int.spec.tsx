import { cleanup, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'
import {
  defaultLocations,
  defaultLocationsImage,
  splitAddress,
} from '@/data/homeLocationsDefaults'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const stylesheet = read('src/app/(frontend)/styles.css')
const component = read('src/components/home/HomeLocationsSection.tsx')

const SCENE_MEDIA = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)'
const sceneStart = stylesheet.indexOf(`@media ${SCENE_MEDIA}`, stylesheet.indexOf('.locations {'))
const base = stylesheet.slice(stylesheet.indexOf('.locations {'), sceneStart)
const scene = stylesheet.slice(sceneStart, stylesheet.indexOf('.page-hero,', sceneStart))

function renderLocations(locations?: Parameters<typeof HomeBlockRenderer>[0]['locations']) {
  const { container } = render(<HomeBlockRenderer blocks={defaultHomeLayout} locations={locations} />)
  const section = container.querySelector('#locations') as HTMLElement

  return { container, section, queries: within(section) }
}

describe('HomeLocationsSection', () => {
  afterEach(cleanup)

  test('follows the process section: image left, copy right, on a white surface', () => {
    const { container, section } = renderLocations()

    expect(container.querySelector('#manufacturing-process')?.nextElementSibling).toBe(section)
    // Last of the home sections.
    expect(section.nextElementSibling).toBeNull()
    expect(section.getAttribute('data-nav-surface')).toBe('white')
    expect(section.getAttribute('data-scroll-scene')).toBe('locations')
    const grid = section.querySelector('.locations-grid') as HTMLElement
    expect(grid.children[0].classList.contains('locations-media')).toBe(true)
    expect(grid.children[1].classList.contains('locations-copy')).toBe(true)
    expect(base).toMatch(/\.locations \{[^}]*background:\s*#ffffff;/s)
    // No cards, shadows or frosted panels anywhere in the section.
    expect(base + scene).not.toMatch(/box-shadow|backdrop-filter/)
  })

  test('sets the headline in two lines with the reach line under it', () => {
    const { queries, section } = renderLocations()

    const heading = queries.getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe('UAE manufacturing presence.Regional and international reach.')
    const lines = section.querySelectorAll('.locations-title-line')
    expect(lines).toHaveLength(2)
    expect(lines[1].classList.contains('locations-title-line--light')).toBe(true)
    expect(section.querySelector('.locations-reach')?.textContent).toBe('Middle East·Europe·Africa')
    expect(base).toMatch(/\.locations-reach \{[^}]*color:\s*var\(--blue\);[^}]*text-transform:\s*uppercase;/s)
  })

  test('lists Sharjah then Thoban, each under a thin blue rule, from the defaults', () => {
    const { queries, section } = renderLocations()
    const items = Array.from(section.querySelectorAll('.locations-item'))

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.getAttribute('data-location'))).toEqual(['1', '2'])
    for (const [index, item] of items.entries()) {
      const expected = defaultLocations[index]
      expect(item.querySelector('.locations-name strong')?.textContent).toBe(expected.name)
      expect(item.querySelector('.locations-name span')?.textContent).toBe(expected.kind)
      // Name and rule share one box, so the rule ends where the name ends.
      const head = item.firstElementChild as HTMLElement
      expect(head.className).toBe('locations-item-head')
      expect(head.children[0].className).toBe('locations-name')
      expect(head.children[1].className).toBe('locations-rule')
      expect(item.querySelector('.locations-address')?.textContent).toBe(expected.addressLines.join(''))
      expect(item.querySelectorAll('.locations-address br')).toHaveLength(expected.addressLines.length - 1)
    }
    expect(defaultLocations[0].addressLines).toEqual([
      'A2, Plot No. 10576015-3,',
      'Sajaa Industrial Area,',
      'Sharjah, UAE',
    ])
    expect(queries.getByRole('link', { name: '+971 509 469 979' }).getAttribute('href')).toBe(
      'tel:+971509469979',
    )
    expect(queries.getByRole('link', { name: '+971 505 389 979' }).getAttribute('href')).toBe(
      'tel:+971505389979',
    )
    expect(base).toMatch(/\.locations-rule \{[^}]*height:\s*1px;[^}]*background:\s*var\(--blue\);/s)
    // It runs back across the facility's indent to the copy column's edge.
    expect(base).toMatch(/\.locations-rule \{[^}]*margin:[^;]*calc\(-1 \* var\(--locations-indent\)\);/s)
    expect(base).toMatch(/\.locations-item-head \{\s*width:\s*max-content;/s)
  })

  test('takes address, phone and photograph from the footer, keeping the names', () => {
    const { queries, section } = renderLocations({
      addresses: [
        { address: 'Unit 4, Somewhere Industrial Area, Sharjah', phone: '+971 500 000 001' },
        { address: 'Plot 9, Elsewhere, Fujairah', phone: '+971 500 000 002' },
      ],
      image: { alt: 'Uploaded aerial', url: '/api/media/file/aerial.jpg' },
    })

    const items = Array.from(section.querySelectorAll('.locations-item'))
    expect(items[0].querySelector('strong')?.textContent).toBe('Sharjah')
    // "Unit 4" is too short for a line of its own; it stays with the street.
    expect(items[0].querySelector('.locations-address')?.textContent).toBe(
      'Unit 4, Somewhere Industrial Area,Sharjah',
    )
    expect(items[1].querySelector('strong')?.textContent).toBe('Thoban')
    expect(queries.getByRole('link', { name: '+971 500 000 002' }).getAttribute('href')).toBe(
      'tel:+971500000002',
    )
    expect(queries.getByAltText('Uploaded aerial').getAttribute('src')).toBe('/api/media/file/aerial.jpg')
    // The footer's real addresses set as the three lines the design calls for.
    expect(splitAddress('A2, Plot No. 10576 015-3, Sajja Industrial Area, Sharjah, UAE')).toEqual([
      'A2, Plot No. 10576 015-3,',
      'Sajja Industrial Area,',
      'Sharjah, UAE',
    ])
    expect(splitAddress('Plot No. D-81, Thoban Industrial Area, Fujairah, UAE')).toEqual([
      'Plot No. D-81,',
      'Thoban Industrial Area,',
      'Fujairah, UAE',
    ])
    expect(splitAddress('A, B, C')).toEqual(['A, B, C'])
  })

  test('falls back to the committed photograph until one is uploaded', () => {
    const { queries } = renderLocations()

    expect(queries.getByAltText(defaultLocationsImage.alt).getAttribute('src')).toBe(
      defaultLocationsImage.url,
    )
  })

  test('sets the oversized country mark over the foot of the photograph', () => {
    const { section } = renderLocations()
    const mark = section.querySelector('.locations-media-mark') as HTMLElement

    expect(mark.textContent).toBe('UAE')
    expect(mark.getAttribute('aria-hidden')).toBe('true')
    expect(mark.parentElement?.className).toBe('locations-media-frame')
    expect(base).toMatch(/\.locations-media-mark \{[^}]*bottom:\s*-0\.06em;[^}]*left:\s*-0\.04em;[^}]*font-size:\s*clamp\(5rem, 11vw, 11rem\);/s)
  })

  /*
   * The scroll contract: no pin and no wheel handling anywhere -- the image
   * is CSS-sticky and every movement is a scrubbed tween on page scroll, so
   * the next section can rise in naturally and scrolling up reverses it.
   */
  test('holds the image with sticky positioning and scrubs the reveals from page scroll', () => {
    expect(component).toMatch(/import\('gsap\/ScrollTrigger'\)/)
    expect(component).not.toMatch(/\bpin[:,]|pinSpacing|pinType/)
    expect(component).not.toMatch(/addEventListener\(\s*['"]wheel['"]/)
    expect(component).not.toMatch(/setInterval|autoplay|preventDefault/)
    expect(component).toContain(`'${SCENE_MEDIA}'`)
    expect(component).toMatch(/onFirstMediaMatch\(LOCATIONS_SCENE_MEDIA/)
    // Entrance: image into place and headline up, while the section rises.
    expect(component).toMatch(/start: 'top 88%',\s*trigger: section,/)
    expect(component).toMatch(/entrance\.fromTo\(\s*media,\s*\{ opacity: 0, y: 32 \}/)
    expect(component).toMatch(/\{ opacity: 0, y: 26 \}/)
    // Subtle drift on the photograph across the whole section.
    expect(component).toMatch(/\{ yPercent: -4 \}/)
    expect(component).toMatch(/yPercent: 4,/)
    // Each facility in turn: rule out, then name and address up.
    // Short, and finished high enough that a facility is formed by the lock.
    expect(component).toMatch(/end: 'top 74%',[\s\S]*?start: 'top 92%',\s*trigger: item,/)
    expect(component).toMatch(/\{ scaleX: 0 \}/)
    expect(component).toMatch(/'\.locations-name, \.locations-detail'/)
    expect(component).toMatch(/context\.revert\(\)/)

    /*
     * Bottom-anchored, not top: the image rises in with the section, holds
     * with its lower edge one --locations-bottom-pad above the foot of the
     * viewport, then lifts away with the section. Its height is what is left
     * of the viewport between the bar and that gap, so nothing is cut off.
     */
    expect(scene).toMatch(
      /\.locations-media \{[^}]*align-self:\s*end;\s*position:\s*sticky;\s*bottom:\s*var\(--locations-bottom-pad\);/s,
    )
    // A bottom-offset sticky box is only pulled up towards the foot of the
    // viewport when it rests below it, so resting at the foot is required.
    expect(scene).not.toMatch(/\.locations-media \{[^}]*[^-]top:/s)
    expect(base).toMatch(/--locations-bottom-pad:\s*1\.5rem;/)
    expect(scene).toMatch(
      /\.locations-media-frame \{\s*height:\s*calc\(\s*100svh - var\(--header-height\) - var\(--locations-bottom-pad\) - var\(--locations-pad\)\s*\);/s,
    )
    expect(scene).toMatch(/\.locations-grid \{[^}]*grid-template-columns:\s*var\(--locations-media-col\) minmax\(0, 1fr\);/s)
    expect(base).toMatch(/--locations-media-col:\s*minmax\(0, 33%\);/)
  })

  /*
   * The scroll budget. The column is taller than the image by exactly the
   * stretch the image spends held at the foot of the viewport -- 18svh, not
   * the screens of white the min-height bands used to buy. The groups are
   * spaced by ordinary gaps, so the headline, Sharjah and Thoban all reveal
   * within roughly one viewport of scrolling and end as the static layout.
   */
  test('keeps the whole story inside a compact scroll', () => {
    expect(scene).toMatch(/\.locations-grid \{[^}]*min-height:\s*118svh;/s)
    expect(scene).toMatch(/\.locations-copy \{\s*gap:\s*clamp\(2rem, 12svh, 6\.5rem\);/s)
    expect(scene).toMatch(/\.locations-list \{\s*gap:\s*clamp\(2rem, 14svh, 7\.5rem\);/s)
    // Short desktops bring the whole set down a step so it still lands in one screen.
    expect(stylesheet).toMatch(
      /@media \(min-width: 64rem\) and \(max-height: 46rem\) and \(prefers-reduced-motion: no-preference\) \{[^@]*\.locations-title \{/s,
    )
    // No band-sized min-heights or spacers standing in for content.
    expect(scene).not.toMatch(/min-height:\s*\d+svh;[^}]*\}\s*\.locations-item/s)
    expect(scene).not.toMatch(/\.locations-head \{/)
    expect(scene).not.toMatch(/\.locations-item \{[^}]*min-height/s)
    expect(scene).not.toMatch(/\.locations-item:last-child/)
    // The facilities step down and to the right, the second further in.
    expect(scene).toMatch(/\.locations-item\[data-location='1'\] \{\s*--locations-indent:\s*clamp\(/s)
    expect(scene).toMatch(/\.locations-item\[data-location='2'\] \{\s*--locations-indent:\s*clamp\(/s)
  })

  test('stacks plainly on phones and under reduced motion', () => {
    expect(base).toMatch(/\.locations-grid \{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/s)
    expect(base).toMatch(/\.locations-media-frame \{[^}]*height:\s*clamp\(22rem, 70svh, 36rem\);/s)
    expect(base).not.toMatch(/position:\s*sticky/)
    // No indent, so each rule simply underlines its own name.
    expect(base).toMatch(/\.locations \{[^}]*--locations-indent:\s*0px;/s)
    expect(base).toMatch(/\.locations-item \{\s*padding-left:\s*var\(--locations-indent\);\s*\}/s)
  })

  test('shares the header-condense refresh and imports nothing but types from the server data layer', () => {
    expect(component).toMatch(/import \{ onFirstMediaMatch, watchHeaderCondense \} from '\.\/scrollTriggerRefresh'/)
    expect(component).toMatch(/watchHeaderCondense\(ScrollTrigger\)/)
    const valueImports = component.match(/^import\s+(?!type\s)[^\n]*from '@\/data\/(home|site)'/gm) ?? []
    expect(valueImports).toEqual([])
  })
})
