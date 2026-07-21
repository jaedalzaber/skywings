import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { SiteHeader } from '@/components/layout/SiteHeader'
import type { SiteHeaderData } from '@/data/site'
import { SiteSettings, validateDistinctBrandAsset } from '@/globals/SiteSettings'

const figmaHeader: SiteHeaderData = {
  brandName: 'Sky Wings',
  brandTagline: 'Engineering Industries LLC',
  navigation: [
    {
      label: 'Industries',
      href: '/industries',
      children: [{ label: 'Aviation Ground Support Equipment', href: '/industries' }],
    },
    { label: 'Products', href: '/products' },
    { label: 'Configurators', href: '/#configurators' },
    { label: 'Capabilities', href: '/capabilities' },
    { label: 'Resources', href: '/brochures' },
    { label: 'About', href: '/#about' },
  ],
  cta: {
    label: 'Request Quote',
    href: '/contact',
    openInNewTab: false,
    style: 'primary',
  },
}

describe('SiteHeader', () => {
  test('keeps the navigation logo and favicon as distinct Payload uploads', () => {
    const logoField = SiteSettings.fields.find((field) => 'name' in field && field.name === 'logo')
    const faviconField = SiteSettings.fields.find(
      (field) => 'name' in field && field.name === 'favicon',
    )

    expect(logoField).toMatchObject({
      label: 'Navigation logo',
      relationTo: 'media',
      type: 'upload',
    })
    expect(faviconField).toMatchObject({
      label: 'Browser favicon',
      relationTo: 'media',
      type: 'upload',
    })
    expect(validateDistinctBrandAsset(2, { favicon: 2 }, 'favicon')).toBe(
      'Logo and favicon must use separate media uploads.',
    )
    expect(validateDistinctBrandAsset(2, { favicon: 3 }, 'favicon')).toBe(true)
  })

  test('renders the Figma nav container structure', () => {
    const { container } = render(<SiteHeader header={figmaHeader} />)

    expect(container.querySelector('.nav-container')).not.toBeNull()
    expect(container.querySelector('.nav-spacer')).not.toBeNull()

    const nav = screen.getByRole('navigation', { name: 'Site sections' })
    const navLabels = Array.from(nav.querySelectorAll(':scope > .nav-item > a')).map((link) =>
      link.textContent?.trim(),
    )

    expect(navLabels.slice(0, 6)).toEqual([
      'Industries',
      'Products',
      'Configurators',
      'Capabilities',
      'Resources',
      'About',
    ])
    expect(screen.getByLabelText('Language selector').textContent).toContain('EN')
    expect(screen.getByRole('link', { name: 'Request Quote' }).getAttribute('href')).toBe(
      '/contact',
    )
  })

  test('uses CSS variables for the floating navigation surface', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(styles).toMatch(
      /\.topbar\s*\{[^}]*background:\s*var\(--nav-surface,[^;]+;[^}]*backdrop-filter:\s*var\(--nav-backdrop,[^;]+;/s,
    )
  })

  test('uses the bundled SVG logo when no Payload logo is selected', () => {
    const { container } = render(<SiteHeader header={figmaHeader} />)

    const logo = container.querySelector('.brand-logo img') as HTMLImageElement

    expect(logo.getAttribute('alt')).toBe('Sky Wings')
    expect(logo.getAttribute('src')).toBe('/images/header/logo.svg')
    expect(logo.getAttribute('width')).toBe('61')
    expect(logo.getAttribute('height')).toBe('29')
  })

  test('renders a Payload-uploaded SVG logo without raster optimization', () => {
    const { container } = render(
      <SiteHeader
        header={{
          ...figmaHeader,
          logo: {
            id: 1,
            alt: 'Uploaded Sky Wings logo',
            createdAt: '2026-07-21T00:00:00.000Z',
            updatedAt: '2026-07-21T00:00:00.000Z',
            height: 58,
            mimeType: 'image/svg+xml',
            url: '/api/media/file/uploaded-logo.svg',
            width: 122,
          },
        }}
      />,
    )

    const logo = container.querySelector('.brand-logo img') as HTMLImageElement

    expect(logo.getAttribute('alt')).toBe('Uploaded Sky Wings logo')
    expect(logo.getAttribute('src')).toBe('/api/media/file/uploaded-logo.svg')
    expect(logo.getAttribute('width')).toBe('122')
    expect(logo.getAttribute('height')).toBe('58')
  })
})
