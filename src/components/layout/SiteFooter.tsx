import type { SiteFooterData } from '@/data/site'
import Image from 'next/image'

import { FooterNewsletterForm } from './FooterNewsletterForm'

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

function FooterPrivacyNotice(props: { footer: SiteFooterData }) {
  const { footer } = props
  const localPrivacyLink = footer.legalLinks.find((link) => /privacy/i.test(link.label))
  const googlePrivacyLink = footer.newsletterPrivacyLinks.find((link) =>
    /privacy/i.test(link.label),
  )
  const termsLink = footer.newsletterPrivacyLinks.find((link) => /terms/i.test(link.label))

  const linkTokens = {
    '{googlePrivacy}': googlePrivacyLink,
    '{privacyLink}': localPrivacyLink ? { href: localPrivacyLink.href, label: 'link' } : undefined,
    '{terms}': termsLink,
  }
  const parts = footer.newsletterPrivacyText.split(/(\{googlePrivacy\}|\{privacyLink\}|\{terms\})/g)

  return (
    <p className="figma-footer-privacy">
      {parts.map((part, index) => {
        const link = linkTokens[part as keyof typeof linkTokens]

        return link ? (
          <a href={link.href} key={`${part}-${index}`}>
            {link.label}
          </a>
        ) : (
          part
        )
      })}
    </p>
  )
}

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
        <div className="figma-footer-contact-details">
          <div className="figma-footer-contact-column">
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

          <div className="figma-footer-addresses">
            {footer.addresses.map((location) => (
              <address key={location.id ?? location.address}>
                <span>{location.address}</span>
                {location.phone ? <a href={phoneHref(location.phone)}>{location.phone}</a> : null}
              </address>
            ))}
          </div>
        </div>

        <div className="figma-footer-newsletter">
          <h2>{footer.newsletterHeading}</h2>
          <FooterNewsletterForm
            buttonLabel={footer.newsletterButtonLabel}
            placeholder={footer.newsletterPlaceholder}
          />
          <FooterPrivacyNotice footer={footer} />
        </div>

        <div className="figma-footer-navigation-row">
          <div className="figma-footer-groups">
            {footer.linkGroups.map((group) => (
              <nav
                aria-label={group.heading}
                className="figma-footer-group"
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

          <nav aria-label="Legal" className="figma-footer-legal-links">
            {footer.legalLinks.map((link) => (
              <a href={link.href} key={link.id ?? link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <p className="figma-footer-copyright">{footer.copyright}</p>
      </div>
    </footer>
  )
}
