import { RFQForm } from '@/components/forms/RFQForm'
import type { SiteFooterData } from '@/data/site'

import { ContactBranches } from './ContactBranches'
import { PlaneWatermark } from './contact-art'
import { telHref } from './tel'

/**
 * Contact page section (light, form-forward). Copy comes from the contactRFQ
 * block; contact details and branches come from the Footer global, which
 * already holds the email, phone numbers, and both branch addresses.
 */
export function ContactSection(props: {
  description?: string | null
  eyebrow?: string | null
  footer: SiteFooterData
  heading: string
  productInterest?: string
  submitted?: boolean
}) {
  const { description, eyebrow, footer, heading, productInterest, submitted } = props
  const [primaryPhone] = footer.phoneNumbers

  return (
    <section aria-labelledby="contact-title" className="contact-page">
      <div className="contact-hero">
        <PlaneWatermark className="contact-plane" />
        <div className="contact-hero-inner">
          <div className="contact-hero-copy">
            {eyebrow ? <p className="contact-eyebrow">{eyebrow}</p> : null}
            <h1 className="contact-title" id="contact-title">
              {heading}
            </h1>

            <dl className="contact-channels">
              <div className="contact-channel">
                <dt>
                  <a href={`mailto:${footer.emailAddress}`}>{footer.emailLabel}</a>
                </dt>
                <dd>
                  <a href={`mailto:${footer.emailAddress}`}>{footer.emailAddress}</a>
                </dd>
              </div>

              <div className="contact-channel">
                <dt>
                  {primaryPhone ? (
                    <a href={telHref(primaryPhone)}>{footer.phoneLabel}</a>
                  ) : (
                    footer.phoneLabel
                  )}
                </dt>
                <dd>
                  <ul className="contact-phone-list" role="list">
                    {footer.phoneNumbers.map((phone) => (
                      <li key={phone}>
                        <a href={telHref(phone)}>{phone}</a>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {description ? <p className="contact-blurb">{description}</p> : null}
          </div>

          <div className="contact-form-card">
            <h2 className="contact-form-title">Request a Quote</h2>
            <p className="contact-form-note">
              Share a drawing, sample, or requirement — the team responds with an
              engineering-led quote.
            </p>
            <RFQForm productInterest={productInterest} sourcePage="/contact" submitted={submitted} />
          </div>
        </div>
      </div>

      <ContactBranches footer={footer} />
    </section>
  )
}
