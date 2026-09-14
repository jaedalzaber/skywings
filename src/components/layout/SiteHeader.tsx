'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { SafeImage as Image } from '@/components/atoms/SafeImage'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import type { SiteHeaderData } from '@/data/site'

import { BrandLogoSpin } from './BrandLogoSpin'
import { HeaderSurfaceController } from './HeaderSurfaceController'

type SiteHeaderProps = {
  header: SiteHeaderData
}

/**
 * A menu entry that is shown but leads nowhere: either an editor switched it
 * off in the Header global while the page behind it is written, or it was
 * never given an address. It is still announced, so the shape of the range
 * reads whole, and it is still reachable by keyboard -- it simply says it is
 * unavailable rather than pretending to be missing.
 */
function DeadLink(props: { children: ReactNode; className?: string }) {
  /*
   * An anchor with no address, which is not a link at all: it is read out as
   * plain text rather than as something broken, and it takes the menu's own
   * styling without a second set of rules to keep in step.
   */
  return (
    <a aria-disabled="true" className={props.className}>
      {props.children}
    </a>
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

  /*
   * The mark is a single-color silhouette, so the brand blue is painted on
   * rather than baked into the asset: the wrapper takes the logo as a mask and
   * fills it with the token. Handing the URL to CSS this way keeps it working
   * for whichever logo is in play — the one uploaded to the CMS or the
   * committed fallback.
   */
  const symbol = header.logoSymbol?.url ? header.logoSymbol : null

  /*
   * The scrolled bar swaps the mask to the compact symbol and narrows to suit
   * it. Its width comes from the upload's own aspect ratio rather than a fixed
   * value, so a square mark and a wide one both sit correctly at the stuck
   * height; without a symbol both variables stay unset and the CSS falls back
   * to scaling the full lockup.
   */
  const symbolAspect = symbol?.width && symbol?.height ? symbol.width / symbol.height : null

  /*
   * The turn is seen in depth, and depth is a property of the box the mark
   * turns inside -- so it is set on the link, not on the mark. Set on the mark
   * itself it would be read by nothing: a custom property reaches downwards.
   */
  const brandStyle = {
    '--brand-perspective': `${header.logoMotion.perspectiveRem}rem`,
  } as CSSProperties

  const logoStyle = {
    '--brand-logo-src': `url("${logoUrl}")`,
    ...(symbol?.url ? { '--brand-symbol-src': `url("${symbol.url}")` } : {}),
    ...(symbolAspect
      ? { '--brand-symbol-width': `calc(2.25rem * ${symbolAspect.toFixed(4)})` }
      : {}),
  } as CSSProperties

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
      <BrandLogoSpin motion={header.logoMotion} />
      <div aria-hidden="true" className="nav-spacer" />
      {/*
       * The bar sets itself out on load: the mark, then the sections one at a
       * time, then the call to action. Staged on the contents rather than on
       * .nav-container, which is the sticky element -- a transform there would
       * make it the containing block for anything fixed inside it, and the bar
       * is the one part of the page that is always on screen.
       */}
      <RevealGroup amount={0} className="topbar" delay={0.12} stagger={0.06}>
        {/* The mark takes only the room it needs, inside a half of the bar
            that takes the rest; see .nav-start. */}
        <div className="nav-start">
          <Link
            aria-label={`${header.brandName} home`}
            className="brand"
            href="/"
            style={brandStyle}
          >
            <RevealItem as="span" className="brand-logo" style={logoStyle}>
              {logoImage}
            </RevealItem>
          </Link>
        </div>

        <nav aria-label="Site sections" className="nav-links">
          {header.navigation.map((item) => {
            const hasGroups = Boolean(item.children?.some((child) => child.children?.length))

            return (
              <RevealItem
                className={hasGroups ? 'nav-item nav-item--mega' : 'nav-item'}
                key={item.id ?? item.href}
              >
                {item.disabled ? (
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
                  <div className={hasGroups ? 'nav-submenu nav-submenu--mega' : 'nav-submenu'}>
                    {item.children.map((child, childIndex) => {
                      const childKey = child.id ?? `${child.href}-${childIndex}`

                      // A child with its own children becomes a titled column
                      // (industry -> product families) instead of a flat link.
                      return child.children?.length ? (
                        <div className="nav-submenu-group" key={childKey}>
                          {child.disabled ? (
                            <DeadLink className="nav-submenu-heading">{child.label}</DeadLink>
                          ) : (
                            <a className="nav-submenu-heading" href={child.href}>
                              {child.label}
                            </a>
                          )}
                          {child.children.map((grandchild, grandchildIndex) => {
                            const grandchildKey =
                              grandchild.id ?? `${grandchild.href}-${grandchildIndex}`

                            return grandchild.disabled ? (
                              <DeadLink key={grandchildKey}>{grandchild.label}</DeadLink>
                            ) : (
                              <a href={grandchild.href} key={grandchildKey}>
                                {grandchild.label}
                              </a>
                            )
                          })}
                        </div>
                      ) : child.disabled ? (
                        <DeadLink key={childKey}>{child.label}</DeadLink>
                      ) : (
                        <a href={child.href} key={childKey}>
                          {child.label}
                        </a>
                      )
                    })}
                  </div>
                ) : null}
              </RevealItem>
            )
          })}
        </nav>

        {/* The badge and the button travel together, so the sections
            between them and the mark stay centred in the bar. */}
        <div className="nav-end">
          {/*
           * Two copies of the same badge, one drawn for a dark bar and one for
           * a light one, and the stylesheet shows whichever suits the surface:
           * the lettering is white in the artwork, so on the white bar it would
           * otherwise disappear. The wrapper carries the name; the pictures are
           * decoration either way.
           */}
          {header.proudBadge ? (
            <RevealItem as="span" aria-label="Proud of UAE" className="nav-proud" role="img">
              <Image
                alt=""
                aria-hidden="true"
                className="nav-proud-art nav-proud-art--light"
                height={96}
                src="/images/header/proud-of-uae.png"
                width={512}
              />
              <Image
                alt=""
                aria-hidden="true"
                className="nav-proud-art nav-proud-art--dark"
                height={96}
                src="/images/header/proud-of-uae-dark.png"
                width={512}
              />
            </RevealItem>
          ) : null}

          <RevealItem className="nav-actions">
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
          </RevealItem>
        </div>

        <RevealItem
          as="button"
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
        </RevealItem>
      </RevealGroup>

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
                <span className="brand-logo" style={logoStyle}>
                  {logoImage}
                </span>
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
                      {item.disabled ? null : (
                        <Link href={item.href} onClick={() => closeMenu()}>
                          {item.label}
                        </Link>
                      )}
                      {item.children.map((child, childIndex) => {
                        const childKey = child.id ?? `${child.href}-${childIndex}`

                        return child.children?.length ? (
                          <div className="mobile-nav-product-group" key={childKey}>
                            {child.disabled ? (
                              <DeadLink className="mobile-nav-product-heading">
                                {child.label}
                              </DeadLink>
                            ) : (
                              <Link
                                className="mobile-nav-product-heading"
                                href={child.href}
                                onClick={() => closeMenu()}
                              >
                                {child.label}
                              </Link>
                            )}
                            {child.children.map((grandchild, grandchildIndex) => {
                              const grandchildKey =
                                grandchild.id ?? `${grandchild.href}-${grandchildIndex}`

                              return grandchild.disabled ? (
                                <DeadLink key={grandchildKey}>{grandchild.label}</DeadLink>
                              ) : (
                                <Link
                                  href={grandchild.href}
                                  key={grandchildKey}
                                  onClick={() => closeMenu()}
                                >
                                  {grandchild.label}
                                </Link>
                              )
                            })}
                          </div>
                        ) : child.disabled ? (
                          <DeadLink key={childKey}>{child.label}</DeadLink>
                        ) : (
                          <Link href={child.href} key={childKey} onClick={() => closeMenu()}>
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </section>
              ) : item.disabled ? (
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
