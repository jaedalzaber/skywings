'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { SiteHeaderData } from '@/data/site'

import { HeaderSurfaceController } from './HeaderSurfaceController'

type SiteHeaderProps = {
  header: SiteHeaderData
}

type DrawerLink = {
  href: string
  label: string
}

type ProductGroup = DrawerLink & {
  children?: DrawerLink[]
}

const defaultIndustryLinks: DrawerLink[] = [
  { href: '/industries/construction-and-infrastructure', label: 'Construction & Infrastructure' },
  {
    href: '/industries/architectural-and-interior-metalwork',
    label: 'Architectural & Interior Metalwork',
  },
  { href: '/industries/heavy-equipment-and-machinery', label: 'Heavy Equipment & Machinery' },
  {
    href: '/industries/aviation-ground-support-equipment',
    label: 'Aviation Ground Support Equipment',
  },
  { href: '/industries/industrial-manufacturing', label: 'Industrial Manufacturing' },
]

const defaultProductGroups: ProductGroup[] = [
  {
    href: '/industries/aviation-ground-support-equipment',
    label: 'Aviation',
    children: [
      { href: '/products/folding-stand', label: 'Folding Stand' },
      { href: '/products/straight-ladders', label: 'Straight Ladders' },
      { href: '/products/cowl-pylon-ladders', label: 'Cowl Pylon Ladders' },
    ],
  },
  { href: '/industries/construction-and-infrastructure', label: 'Construction' },
  {
    href: '/industries/architectural-and-interior-metalwork',
    label: 'Exterior & Interior',
  },
  { href: '/products', label: 'Brackets & Support Structures' },
  { href: '/products/equipment-panels-and-enclosures', label: 'Equipment Panels & Enclosures' },
]

function matchesNavigation(item: SiteHeaderData['navigation'][number], value: string) {
  return item.label.toLowerCase().includes(value) || item.href.toLowerCase().includes(value)
}

export function SiteHeader(props: SiteHeaderProps) {
  const { header } = props
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState({ industries: true, products: true })
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const logo = header.logo?.url ? header.logo : null
  const logoUrl = logo?.url || '/images/header/logo.svg'
  const logoIsSvg = logo?.mimeType === 'image/svg+xml' || /\.svg(?:\?.*)?$/i.test(logoUrl)

  const navigation = useMemo(() => {
    const industries = header.navigation.find((item) => matchesNavigation(item, 'industr'))
    const products = header.navigation.find((item) => matchesNavigation(item, 'product'))
    const capabilities = header.navigation.find((item) => matchesNavigation(item, 'capabilit'))
    const resources = header.navigation.find(
      (item) => matchesNavigation(item, 'resour') || matchesNavigation(item, '/blog'),
    )
    const about = header.navigation.find((item) => matchesNavigation(item, 'about'))
    const industryChildren: DrawerLink[] =
      industries?.children?.map((item) => ({ href: item.href, label: item.label })) ?? []
    const productChildren: DrawerLink[] =
      products?.children?.map((item) => ({ href: item.href, label: item.label })) ?? []

    return {
      about: { href: about?.href || '/#about', label: 'About Us' },
      capabilities: { href: capabilities?.href || '/capabilities', label: 'Capabilities' },
      industries: industryChildren.length > 0 ? industryChildren : defaultIndustryLinks,
      products:
        productChildren.length > 0
          ? [
              {
                children: productChildren,
                href: products?.href || '/products',
                label: 'Products',
              },
            ]
          : defaultProductGroups,
      resources: { href: resources?.href || '/blog', label: 'Resources' },
    }
  }, [header.navigation])

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.dataset.mobileNavOpen = 'true'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu(true)
        return
      }

      if (event.key !== 'Tab') return

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      delete document.documentElement.dataset.mobileNavOpen
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const logoImage = (
    <Image
      alt={logo?.alt || header.brandName}
      height={logo?.height || 29}
      priority
      src={logoUrl}
      unoptimized={logoIsSvg}
      width={logo?.width || 61}
    />
  )

  return (
    <header aria-label="Primary navigation" className="nav-container">
      <HeaderSurfaceController />
      <div aria-hidden="true" className="nav-spacer" />
      <div className="topbar">
        <Link aria-label={`${header.brandName} home`} className="brand" href="/">
          <span className="brand-logo">{logoImage}</span>
        </Link>

        <nav aria-label="Site sections" className="nav-links">
          {header.navigation.map((item) => (
            <div className="nav-item" key={item.id ?? item.href}>
              <a href={item.href}>
                <span>{item.label}</span>
                {item.children?.length ? <span aria-hidden="true" className="nav-chevron" /> : null}
              </a>
              {item.children?.length ? (
                <div className="nav-submenu">
                  {item.children.map((child) => (
                    <a href={child.href} key={child.id ?? child.href}>
                      {child.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="nav-actions">
          <button aria-label="Language selector" className="language-selector" type="button">
            <span>EN</span>
            <span aria-hidden="true" className="nav-chevron" />
          </button>
          {header.cta ? (
            <a
              className="nav-cta"
              href={header.cta.href}
              rel={header.cta.openInNewTab ? 'noreferrer' : undefined}
              target={header.cta.openInNewTab ? '_blank' : undefined}
            >
              {header.cta.label}
            </a>
          ) : null}
        </div>

        <button
          aria-controls="mobile-navigation-drawer"
          aria-expanded={menuOpen}
          aria-label="Open navigation menu"
          className="mobile-nav-toggle"
          onClick={() => setMenuOpen(true)}
          ref={menuButtonRef}
          type="button"
        >
          <span aria-hidden="true" className="mobile-nav-menu-icon">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div
          aria-label="Mobile navigation"
          aria-modal="true"
          className="mobile-nav-drawer"
          id="mobile-navigation-drawer"
          ref={drawerRef}
          role="dialog"
        >
          <div className="mobile-nav-drawer-header">
            <div className="mobile-nav-drawer-topbar">
              <Link
                aria-label={`${header.brandName} home`}
                className="mobile-nav-brand"
                href="/"
                onClick={() => closeMenu()}
              >
                <span className="brand-logo">{logoImage}</span>
              </Link>
              <button
                aria-label="Close navigation menu"
                className="mobile-nav-close"
                onClick={() => closeMenu(true)}
                ref={closeButtonRef}
                type="button"
              >
                <span aria-hidden="true" />
              </button>
            </div>
          </div>

          <nav aria-label="Mobile site sections" className="mobile-nav-content">
            <section className="mobile-nav-section">
              <button
                aria-controls="mobile-industries-links"
                aria-expanded={expanded.industries}
                className="mobile-nav-section-toggle"
                onClick={() =>
                  setExpanded((current) => ({ ...current, industries: !current.industries }))
                }
                type="button"
              >
                <span>Industries</span>
                <span aria-hidden="true" className="mobile-nav-accordion-chevron" />
              </button>
              {expanded.industries ? (
                <div className="mobile-nav-sublist" id="mobile-industries-links">
                  {navigation.industries.map((item) => (
                    <Link href={item.href} key={item.href} onClick={() => closeMenu()}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="mobile-nav-section">
              <button
                aria-controls="mobile-products-links"
                aria-expanded={expanded.products}
                className="mobile-nav-section-toggle"
                onClick={() =>
                  setExpanded((current) => ({ ...current, products: !current.products }))
                }
                type="button"
              >
                <span>Products</span>
                <span aria-hidden="true" className="mobile-nav-accordion-chevron" />
              </button>
              {expanded.products ? (
                <div className="mobile-nav-product-list" id="mobile-products-links">
                  {navigation.products.map((group) => (
                    <div className="mobile-nav-product-group" key={`${group.label}-${group.href}`}>
                      <Link
                        className="mobile-nav-product-heading"
                        href={group.href}
                        onClick={() => closeMenu()}
                      >
                        {group.label}
                      </Link>
                      {group.children?.map((item) => (
                        <Link href={item.href} key={item.href} onClick={() => closeMenu()}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            {[navigation.capabilities, navigation.resources, navigation.about].map((item) => (
              <Link
                className="mobile-nav-primary-link"
                href={item.href}
                key={item.label}
                onClick={() => closeMenu()}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-nav-contact-wrap">
            <Link
              className="mobile-nav-contact"
              href={header.cta?.href || '/contact'}
              onClick={() => closeMenu()}
            >
              {header.cta?.label || 'Contact'}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
