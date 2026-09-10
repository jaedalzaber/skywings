import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { SiteHeader } from '@/components/layout/SiteHeader'
import type { SiteHeaderData } from '@/data/site'

vi.mock('next/navigation', () => ({ usePathname: () => '/products/folding-stand' }))

const header: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  navigation: [
    {
      href: '/industries',
      label: 'Industries',
      children: [
        {
          href: '/industries/aviation-ground-support-equipment',
          label: 'Aviation Ground Support Equipment',
        },
      ],
    },
    {
      href: '/products',
      label: 'Products',
      children: [{ href: '/products/folding-stand', label: 'Folding Stand' }],
    },
    { href: '/capabilities', label: 'Capabilities' },
    { href: '/blog', label: 'Resources' },
  ],
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
        href: '/products',
        label: 'Products',
        children: [
          {
            href: '/products?industry=aviation-ground-support-equipment',
            label: 'Aviation Ground Support Equipment',
            children: [
              {
                href: '/products?industry=aviation-ground-support-equipment&family=uld-containers-and-pallets',
                label: 'ULD Containers & Pallets',
              },
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
