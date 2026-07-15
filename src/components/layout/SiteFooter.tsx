import type { SiteFooterData } from '@/data/site'

import { FooterNewsletterForm } from './FooterNewsletterForm'

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function SiteFooter(props: { footer: SiteFooterData }) {
  const { footer } = props

  return (
    <footer className="site-footer" data-nav-surface="white" data-scroll-snap="section">
      <div aria-hidden="true" className="footer-talk-grid">
        <span>{footer.headline}</span>
      </div>

      <div className="footer-content">
        <div className="footer-contact-column">
          <dl className="footer-contact-list">
            <div>
              <dt>{footer.emailLabel}</dt>
              <dd>
                <a href={`mailto:${footer.emailAddress}`}>{footer.emailAddress}</a>
              </dd>
            </div>
            <div>
              <dt>{footer.phoneLabel}</dt>
              <dd>
                {footer.phoneNumbers.map((phone) => (
                  <a href={phoneHref(phone)} key={phone}>
                    {phone}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="footer-main-column">
          <div className="footer-main-top">
            <div className="footer-groups">
              {footer.linkGroups.map((group) => (
                <nav
                  aria-label={group.heading}
                  className="footer-group"
                  key={group.id ?? group.heading}
                >
                  {group.links?.map((link) => (
                    <a
                      href={link.href}
                      key={link.id ?? `${group.heading}-${link.label}-${link.href}`}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              ))}
            </div>

            <div className="footer-newsletter">
              <h2>{footer.newsletterHeading}</h2>
              <FooterNewsletterForm
                buttonLabel={footer.newsletterButtonLabel}
                placeholder={footer.newsletterPlaceholder}
              />
              <p>
                {footer.newsletterPrivacyText}{' '}
                {footer.newsletterPrivacyLinks.map((link) => (
                  <a href={link.href} key={link.id ?? `${link.label}-${link.href}`}>
                    {link.label}
                  </a>
                ))}
              </p>
            </div>
          </div>

          <div className="footer-lower-row">
            <div className="footer-addresses">
              {footer.addresses.map((location) => (
                <address key={location.id ?? location.address}>
                  <span>{location.address}</span>
                  {location.phone ? <a href={phoneHref(location.phone)}>{location.phone}</a> : null}
                </address>
              ))}
            </div>
            <nav aria-label="Legal" className="footer-legal-links">
              {footer.legalLinks.map((link) => (
                <a href={link.href} key={link.id ?? link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <p className="footer-copyright">{footer.copyright}</p>
      </div>
    </footer>
  )
}
