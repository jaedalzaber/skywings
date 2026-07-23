import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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
