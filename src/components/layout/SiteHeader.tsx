import Image from 'next/image'
import Link from 'next/link'

import type { SiteHeaderData } from '@/data/site'

import { HeaderSurfaceController } from './HeaderSurfaceController'

type SiteHeaderProps = {
  header: SiteHeaderData
}

export function SiteHeader(props: SiteHeaderProps) {
  const { header } = props
  const logo = header.logo?.url ? header.logo : null
  const logoUrl = logo?.url

  return (
    <header className="nav-container" aria-label="Primary navigation">
      <HeaderSurfaceController />
      <div className="nav-spacer" aria-hidden="true" />
      <div className="topbar">
        <Link className="brand" href="/" aria-label={`${header.brandName} home`}>
          {logo && logoUrl ? (
            <span className="brand-logo">
              <Image
                alt={logo.alt || header.brandName}
                height={logo.height || 38}
                src={logoUrl}
                width={logo.width || 83}
              />
            </span>
          ) : (
            <span className="brand-wordmark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" height={24} src="/favicon.png" width={38} />
              <span>Sky Wings</span>
            </span>
          )}
        </Link>

        <nav className="nav-links" aria-label="Site sections">
          {header.navigation.map((item) => (
            <div className="nav-item" key={item.id ?? item.href}>
              <a href={item.href}>
                <span>{item.label}</span>
                {item.children?.length ? <span className="nav-chevron" aria-hidden="true" /> : null}
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
          <button className="language-selector" type="button" aria-label="Language selector">
            <span>EN</span>
            <span className="nav-chevron" aria-hidden="true" />
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
      </div>
    </header>
  )
}
