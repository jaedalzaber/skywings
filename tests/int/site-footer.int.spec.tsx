import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { defaultFooterData } from '@/data/site'

describe('SiteFooter', () => {
  test('renders the updated Figma footer with editable site data', () => {
    const { container } = render(<SiteFooter footer={defaultFooterData} />)
    const footer = container.querySelector('footer.site-footer') as HTMLElement
    const footerQueries = within(footer)

    expect(footer.querySelector('.figma-footer-wordmark')?.textContent).toBe('Skywings')
    expect(footer.querySelector('.figma-footer-wordmark-art')?.getAttribute('src')).toContain(
      '/images/footer/skywings-wordmark.svg',
    )
    const gridImages = footer.querySelectorAll('.figma-footer-grid-art img')

    expect(gridImages).toHaveLength(2)
    expect(gridImages[0]?.getAttribute('src')).toContain('/images/footer/perspective-grid-left.svg')
    expect(footerQueries.getByRole('link', { name: 'info@skywings.ae' }).getAttribute('href')).toBe(
      'mailto:info@skywings.ae',
    )
    expect(footerQueries.getByRole('link', { name: '+971 54 242 9624' }).getAttribute('href')).toBe(
      'tel:+971542429624',
    )
    expect(footerQueries.getByRole('heading', { level: 2 }).textContent).toContain(
      'Subscribe to get the latest news',
    )
    expect(footerQueries.getByRole('navigation', { name: 'Legal' })).toBeTruthy()
    expect(screen.getByText(/Skywings\. All rights reserved\./)).toBeTruthy()
  })

  test('defines the mobile, tablet, and desktop Figma layouts', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(styles).toMatch(/footer\.site-footer\s*\{[^}]*background:\s*#ffffff;/s)
    expect(styles).toMatch(/@media \(min-width: 40rem\)/)
    expect(styles).toMatch(/@media \(min-width: 90rem\)/)
    expect(styles).toMatch(/--figma-footer-grid-cell:\s*calc\(100% \/ 29\)/)
    expect(styles).toMatch(/\.figma-footer-wordmark-art\s*\{[^}]*width:\s*calc\(100%/s)
    expect(styles).toMatch(/\.figma-footer-content\s*\{[^}]*max-width:\s*20\.0625rem;/s)
  })

  /*
   * The footer is full-bleed, so nothing about its own box says where the page
   * gutter is. Both of its blocks take the site's one container token rather
   * than a width of their own, or they sit outside every section above them.
   */
  test('lines its blocks up with the shared page container', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')

    expect(styles).toMatch(/\.figma-footer-wordmark\s*\{[^}]*width:\s*var\(--page-content\);/s)
    expect(styles).toMatch(/\.figma-footer-content\s*\{[^}]*width:\s*var\(--page-content\);/s)
    expect(styles).toMatch(
      /\.figma-footer-wordmark,\s*\.figma-footer-content \{\s*width:\s*var\(--page-content\);/s,
    )
    // The container it used to carry, wider than the page at every viewport.
    expect(styles).not.toMatch(/width:\s*min\(82\.5vw,\s*99rem\)/)
  })
})
