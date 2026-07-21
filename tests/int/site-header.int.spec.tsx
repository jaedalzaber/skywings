import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { SiteHeader } from '@/components/layout/SiteHeader'
import type { SiteHeaderData } from '@/data/site'

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

  test('uses an opaque unblurred surface while the manufacturing process scene is active', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(styles).toMatch(
      /\.topbar\s*\{[^}]*background:\s*var\(--nav-surface,[^;]+;[^}]*backdrop-filter:\s*var\(--nav-backdrop,[^;]+;/s,
    )
    expect(styles).toMatch(
      /html\[data-process-nav-active='true'\]\s*\{[^}]*--nav-surface:\s*#fff;[^}]*--nav-backdrop:\s*none;/s,
    )
  })

  test('uses an unoptimized native image for the bundled fallback favicon', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/layout/SiteHeader.tsx'),
      'utf8',
    )

    expect(source).toMatch(/<img alt="" height=\{24\} src="\/favicon\.png" width=\{38\} \/>/)
  })
})
