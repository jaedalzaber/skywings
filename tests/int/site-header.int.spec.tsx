import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { SiteHeader } from '@/components/layout/SiteHeader'
import type { SiteHeaderData } from '@/data/site'

vi.mock('next/navigation', () => ({ usePathname: () => '/products/folding-stand' }))

const header: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  navigation: [
    { href: '/industries', label: 'Industries' },
    { href: '/products', label: 'Products' },
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

  test('opens the drawer with the Figma navigation hierarchy', () => {
    render(<SiteHeader header={header} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Mobile navigation' })
    expect(drawer).toBeDefined()
    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('link', { name: 'Construction & Infrastructure' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Folding Stand' }).getAttribute('href')).toBe(
      '/products/folding-stand',
    )
    expect(within(drawer).getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe(
      '/contact',
    )
  })

  test('supports accordion and keyboard close interactions', () => {
    render(<SiteHeader header={header} />)

    const openButton = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(openButton)

    const industries = screen.getByRole('button', { name: 'Industries' })
    expect(industries.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(industries)
    expect(industries.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: 'Construction & Infrastructure' })).toBeNull()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Mobile navigation' })).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})
