'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import type { SiteHeaderData } from '@/data/site'

import { HeaderSurfaceController } from './HeaderSurfaceController'

type SiteHeaderProps = {
  header: SiteHeaderData
}

function isDisabledNavigationItem(item: SiteHeaderData['navigation'][number]) {
  const href = item.href.trim()

  return (
    href === '#' ||
    href === '' ||
    (href === '/' && item.label.trim().toLowerCase() === 'industries')
  )
}

export function SiteHeader(props: SiteHeaderProps) {
  const { header } = props
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const logo = header.logo?.url ? header.logo : null
  const logoUrl = logo?.url || '/images/header/logo.svg'
  const logoIsSvg = logo?.mimeType === 'image/svg+xml' || /\.svg(?:\?.*)?$/i.test(logoUrl)

  const mobileNavigation = useMemo(() => {
    return header.navigation.map((item, index) => ({
      ...item,
      key: item.id ?? `${item.href}-${index}`,
    }))
  }, [header.navigation])

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    setExpanded((current) => {
      const next: Record<string, boolean> = {}

      mobileNavigation.forEach((item) => {
        if (item.children?.length) {
          next[item.key] = current[item.key] ?? true
        }
      })

      return next
    })
  }, [mobileNavigation])

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
          {header.navigation.map((item) => {
            const itemDisabled = isDisabledNavigationItem(item)

            return (
              <div className="nav-item" key={item.id ?? item.href}>
                {itemDisabled ? (
                  <button aria-disabled="true" className="nav-link-control" type="button">
                    <span>{item.label}</span>
                    {item.children?.length ? (
                      <span aria-hidden="true" className="nav-chevron" />
                    ) : null}
                  </button>
                ) : (
                  <a href={item.href}>
                    <span>{item.label}</span>
                    {item.children?.length ? (
                      <span aria-hidden="true" className="nav-chevron" />
                    ) : null}
                  </a>
                )}
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
            )
          })}
        </nav>

        <div className="nav-actions">
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
            {mobileNavigation.map((item) => {
              const itemDisabled = isDisabledNavigationItem(item)

              return item.children?.length ? (
                <section className="mobile-nav-section" key={item.key}>
                  <button
                    aria-controls={`mobile-${item.key}-links`}
                    aria-expanded={expanded[item.key] ?? true}
                    className="mobile-nav-section-toggle"
                    onClick={() =>
                      setExpanded((current) => ({
                        ...current,
                        [item.key]: !(current[item.key] ?? true),
                      }))
                    }
                    type="button"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true" className="mobile-nav-accordion-chevron" />
                  </button>
                  {(expanded[item.key] ?? true) ? (
                    <div className="mobile-nav-sublist" id={`mobile-${item.key}-links`}>
                      {itemDisabled ? null : (
                        <Link href={item.href} onClick={() => closeMenu()}>
                          {item.label}
                        </Link>
                      )}
                      {item.children.map((child) => (
                        <Link
                          href={child.href}
                          key={child.id ?? child.href}
                          onClick={() => closeMenu()}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : itemDisabled ? (
                <span
                  aria-disabled="true"
                  className="mobile-nav-primary-link mobile-nav-disabled-link"
                  key={item.key}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  className="mobile-nav-primary-link"
                  href={item.href}
                  key={item.key}
                  onClick={() => closeMenu()}
                >
                  {item.label}
                </Link>
              )
            })}
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
