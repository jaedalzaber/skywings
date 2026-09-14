import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { defaultBrandLogoMotion, renderableNavigation, type SiteHeaderData } from '@/data/site'

vi.mock('next/navigation', () => ({ usePathname: () => '/products/folding-stand' }))

/** A row of the bar as the data layer hands it over: shown, and working. */
const nav = (label: string, href: string) => ({ disabled: false, href, label })

const header: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  logoMotion: defaultBrandLogoMotion,
  navigation: [
    {
      ...nav('Industries', '/industries'),
      children: [
        nav('Aviation Ground Support Equipment', '/industries/aviation-ground-support-equipment'),
      ],
    },
    {
      ...nav('Products', '/products'),
      children: [nav('Folding Stand', '/products/folding-stand')],
    },
    nav('Capabilities', '/capabilities'),
    nav('Resources', '/blog'),
  ],
  proudBadge: true,
  cta: { href: '/contact', label: 'Contact', openInNewTab: false, style: 'primary' },
}

describe('SiteHeader mobile navigation', () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  test('opens the drawer with links from the header global', () => {
    render(<SiteHeader header={header} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Mobile navigation' })
    expect(drawer).toBeDefined()
    expect(document.body.style.overflow).toBe('hidden')
    expect(
      within(drawer).getByRole('link', { name: 'Aviation Ground Support Equipment' }),
    ).toBeDefined()
    expect(within(drawer).getByRole('link', { name: 'Folding Stand' }).getAttribute('href')).toBe(
      '/products/folding-stand',
    )
    expect(within(drawer).getByRole('link', { name: 'Capabilities' }).getAttribute('href')).toBe(
      '/capabilities',
    )
    expect(within(drawer).getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe(
      '/contact',
    )
  })

  test('supports accordion and keyboard close interactions', () => {
    render(<SiteHeader header={header} />)

    const openButton = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(openButton)

    const drawer = screen.getByRole('dialog', { name: 'Mobile navigation' })
    const industries = screen.getByRole('button', { name: 'Industries' })
    expect(industries.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(industries)
    expect(industries.getAttribute('aria-expanded')).toBe('false')
    expect(
      within(drawer).queryByRole('link', { name: 'Aviation Ground Support Equipment' }),
    ).toBeNull()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  /*
   * The bar sets itself out on load, one part at a time. It is staged on the
   * topbar's contents rather than on .nav-container, which is the sticky
   * element: a transform there would make it the containing block for
   * anything fixed inside it, and this bar is always on screen.
   */
  test('stages the bar without transforming the sticky container', () => {
    const { container } = render(<SiteHeader header={header} />)

    expect(container.querySelector('.nav-container')?.hasAttribute('data-reveal')).toBe(false)
    expect(container.querySelector('.topbar')?.hasAttribute('data-reveal')).toBe(true)
    for (const selector of ['.brand-logo', '.nav-actions', '.mobile-nav-toggle']) {
      expect(container.querySelector(selector)?.hasAttribute('data-reveal'), selector).toBe(true)
    }
    const items = Array.from(container.querySelectorAll('.nav-item'))
    expect(items).toHaveLength(header.navigation.length)
    expect(items.every((item) => item.hasAttribute('data-reveal'))).toBe(true)
    // The mark stays inside its link, and the link is not the animated part.
    expect(container.querySelector('.brand-logo')?.parentElement?.className).toBe('brand')
  })

  /* Focus returns to the menu button when the drawer closes, which needs the
     button's ref to survive being staged. */
  test('returns focus to the menu button after the drawer closes', async () => {
    render(<SiteHeader header={header} />)

    const openButton = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(openButton)
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation menu' }))

    await waitFor(() => expect(document.activeElement).toBe(openButton))
  })

  test('shows Industries as disabled when its CMS href is home', () => {
    const disabledIndustriesHeader: SiteHeaderData = {
      ...header,
      navigation: [
        ...renderableNavigation([
          {
            href: '/',
            label: 'Industries',
            children: [
              {
                href: '/industries/aviation-ground-support-equipment',
                label: 'Aviation Ground Support Equipment',
              },
            ],
          },
        ]),
        ...header.navigation.slice(1),
      ],
    }

    render(<SiteHeader header={disabledIndustriesHeader} />)

    const desktopIndustries = screen.getByRole('button', { name: 'Industries' })
    expect(desktopIndustries.getAttribute('aria-disabled')).toBe('true')
    expect(screen.queryByRole('link', { name: 'Industries' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Mobile navigation' })
    expect(within(drawer).queryByRole('link', { name: 'Industries' })).toBeNull()
    expect(
      within(drawer).getByRole('link', { name: 'Aviation Ground Support Equipment' }),
    ).toBeDefined()
  })
})

describe('SiteHeader product categories', () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  const nestedHeader: SiteHeaderData = {
    ...header,
    navigation: [
      header.navigation[0],
      {
        ...nav('Products', '/products'),
        children: [
          {
            ...nav(
              'Aviation Ground Support Equipment',
              '/products?industry=aviation-ground-support-equipment',
            ),
            children: [
              nav(
                'ULD Containers & Pallets',
                '/products?industry=aviation-ground-support-equipment&family=uld-containers-and-pallets',
              ),
            ],
          },
        ],
      },
      ...header.navigation.slice(2),
    ],
  }

  test('opens Products as a category map of industries and their families', () => {
    render(<SiteHeader header={nestedHeader} />)

    // Industries also lists an "Aviation Ground Support Equipment" child, so
    // scope to the mega panel rather than matching on label alone.
    const mega = document.querySelector('.nav-submenu--mega')

    expect(mega).not.toBeNull()

    const group = within(mega as HTMLElement)
      .getByRole('link', {
        name: 'Aviation Ground Support Equipment',
      })
      .closest('.nav-submenu-group')

    expect(group).not.toBeNull()
    expect(
      within(group as HTMLElement).getByRole('link', { name: 'ULD Containers & Pallets' }),
    ).toBeDefined()
  })

  test('keeps every top-level menu reachable in the mobile drawer', () => {
    render(<SiteHeader header={nestedHeader} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Mobile navigation' })

    for (const label of ['Industries', 'Products', 'Capabilities', 'Resources']) {
      expect(within(drawer).getAllByText(label).length).toBeGreaterThan(0)
    }

    expect(within(drawer).getByRole('link', { name: 'ULD Containers & Pallets' })).toBeDefined()
  })
})

describe('SiteHeader entries an editor has switched off', () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  /*
   * Two different intentions, and they read differently on the page. A row
   * switched off is still in the menu, announced as a link and reachable by
   * keyboard, saying the page is not ready; a row hidden never arrives here
   * at all, because the data layer drops it.
   */
  test('shows a menu entry that does not link, without an address on it', () => {
    const withDisabled: SiteHeaderData = {
      ...header,
      navigation: [
        {
          ...nav('Products', '/products'),
          children: [
            { ...nav('Folding Stand', '/products/folding-stand'), disabled: true },
            nav('Work Platform', '/products/work-platform'),
          ],
        },
      ],
    }

    render(<SiteHeader header={withDisabled} />)

    const stand = screen.getByText('Folding Stand')
    expect(stand.getAttribute('aria-disabled')).toBe('true')
    expect(stand.hasAttribute('href')).toBe(false)
    expect(screen.getByText('Work Platform').getAttribute('href')).toBe('/products/work-platform')
  })

  test('leaves a hidden row out of the bar entirely', () => {
    const navigation = renderableNavigation([
      { href: '/products', label: 'Products', hidden: true },
      {
        href: '/capabilities',
        label: 'Capabilities',
        children: [
          { href: '/capabilities/welding', label: 'Welding', hidden: true },
          { href: '/capabilities/forming', label: 'Forming' },
        ],
      },
    ])

    render(<SiteHeader header={{ ...header, navigation }} />)

    expect(screen.queryByText('Products')).toBeNull()
    expect(screen.queryByText('Welding')).toBeNull()
    expect(screen.getByText('Forming')).toBeDefined()
  })

  test('puts the Proud of UAE badge away when the header says to', () => {
    const { container } = render(<SiteHeader header={{ ...header, proudBadge: false }} />)
    expect(container.querySelector('.nav-proud')).toBeNull()

    cleanup()

    const shown = render(<SiteHeader header={header} />)
    expect(shown.container.querySelector('.nav-proud')).not.toBeNull()
  })
})

describe('header navigation read from the CMS', () => {
  /*
   * The catalogue's own addresses are a query string, which is not something
   * to ask an editor to type: they pick the industry, and the family within
   * it, and this spells it out the same way the generated Products menu does.
   */
  test('builds a catalogue address from the category chosen', () => {
    const [industryOnly, withFamily, unset] = renderableNavigation([
      {
        label: 'Aviation',
        linkType: 'productCategory',
        industry: { id: 1, slug: 'aviation-ground-support-equipment' } as never,
      },
      {
        label: 'ULD Containers',
        linkType: 'productCategory',
        industry: { id: 1, slug: 'aviation-ground-support-equipment' } as never,
        family: { id: 2, slug: 'uld-containers-and-pallets' } as never,
      },
      { label: 'Nothing chosen yet', linkType: 'productCategory' },
    ])

    expect(industryOnly.href).toBe('/products?industry=aviation-ground-support-equipment')
    expect(withFamily.href).toBe(
      '/products?industry=aviation-ground-support-equipment&family=uld-containers-and-pallets',
    )
    // Nothing to point at yet, so it is shown but does not pretend to lead on.
    expect(unset.href).toBe('#')
    expect(unset.disabled).toBe(true)
  })

  test("carries an editor's switch down to every level", () => {
    const [products] = renderableNavigation([
      {
        href: '/products',
        label: 'Products',
        children: [
          {
            href: '/products?industry=aviation',
            label: 'Aviation',
            disabled: true,
            // A column's own links are stored under 'links', not a second
            // 'children': two arrays of one name confuse the database layer.
            links: [{ href: '/products?family=uld', label: 'ULD', disabled: true }],
          },
        ],
      },
    ])

    expect(products.disabled).toBe(false)
    expect(products.children?.[0].disabled).toBe(true)
    expect(products.children?.[0].children?.[0].disabled).toBe(true)
  })
})
