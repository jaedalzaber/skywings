import { cleanup, render, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'

import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { defaultHomeLayout } from '@/data/home'
import { defaultLocations, splitAddress } from '@/data/homeLocationsDefaults'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
const stylesheet = read('src/app/(frontend)/styles.css')
const component = read('src/components/home/HomeLocationsSection.tsx')

// The section's own rules: from its block comment to the next section's.
const css = stylesheet.slice(
  stylesheet.indexOf('.locations {'),
  stylesheet.indexOf('.page-hero,', stylesheet.indexOf('.locations {')),
)
const wide = css.slice(css.indexOf('@media (min-width: 64rem)'))

function renderLocations(locations?: Parameters<typeof HomeBlockRenderer>[0]['locations']) {
  const { container } = render(
    <HomeBlockRenderer blocks={defaultHomeLayout} locations={locations} />,
  )
  const section = container.querySelector('#locations') as HTMLElement

  return { container, section, queries: within(section) }
}

/*
 * The close of the home page: a portrait aerial with "UAE" across its foot,
 * and beside it "We deliver all over Middle-East, Europe & Africa" over the
 * two branches, stepping down and to the right under blue rules.
 */
describe('HomeLocationsSection', () => {
  afterEach(cleanup)

  test('follows the process section: picture left, copy right, on white', () => {
    const { container, section } = renderLocations()

    expect(container.querySelector('#manufacturing-process')?.nextElementSibling).toBe(section)
    expect(section.nextElementSibling).toBeNull()
    expect(section.getAttribute('data-nav-surface')).toBe('white')
    const grid = section.querySelector('.locations-grid') as HTMLElement
    expect(grid.children[0].classList.contains('locations-media')).toBe(true)
    expect(grid.children[1].classList.contains('locations-copy')).toBe(true)
    expect(css).toMatch(/\.locations \{[^}]*background:\s*#ffffff;/s)
    expect(wide).toMatch(
      /\.locations-grid \{[^}]*grid-template-columns:\s*minmax\(0, 31%\) minmax\(0, 1fr\);/s,
    )
    // Portrait, and the copy runs the picture's full height: reach at the top,
    // branches settled at the foot.
    expect(wide).toMatch(/\.locations-media \{\s*aspect-ratio:\s*4 \/ 7;/s)
    expect(wide).toMatch(/\.locations-copy \{[^}]*justify-content:\s*space-between;/s)
    expect(css).not.toMatch(/box-shadow|backdrop-filter|position:\s*sticky/)
  })

  test('sets the lead light and the regions heavy, joined as a list', () => {
    const { queries, section } = renderLocations()

    const heading = queries.getByRole('heading', { level: 2 })
    expect(heading.textContent).toBe('We deliver all over Middle-East, Europe & Africa')
    expect(section.querySelector('.locations-title-lead')?.textContent).toBe('We deliver all over')
    expect(section.querySelector('.locations-title-regions')?.textContent).toBe(
      'Middle-East, Europe & Africa',
    )
    expect(section.querySelector('.locations-title-amp')?.textContent).toBe('&')
    expect(css).toMatch(
      /\.locations-title \{[^}]*font-weight:\s*800;[^}]*text-transform:\s*uppercase;/s,
    )
    expect(css).toMatch(/\.locations-title-lead,\s*\.locations-title-amp \{\s*font-weight:\s*300;/s)
  })

  test('lists Sharjah then Thoban, each under a blue rule the width of its name', () => {
    const { queries, section } = renderLocations()
    const items = Array.from(section.querySelectorAll('.locations-item'))

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.getAttribute('data-location'))).toEqual(['1', '2'])
    for (const [index, item] of items.entries()) {
      const expected = defaultLocations[index]
      expect(item.querySelector('.locations-name strong')?.textContent).toBe(expected.name)
      expect(item.querySelector('.locations-name span')?.textContent).toBe(expected.kind)
      const head = item.firstElementChild as HTMLElement
      expect(head.className).toBe('locations-item-head')
      expect(head.children[0].className).toBe('locations-name')
      expect(head.children[1].className).toBe('locations-rule')
      // One run of copy, wrapped by the measure rather than at each comma.
      expect(item.querySelector('.locations-address')?.textContent).toBe(
        expected.addressLines.join(' '),
      )
    }
    expect(queries.getByRole('link', { name: '+971 509 469 979' }).getAttribute('href')).toBe(
      'tel:+971509469979',
    )
    expect(queries.getByRole('link', { name: '+971 505 389 979' }).getAttribute('href')).toBe(
      'tel:+971505389979',
    )
    expect(css).toMatch(/\.locations-rule \{[^}]*height:\s*2px;[^}]*background:\s*var\(--blue\);/s)
    // The rule runs back across the branch's indent to the copy column's edge.
    expect(css).toMatch(
      /\.locations-rule \{[^}]*margin:[^;]*calc\(-1 \* var\(--locations-indent\)\);/s,
    )
    expect(css).toMatch(/\.locations-item-head \{\s*width:\s*max-content;/s)
    expect(css).toMatch(/\.locations-address \{[^}]*max-width:\s*31ch;/s)
  })

  /*
   * The indents are lengths, not percentages: the rule's negative margin has
   * to resolve against the column, not against the name box it sits in,
   * which a percentage would. Viewport units rather than container units --
   * the process section's accordion keeps container sizing out of the sheet.
   */
  test('steps the branches down and to the right of the copy column', () => {
    expect(wide).toMatch(
      /\.locations-item\[data-location='1'\] \{\s*--locations-indent:\s*min\(13vw, 10rem\);/s,
    )
    expect(wide).toMatch(
      /\.locations-item\[data-location='2'\] \{\s*--locations-indent:\s*min\(36\.5vw, 28rem\);/s,
    )
    expect(css).not.toMatch(/cqi|container-type/)
    // Phones stack plainly: no indent, so each rule underlines its own name.
    expect(css).toMatch(/\.locations \{[^}]*--locations-indent:\s*0px;/s)
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
    expect(items[0].querySelector('.locations-address')?.textContent).toBe(
      'Unit 4, Somewhere Industrial Area, Sharjah',
    )
    expect(items[1].querySelector('strong')?.textContent).toBe('Thoban')
    expect(queries.getByRole('link', { name: '+971 500 000 002' }).getAttribute('href')).toBe(
      'tel:+971500000002',
    )
    expect(queries.getByAltText('Uploaded aerial').getAttribute('src')).toBe(
      '/api/media/file/aerial.jpg',
    )
    expect(splitAddress('Plot No. D-81, Thoban Industrial Area, Fujairah, UAE')).toEqual([
      'Plot No. D-81,',
      'Thoban Industrial Area,',
      'Fujairah, UAE',
    ])
  })

  /*
   * No photograph uploaded: no <img> pointing at a file that is not there. The
   * frame's own sky-toned ground carries the white mark until one arrives.
   */
  test('holds the frame on its own ground until a photograph is uploaded', () => {
    const { section } = renderLocations()

    expect(section.querySelector('.locations-media img')).toBeNull()
    expect(css).toMatch(/\.locations-media-frame \{[^}]*background:\s*linear-gradient\(/s)
  })

  test('draws the UAE mark across the foot of the picture', () => {
    const { section } = renderLocations()
    const mark = section.querySelector('.locations-mark') as HTMLElement

    expect(mark.getAttribute('aria-hidden')).toBe('true')
    expect(mark.parentElement?.classList.contains('locations-media')).toBe(true)
    expect(mark.querySelector('svg path')?.getAttribute('fill')).toBe('currentColor')
    expect(css).toMatch(
      /\.locations-mark \{[^}]*right:\s*6%;[^}]*bottom:\s*2\.5%;[^}]*width:\s*73%;[^}]*color:\s*#ffffff;/s,
    )
  })

  /*
   * One-shot reveals from the shared primitives: the picture opens like a
   * shutter, the headline arrives by the word, and each branch draws its rule
   * before its details -- the second a beat behind the first.
   */
  test('arrives once through the shared reveals, with no scroll scene', () => {
    const { section } = renderLocations()

    expect(section.querySelector('.locations-media')?.hasAttribute('data-reveal')).toBe(true)
    expect(section.querySelectorAll('.locations-title .reveal-word').length).toBeGreaterThan(5)
    for (const item of Array.from(section.querySelectorAll('.locations-item'))) {
      expect(item.hasAttribute('data-reveal')).toBe(true)
      expect(item.querySelector('.locations-rule')?.hasAttribute('data-reveal')).toBe(true)
    }
    // The unclipped figure watches for the viewport; the frame inside it opens.
    // A clipped element never counts as in view, so it could not open itself.
    expect(component).toMatch(/<RevealGroup as="figure" className="locations-media"/)
    expect(component).toMatch(/className="locations-media-frame" motion="shutter"/)
    expect(section.querySelector('.locations-media-frame')?.hasAttribute('data-reveal')).toBe(true)
    expect(component).toMatch(/className="locations-rule"\s+motion="line"/)
    expect(component).toMatch(/delay=\{0\.1 \+ index \* 0\.18\}/)
    expect(component).not.toMatch(/gsap|ScrollTrigger|useEffect|data-scroll-scene/)
    // Types only from the server data layer, so Payload stays out of the bundle.
    const valueImports =
      component.match(/^import\s+(?!type\s)[^\n]*from '@\/data\/(home|site)'/gm) ?? []
    expect(valueImports).toEqual([])
  })
})
