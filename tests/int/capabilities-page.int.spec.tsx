import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'

import { Capabilities } from '@/collections/Capabilities'
import { Machines } from '@/collections/Machines'
import { CapabilitiesSubnav } from '@/components/capabilities/CapabilitiesSubnav'
import { CapabilityMachinePark } from '@/components/capabilities/CapabilityMachinePark'
import { ProcessCapabilities } from '@/components/capabilities/ProcessCapabilities'
import { buildCapabilityProcesses, capabilitiesCopyFromLayout } from '@/data/capabilities'
import {
  buildCapabilitySlides,
  capabilityProcessSeeds,
  processNavLabel,
  summaryParagraphs,
  defaultCapabilitiesCopy,
  defaultCapabilityProcesses,
  type CapabilityMachine,
  type CapabilityProcess,
} from '@/data/capabilityDefaults'
import type { PageLayout } from '@/data/pages'
import type { Capability, Machine } from '@/payload-types'

const stylesheet = readFileSync(
  resolve(process.cwd(), 'src/app/(frontend)/capabilities.css'),
  'utf8',
)

function renderPage() {
  const { container } = render(
    <ProcessCapabilities copy={defaultCapabilitiesCopy} processes={defaultCapabilityProcesses} />,
  )
  const page = container.querySelector('.capabilities-page') as HTMLElement

  return { page, queries: within(page) }
}

describe('capabilities page', () => {
  afterEach(cleanup)

  test('sets out every process from the profile, in order, under one h1', () => {
    const { page, queries } = renderPage()

    expect(queries.getByRole('heading', { level: 1, name: 'Process capabilities' })).toBeTruthy()
    const bars = queries
      .getAllByRole('heading', { level: 2 })
      .filter((heading) => heading.classList.contains('capabilities-bar'))
    expect(bars.map((bar) => bar.querySelector('.capabilities-bar-title')?.textContent)).toEqual(
      capabilityProcessSeeds.map((seed) => seed.title),
    )
    // Every process can be linked to, and the sub-navigation links to each.
    const links = within(queries.getByRole('navigation', { name: 'Processes' })).getAllByRole(
      'link',
    )
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      capabilityProcessSeeds.map((seed) => `#${seed.slug}`),
    )
    for (const seed of capabilityProcessSeeds) {
      expect(page.querySelector(`#${seed.slug}`)).not.toBeNull()
    }
    // The head lists them too, beside the intro.
    const index = within(queries.getByRole('navigation', { name: 'Processes on this page' }))
    expect(index.getAllByRole('link').map((link) => link.textContent)).toEqual(
      capabilityProcessSeeds.map((seed) => seed.title),
    )
  })

  /*
   * No numbering anywhere: not on the bars, the head's list, the
   * sub-navigation, or under the carousel.
   */
  test('shows no counter numbers anywhere', () => {
    const { page } = renderPage()
    const titles = capabilityProcessSeeds.map((seed) => seed.title)

    for (const bar of page.querySelectorAll('.capabilities-bar')) {
      expect(titles).toContain(bar.textContent)
    }
    for (const link of page.querySelectorAll('.capabilities-index a')) {
      expect(titles).toContain(link.textContent)
    }
    const labels = defaultCapabilityProcesses.map((process) => processNavLabel(process))
    for (const link of page.querySelectorAll('.capabilities-subnav a')) {
      expect(labels).toContain(link.textContent)
    }
    expect(page.querySelector('[class*="-code"], [class*="-count"]')).toBeNull()
    expect(page.textContent).not.toMatch(/\b\d{2} \/ \d{2}\b/)
  })

  /*
   * The pinned bar has to fit every process across one row, so it uses short
   * names; the head's list keeps the full titles, and the bar carries each
   * full title as its tooltip.
   */
  test('fits the sub-navigation on one row with short names', () => {
    const { page } = renderPage()
    const links = Array.from(page.querySelectorAll('.capabilities-subnav a'))

    expect(links.map((link) => link.textContent)).toEqual([
      'Laser cutting',
      'Shearing',
      'Machining',
      'Press brake',
      'Rolling',
      'Drilling',
      'Pressing',
    ])
    expect(links.map((link) => link.getAttribute('title'))).toEqual(
      capabilityProcessSeeds.map((seed) => seed.title),
    )
    // The admin's records outside the profile get a short form too.
    expect(processNavLabel({ slug: 'welding-and-assembly', title: 'Welding & Assembly' })).toBe(
      'Welding',
    )
    // And anything unknown keeps its full title rather than a guess.
    expect(processNavLabel({ slug: 'new-process', title: 'New Process' })).toBe('New Process')
  })

  /*
   * The home section is an accordion; this page is not. Every process stands
   * open, so there is nothing to toggle and nothing to close.
   */
  test('holds every process open, with nothing to toggle or close', () => {
    const { page } = renderPage()

    expect(page.querySelectorAll('[aria-expanded]')).toHaveLength(0)
    // The bars are headings, not controls.
    expect(page.querySelectorAll('.capabilities-bar button')).toHaveLength(0)
    expect(page.querySelectorAll('.capabilities-panel')).toHaveLength(capabilityProcessSeeds.length)
    for (const panel of page.querySelectorAll('.capabilities-panel')) {
      expect(panel.hasAttribute('hidden')).toBe(false)
      expect(panel.getAttribute('aria-hidden')).toBeNull()
    }
    expect(stylesheet).not.toMatch(/grid-template-rows:\s*0(fr|px)/)
    // Scoped to the panel: the carousel's stacked descriptions do hide.
    const panelRule = /\.capabilities-panel \{([^}]*)\}/.exec(stylesheet)?.[1] ?? ''
    expect(panelRule).not.toMatch(/visibility|display:\s*none|height:\s*0/)
  })

  test('lists which machine and model runs each process, in the home panel mono', () => {
    const { page } = renderPage()
    const laser = page.querySelector('#laser-cutting') as HTMLElement
    const row = laser.querySelector('.capabilities-machine-row') as HTMLElement

    expect(row.querySelector('.capabilities-machine-maker')?.textContent).toBe(
      'Bodor · 12K-C6100026',
    )
    expect(row.querySelector('.capabilities-machine-type')?.textContent).toBe('Laser machine')
    expect(
      Array.from(
        page.querySelectorAll('#cnc-and-conventional-machining .capabilities-machine-maker'),
      ).map((maker) => maker.textContent),
    ).toEqual([
      'WEIDA · AMT 860',
      'WEIDA · AMT 63',
      'Hoston · C6280/Y-800X3000',
      'KAKA · CQ6236KX1000',
      'HYMT · X6232CX16',
      'SEBA · L-550',
    ])

    // Every machine has a slide, photo or not, so every row brings one up.
    const machines = capabilityProcessSeeds.flatMap((seed) => seed.machines)
    expect(page.querySelectorAll('button.capabilities-machine-row')).toHaveLength(machines.length)
    expect(stylesheet).toMatch(
      /\.capabilities-machine-line \{[^}]*font-family: var\(--capabilities-mono\);/s,
    )
  })

  test('shows the typical outputs, and holds empty image slots until photos arrive', () => {
    const { page } = renderPage()
    const shearing = page.querySelector('#shearing') as HTMLElement

    expect(
      Array.from(shearing.querySelectorAll('.capabilities-output-label')).map(
        (el) => el.textContent,
      ),
    ).toEqual(['Cut sheet blanks', 'Steel strips & flat bars', 'Fabrication-ready plate sets'])

    // No photographs are committed: every slot is the quiet placeholder.
    expect(page.querySelectorAll('img')).toHaveLength(0)
    for (const empty of page.querySelectorAll('.capabilities-image-empty')) {
      expect(empty.getAttribute('aria-hidden')).toBe('true')
    }
    expect(page.querySelectorAll('.capabilities-carousel')).toHaveLength(
      capabilityProcessSeeds.length,
    )
    // Arrows only where a machine has company to step to.
    const stepped = capabilityProcessSeeds.filter((seed) => seed.machines.length > 1).length
    expect(page.querySelectorAll('.capabilities-carousel-nav')).toHaveLength(stepped)
  })

  /*
   * A row at one shared height rather than a grid of equal-width cells: a
   * card's width comes from its own photograph's proportions, not a box every
   * output is cropped to fit. The old fixed 16/10 crop-to-fill is gone.
   */
  test('gives each output card its own width, from its photograph rather than a fixed box', () => {
    expect(stylesheet).toMatch(
      /\.capabilities-output-grid \{[^}]*display: flex;[^}]*flex-wrap: wrap;/s,
    )
    expect(stylesheet).toMatch(
      /\.capabilities-output \{[^}]*flex: 0 0 auto;[^}]*flex-direction: column;/s,
    )
    expect(stylesheet).not.toMatch(/\.capabilities-output-grid \{[^}]*grid-template-columns/s)
    expect(stylesheet).not.toMatch(/\.capabilities-output-media \{[^}]*aspect-ratio: 16 \/ 10;/s)
    // A capped outlier -- a very wide flatlay, say -- crops rather than
    // letterboxing, so it never dwarfs the square cards beside it.
    expect(stylesheet).toMatch(/\.capabilities-output-image \{[^}]*max-width: 9\.5rem;[^}]*object-fit: cover;/s)
    // The empty placeholder has no photograph to size the card from, so it
    // carries a width of its own instead of collapsing to nothing.
    expect(stylesheet).toMatch(
      /\.capabilities-output-media \.capabilities-image-empty \{[^}]*width: clamp\(/s,
    )
    // A long label with nowhere to wrap was what actually set a card's
    // width in practice, leaving a gap beside a small photo. Capped to the
    // same width as the photograph, it wraps instead.
    expect(stylesheet).toMatch(/\.capabilities-output-label \{[^}]*max-width: 9\.5rem;/s)
    // A label wrapping to two lines must not be free to make its own card
    // taller than the rest of the row -- every photo is already one height.
    expect(stylesheet).toMatch(/\.capabilities-output-label \{[^}]*min-height: 2\.875rem;/s)
  })

  /*
   * The photograph is the content: nothing is printed over or under it. What
   * a machine is -- its plate and type -- reads once already, in the mono
   * list beside the carousel; repeating it under every frame as the carousel
   * stepped through them only pushed the arrows around.
   */
  test('shows the photograph full, with nothing printed over or under it', () => {
    const { page } = renderPage()

    expect(page.querySelectorAll('.capabilities-carousel-panel')).toHaveLength(0)
    expect(page.querySelectorAll('.capabilities-carousel-info')).toHaveLength(0)
    expect(
      page.querySelectorAll(
        '.capabilities-carousel-maker, .capabilities-carousel-heading, .capabilities-carousel-copy, .capabilities-carousel-capacity',
      ),
    ).toHaveLength(0)
    // A machine photograph shows whole, on a light ground, rather than
    // cropped to fill the frame.
    expect(stylesheet).toMatch(
      /\.capabilities-carousel-frame\[data-kind='machine'\] \.capabilities-carousel-image \{[^}]*object-fit: contain;/s,
    )

    // The carousel is exactly the frame, then the arrows where a process has
    // more than one slide to step through -- nothing between them.
    const cnc = page.querySelector(
      '#cnc-and-conventional-machining .capabilities-carousel',
    ) as HTMLElement
    expect(Array.from(cnc.children).map((el) => el.className)).toEqual([
      'capabilities-carousel-frame',
      'capabilities-visually-hidden',
      'capabilities-carousel-nav',
    ])
  })

  test('is dark end to end, and drives the header onto its dark surface', () => {
    const { page } = renderPage()

    expect(page.getAttribute('data-nav-surface')).toBe('dark')
    // Painted on body as well, or .site-shell's padding shows a light band.
    expect(stylesheet).toMatch(/body:has\(\.capabilities-page\) \{\s*background: #1c1c1c;/)
    expect(stylesheet).toMatch(/\.capabilities-page \{[^}]*width: var\(--bleed-width\);/s)
    expect(stylesheet).toMatch(/\.capabilities-page \{[^}]*margin-inline: var\(--bleed-margin\);/s)
    /*
     * Runs up behind the bar, or the header sits white over a dark page until
     * the first scroll. Pulled and padded by the same token, so the content
     * does not jump when the bar condenses.
     */
    expect(stylesheet).toMatch(
      /\.capabilities-page \{[^}]*margin-block-start: calc\(-1 \* var\(--header-height\)\);[^}]*padding-top: var\(--header-height\);/s,
    )
    expect(stylesheet).toMatch(/--capabilities-accent: var\(--blue\);/)
  })

  test('closes with the integrated-team statement and the page CTAs', () => {
    const { queries } = renderPage()

    expect(queries.getByRole('heading', { level: 2, name: 'One accountable team.' })).toBeTruthy()
    expect(queries.getByText(defaultCapabilitiesCopy.closingStatement)).toBeTruthy()
    expect(queries.getByRole('link', { name: 'Request a quote' }).getAttribute('href')).toBe(
      '/contact',
    )
  })
})

describe('buildCapabilityProcesses', () => {
  const capability = (id: number, slug: string, extra: Partial<Capability> = {}) =>
    ({
      id,
      processType: 'machining',
      slug,
      summary: `${slug} summary`,
      title: slug,
      ...extra,
    }) as Capability

  const machine = (
    id: number,
    capabilityRef: Machine['capability'],
    extra: Partial<Machine> = {},
  ) =>
    ({
      capability: capabilityRef,
      id,
      machineType: `type ${id}`,
      name: `m${id}`,
      ...extra,
    }) as Machine

  test('files each machine under its process, in its own sort order', () => {
    const processes = buildCapabilityProcesses(
      [capability(1, 'laser'), capability(2, 'shear')],
      [
        machine(10, 1, { sortOrder: 2 }),
        machine(11, 1, { sortOrder: 1 }),
        // A populated relationship resolves to the same process.
        machine(12, capability(2, 'shear')),
      ],
    )

    expect(processes.map((process) => process.slug)).toEqual(['laser', 'shear'])
    expect(processes[0].machines.map((m) => m.machineType)).toEqual(['type 11', 'type 10'])
    expect(processes[1].machines.map((m) => m.machineType)).toEqual(['type 12'])
  })

  test('leaves off machines that are planned, retired, or under an unpublished process', () => {
    const [process] = buildCapabilityProcesses(
      [capability(1, 'laser')],
      [
        machine(10, 1, { machineStatus: 'active' }),
        machine(11, 1, { machineStatus: 'maintenance' }),
        machine(12, 1, { machineStatus: 'planned' }),
        machine(13, 1, { machineStatus: 'retired' }),
        machine(14, 99),
      ],
    )

    expect(process.machines.map((m) => m.id)).toEqual(['10', '11'])
  })

  test('reads photographs and outputs from the records', () => {
    const photo = { alt: 'Laser bed', mimeType: 'image/jpeg', url: '/media/laser.jpg' }
    const [process] = buildCapabilityProcesses(
      [
        capability(1, 'laser', {
          featuredImage: photo as never,
          typicalOutputs: [{ image: photo as never, label: 'Blanks' }, { label: 'Plates' }],
        }),
      ],
      [machine(10, 1, { brand: '', featuredImage: photo as never, model: 'C-Series' })],
    )

    expect(process.image).toEqual({ alt: 'Laser bed', url: '/media/laser.jpg' })
    expect(process.outputs).toEqual([
      { image: { alt: 'Laser bed', url: '/media/laser.jpg' }, label: 'Blanks' },
      { image: null, label: 'Plates' },
    ])
    // Empty strings from the admin read as absent, not as a blank plate.
    expect(process.machines[0]).toMatchObject({ brand: null, model: 'C-Series' })
    expect(process.machines[0].image?.url).toBe('/media/laser.jpg')
  })

  test('carries each gallery, with its captions, for the carousel', () => {
    const photo = { alt: 'Bed', mimeType: 'image/jpeg', url: '/media/bed.jpg' }
    const [process] = buildCapabilityProcesses(
      [capability(1, 'laser', { gallery: [{ caption: 'Nesting', image: photo as never }] })],
      [
        machine(10, 1, {
          // An entry whose upload is missing is dropped, not shown blank.
          gallery: [{ image: photo as never }, { image: 404 as never }],
        }),
      ],
    )

    expect(process.gallery).toEqual([{ alt: 'Bed', caption: 'Nesting', url: '/media/bed.jpg' }])
    expect(process.machines[0].gallery).toEqual([
      { alt: 'Bed', caption: null, url: '/media/bed.jpg' },
    ])
  })
})

describe('buildCapabilitySlides', () => {
  const picture = (name: string, caption?: string) => ({ alt: name, caption, url: `/${name}.jpg` })
  const machineOf = (id: string, extra: Partial<CapabilityMachine> = {}) => ({
    brand: null,
    capacity: null,
    gallery: [],
    id,
    image: null,
    machineType: `Type ${id}`,
    model: null,
    summary: null,
    ...extra,
  })

  test('runs process first, then each machine in list order -- every machine, photo or not', () => {
    const slides = buildCapabilitySlides({
      ...defaultCapabilityProcesses[0],
      gallery: [picture('floor', 'Nesting on the bed')],
      image: picture('process'),
      machines: [
        machineOf('a', { brand: 'Bodor', image: picture('a'), model: 'C-Series' }),
        machineOf('b'),
        machineOf('c', { gallery: [picture('c2')], image: picture('c1') }),
      ],
    })

    /*
     * Machine b has no photograph yet and still gets a slide -- a placeholder
     * -- because the carousel is where its description is read.
     */
    expect(slides.map((slide) => [slide.image?.url ?? null, slide.kind, slide.machineId])).toEqual([
      ['/process.jpg', 'process', null],
      ['/floor.jpg', 'process', null],
      ['/a.jpg', 'machine', 'a'],
      [null, 'machine', 'b'],
      ['/c1.jpg', 'machine', 'c'],
      ['/c2.jpg', 'machine', 'c'],
    ])
    // Each names what is on screen: the gallery's own caption, else the
    // process; a machine by its plate and what it is.
    expect(slides.map((slide) => slide.caption)).toEqual([
      'Laser Cutting',
      'Nesting on the bed',
      'Bodor · C-Series — Type a',
      'Type b',
      'Type c',
      'Type c',
    ])
    // A process with no photograph of its own starts on its first machine.
    expect(
      buildCapabilitySlides({ ...defaultCapabilityProcesses[0], image: null, gallery: [] })[0]
        .machineId,
    ).toBe(defaultCapabilityProcesses[0].machines[0].id)
  })

  test('splits a machine summary into the profile paragraphs', () => {
    expect(summaryParagraphs('What it is.\n\nWhat it is for.')).toEqual([
      'What it is.',
      'What it is for.',
    ])
    expect(summaryParagraphs('One line.\nStill one paragraph.')).toEqual([
      'One line.\nStill one paragraph.',
    ])
    expect(summaryParagraphs(null)).toEqual([])
  })
})

describe('machine park carousel', () => {
  afterEach(cleanup)

  const photo = (name: string) => ({ alt: name, url: `/${name}.jpg` })
  const process: CapabilityProcess = {
    ...defaultCapabilityProcesses[2],
    gallery: [],
    image: photo('turning'),
    machines: [
      {
        ...defaultCapabilityProcesses[2].machines[0],
        gallery: [photo('vmc-side')],
        image: photo('vmc'),
      },
      { ...defaultCapabilityProcesses[2].machines[1], gallery: [], image: photo('lathe') },
      // No photograph yet: still listed, still a slide, shown as a placeholder.
      { ...defaultCapabilityProcesses[2].machines[2], gallery: [], image: null },
    ],
  }

  function renderPark() {
    const { container } = render(<CapabilityMachinePark process={process} />)
    const carousel = container.querySelector('.capabilities-carousel') as HTMLElement
    const image = () => carousel.querySelector('img')?.getAttribute('src') ?? null
    // The visible caption is gone; what is on screen is still announced for
    // anyone not looking at the photograph, via the sr-only live region.
    const shown = () => carousel.querySelector('p[aria-live="polite"]')?.textContent

    return { carousel, container, image, shown }
  }

  test('steps through every slide with the arrows along its foot, wrapping', () => {
    const { carousel, image, shown } = renderPark()
    const next = within(carousel).getByRole('button', { name: /Next .* photograph/ })
    const previous = within(carousel).getByRole('button', { name: /Previous .* photograph/ })

    // The arrows sit directly below the photograph -- full, nothing printed over it.
    expect(carousel.lastElementChild?.className).toBe('capabilities-carousel-nav')
    expect(image()).toBe('/turning.jpg')
    expect(shown()).toBe('CNC & Conventional Machining')

    fireEvent.click(next)
    expect(image()).toBe('/vmc.jpg')
    expect(shown()).toBe('WEIDA · AMT 860 — Vertical machining center')
    expect(carousel.querySelector('[data-kind]')?.getAttribute('data-kind')).toBe('machine')

    // Back past the start wraps to the last machine, which has no photo yet.
    fireEvent.click(previous)
    fireEvent.click(previous)
    expect(image()).toBeNull()
    expect(
      carousel.querySelector('.capabilities-carousel-frame .capabilities-image-empty'),
    ).not.toBeNull()
    expect(shown()).toBe('Hoston · C6280/Y-800X3000 — Large lathe')
  })

  test('marks the machine on screen, and its row brings it up', () => {
    const { container, image, shown } = renderPark()
    const rows = Array.from(container.querySelectorAll('.capabilities-machine-row'))

    // Every machine has a slide, so every row is a button.
    expect(rows.map((row) => row.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON'])
    expect(rows.every((row) => row.getAttribute('data-active') === 'false')).toBe(true)

    fireEvent.click(rows[1])
    expect(image()).toBe('/lathe.jpg')
    expect(shown()).toBe('WEIDA · AMT 63 — CNC lathe')
    expect(rows[1].getAttribute('aria-pressed')).toBe('true')
    expect(rows[1].getAttribute('data-active')).toBe('true')
    expect(rows[0].getAttribute('aria-pressed')).toBe('false')
  })
})

describe('capabilities sub-navigation', () => {
  const items = [
    { label: 'One', slug: 'one', title: 'One' },
    { label: 'Two', slug: 'two', title: 'Two' },
    { label: 'Three', slug: 'three', title: 'Three' },
  ]
  const tops: Record<string, number> = {}

  beforeEach(() => {
    for (const item of items) {
      const section = document.createElement('section')
      section.id = item.slug
      document.body.append(section)
    }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const top = this.classList.contains('capabilities-subnav') ? 0 : (tops[this.id] ?? 0)
      const height = this.classList.contains('capabilities-subnav') ? 52 : 600
      return {
        bottom: top + height,
        height,
        left: 0,
        right: 0,
        top,
        width: 0,
        x: 0,
        y: top,
      } as DOMRect
    })
    // jsdom lays nothing out; without this every page reads as scrolled to its end.
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 10_000,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    for (const item of items) document.getElementById(item.slug)?.remove()
  })

  const current = () => document.querySelector('[aria-current="true"]')?.getAttribute('href')

  const scroll = async () =>
    act(async () => {
      window.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
  const shown = () => document.querySelector('.capabilities-subnav')?.getAttribute('data-shown')

  test('marks the process under the reading line as the page scrolls', async () => {
    Object.assign(tops, { one: 300, two: 900, three: 1500 })
    render(<CapabilitiesSubnav items={items} />)
    // Nothing has reached the line yet: the first process holds the mark.
    expect(current()).toBe('#one')

    Object.assign(tops, { one: -700, two: 100, three: 700 })
    await scroll()
    expect(current()).toBe('#two')
  })

  /*
   * Not there at the top of the page -- the head's list is -- and down only
   * while the processes are under the header: gone again after the last one.
   */
  test('comes down only once the processes reach the header, and goes after the last', async () => {
    Object.assign(tops, { one: 300, two: 900, three: 1500 })
    render(<CapabilitiesSubnav items={items} />)
    expect(shown()).toBe('false')

    Object.assign(tops, { one: -100, two: 500, three: 1100 })
    await scroll()
    expect(shown()).toBe('true')

    // The last process has scrolled away above the bars.
    Object.assign(tops, { one: -3000, two: -2400, three: -1800 })
    await scroll()
    expect(shown()).toBe('false')
  })

  test('jumps to a process and marks it at once, keeping the address linkable', () => {
    Object.assign(tops, { one: 300, two: 900, three: 1500 })
    render(<CapabilitiesSubnav items={items} />)

    fireEvent.click(screen.getByRole('link', { name: /Three/ }))
    expect(current()).toBe('#three')
    expect(window.location.hash).toBe('#three')
  })

  /*
   * Fixed under the header, hidden until shown -- so it takes no room in the
   * page at the top -- and a jump lands clear of both bars.
   */
  test('slides out from under the header and lands a jump below both bars', () => {
    expect(stylesheet).toMatch(
      /\.capabilities-subnav \{[^}]*position: fixed;[^}]*top: var\(--header-height\);[^}]*transform: translateY\(-100%\);[^}]*visibility: hidden;/s,
    )
    expect(stylesheet).toMatch(
      /\.capabilities-subnav\[data-shown='true'\] \{[^}]*transform: none;[^}]*visibility: visible;/s,
    )
    // Beneath the header in the stack, so it comes out from behind it.
    expect(stylesheet).toMatch(/\.capabilities-subnav \{[^}]*z-index: 40;/s)
    // Ruled above as well as below.
    expect(stylesheet).toMatch(
      /\.capabilities-subnav \{[^}]*border-top: 1px solid var\(--capabilities-line\);/s,
    )
    /*
     * Down, the two read as one bar: the header's rule takes the bar colour.
     * Not transparent -- the header's fill stops above it, so that would open
     * a 1px gap onto the page underneath.
     */
    expect(stylesheet).toMatch(
      /html:has\(\.capabilities-subnav\[data-shown='true'\]\) \.topbar \{\s*border-bottom-color: var\(--nav-surface\);/,
    )
    expect(stylesheet).toMatch(
      /\.capabilities-process \{\s*scroll-margin-top: calc\(var\(--header-height\) \+ var\(--capabilities-subnav-height\) \+ 1rem\);/,
    )
    expect(stylesheet).toMatch(
      /\.capabilities-subnav-link\[aria-current='true'\] \{[^}]*var\(--capabilities-accent\)/s,
    )
  })
})

describe('capabilitiesCopyFromLayout', () => {
  test('takes the head from the hero block and the close from the listing block', () => {
    const copy = capabilitiesCopyFromLayout([
      { blockType: 'pageHero', eyebrow: 'Shop', heading: 'What we run', description: 'Intro' },
      { blockType: 'capabilityListing', heading: 'Close', description: 'Statement' },
    ] as PageLayout)

    expect(copy).toMatchObject({
      closingHeading: 'Close',
      closingStatement: 'Statement',
      description: 'Intro',
      eyebrow: 'Shop',
      heading: 'What we run',
    })
  })

  test('brings a default back for any field left empty', () => {
    const copy = capabilitiesCopyFromLayout([
      { blockType: 'pageHero', heading: '   ', eyebrow: 'Shop' },
    ] as PageLayout)

    expect(copy.heading).toBe(defaultCapabilitiesCopy.heading)
    expect(copy.eyebrow).toBe('Shop')
    expect(copy.closingStatement).toBe(defaultCapabilitiesCopy.closingStatement)
  })
})

describe('capability records', () => {
  /*
   * The seed updates the records the dummy catalog created, in place, because
   * products link to them. That only works while each slug here is exactly
   * what that seed derived from the same title.
   */
  test('keeps the slugs the existing records were created with', () => {
    const dummySlug = (value: string) =>
      value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

    for (const seed of capabilityProcessSeeds) {
      expect(seed.slug).toBe(dummySlug(seed.title))
    }
    const machineSlugs = capabilityProcessSeeds.flatMap((seed) => seed.machines.map((m) => m.slug))
    expect(new Set(machineSlugs).size).toBe(machineSlugs.length)
  })

  /*
   * Both lists are cached under a tag, and nothing used to clear it: a
   * photograph uploaded in the admin never reached the page.
   */
  test('clears the page cache when a capability or a machine is saved', async () => {
    const mocked = vi.mocked(revalidateTag)

    for (const [collection, tag] of [
      [Capabilities, 'capabilities'],
      [Machines, 'machines'],
    ] as const) {
      mocked.mockClear()
      const hook = collection.hooks?.afterChange?.[0]
      expect(hook).toBeTypeOf('function')
      await hook?.({ doc: { id: 1 } } as never)
      expect(mocked.mock.calls.map(([called]) => called)).toContain(tag)
    }
  })
})
