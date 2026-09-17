import type { FooterCertification, SiteFooterData } from '@/data/site'
import { SafeImage as Image } from '@/components/atoms/SafeImage'

import { FooterNewsletterForm } from './FooterNewsletterForm'

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

/**
 * The place an address is in, to head the lines beneath it.
 *
 * Taken from the address rather than stored beside it: every address on the
 * site ends "..., <city>, <country>", and asking an editor to type the city a
 * second time is asking for the two to disagree. An address written some
 * other way simply gets no heading, which reads as it always did.
 */
function cityOf(address: string) {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return parts.length >= 2 ? parts[parts.length - 2] : null
}

/**
 * Certification badges, each opening its certificate PDF in a new tab. A
 * badge with no certificate attached is shown but is not a link.
 */
function FooterCertifications(props: { certifications: FooterCertification[] }) {
  const { certifications } = props

  if (!certifications.length) return null

  return (
    <ul aria-label="Certifications" className="figma-footer-certifications">
      {certifications.map((certification) => {
        const badge = (
          <Image
            alt={certification.label}
            className="figma-footer-certification-badge"
            height={certification.badge.height ?? 160}
            sizes="7.2rem"
            src={certification.badge.url}
            width={certification.badge.width ?? 160}
          />
        )

        return (
          <li key={certification.id}>
            {certification.certificateUrl ? (
              <a
                aria-label={`${certification.label} certificate (PDF, opens in a new tab)`}
                href={certification.certificateUrl}
                rel="noopener noreferrer"
                target="_blank"
                title={`${certification.label} certificate`}
              >
                {badge}
              </a>
            ) : (
              badge
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * The foot of every page, in three bands under the wordmark: the site's own
 * sections beside the newsletter and the ways to get in touch, then the
 * certifications beside the addresses, then the legal line. Each band is
 * separated by a rule.
 *
 * The email and phones sit under the form in the same right-hand half, split
 * into its two columns, so they line up with the two addresses below the rule.
 */
export function SiteFooter(props: { footer: SiteFooterData }) {
  const { footer } = props

  return (
    <footer className="site-footer" data-nav-surface="white">
      <div className="figma-footer-wordmark">
        <div aria-hidden="true" className="figma-footer-grid-art">
          <span>
            <Image alt="" fill sizes="45vw" src="/images/footer/perspective-grid-left.svg" />
          </span>
          <span>
            <Image alt="" fill sizes="55vw" src="/images/footer/perspective-grid-right.svg" />
          </span>
        </div>
        <Image
          alt=""
          className="figma-footer-wordmark-art"
          height={119}
          priority
          sizes="(min-width: 40rem) 77vw, 90vw"
          src="/images/footer/skywings-wordmark.svg"
          width={790}
        />
        <span className="sr-only">{footer.headline}</span>
      </div>

      <div className="figma-footer-content">
        <div className="figma-footer-top">
          {/* Where the site goes, headed by the part of it each column covers. */}
          <div className="figma-footer-groups">
            {footer.linkGroups.map((group) => (
              <nav
                aria-label={group.heading}
                className="figma-footer-group"
                key={group.id ?? group.heading}
              >
                <h2 className="figma-footer-group-heading">{group.heading}</h2>
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

          <div className="figma-footer-newsletter">
            <h2>{footer.newsletterHeading}</h2>
            <FooterNewsletterForm
              buttonLabel={footer.newsletterButtonLabel}
              placeholder={footer.newsletterPlaceholder}
            />
            <dl className="figma-footer-contact-list">
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
        </div>

        <div className="figma-footer-main">
          <FooterCertifications certifications={footer.certifications} />

          <div className="figma-footer-addresses">
            {footer.addresses.map((location) => {
              const city = cityOf(location.address)

              return (
                <address key={location.id ?? location.address}>
                  {city ? <strong>{city}</strong> : null}
                  <span>{location.address}</span>
                  {location.phone ? <a href={phoneHref(location.phone)}>{location.phone}</a> : null}
                </address>
              )
            })}
          </div>
        </div>

        <div className="figma-footer-bottom">
          <p className="figma-footer-copyright">{footer.copyright}</p>
          <nav aria-label="Legal" className="figma-footer-legal-links">
            {footer.legalLinks.map((link) => (
              <a href={link.href} key={link.id ?? link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
