import type { SiteFooterData } from '@/data/site'
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
 * The foot of every page, in three bands under the wordmark: the site's own
 * sections beside the newsletter, then how to reach the company, then the
 * legal line. Each band is separated by a rule, and each reads on its own --
 * the first is for going somewhere else, the second for getting in touch, and
 * the last is the small print.
 *
 * The newsletter sits up in the first band rather than below it because the
 * sections only fill the left of the page: two columns of links against the
 * width of the footer left a hole in the top right, and the form is the one
 * thing here big enough to fill it.
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
          </div>
        </div>

        <div className="figma-footer-main">
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
