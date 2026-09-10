import { RFQForm } from '@/components/forms/RFQForm'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import type { SiteFooterData } from '@/data/site'
import type { ContactRFQBlock } from '@/payload-types'

import { telHref } from './tel'

type Props = {
  block: Pick<ContactRFQBlock, 'contactEmail' | 'contactPhone' | 'description' | 'eyebrow' | 'heading'>
  error?: boolean
  footer: Pick<SiteFooterData, 'emailAddress' | 'phoneNumbers'>
  productInterest?: string
  submitted?: boolean
}

/**
 * Where every "Get in touch" on the site lands.
 *
 * A dark page in the capabilities page's language: the word "Contact" set
 * large across the top over a hairline, then the brief on the left -- what to
 * send, and the direct lines for anyone who would rather write or call -- and
 * the enquiry form on the right. The copy is the Contact page's block in the
 * admin; the email and phone fall back to the Footer's.
 */
export function ContactSection({ block, error, footer, productInterest, submitted }: Props) {
  const email = block.contactEmail?.trim() || footer.emailAddress
  const phone = block.contactPhone?.trim() || footer.phoneNumbers[0]

  return (
    <section aria-labelledby="contact-title" className="contact-hero">
      <div className="contact-inner">
        <header className="contact-head">
          <Reveal as="h1" className="contact-title" id="contact-title" motion="fade">
            Contact
          </Reveal>
          <Reveal as="p" className="contact-head-email" delay={0.15}>
            <a href={`mailto:${email}`}>{email}</a>
          </Reveal>
        </header>

        <div className="contact-body">
          <RevealGroup className="contact-brief" stagger={0.08}>
            {block.eyebrow ? (
              <RevealItem as="p" className="contact-eyebrow">
                {block.eyebrow}
              </RevealItem>
            ) : null}
            <RevealItem as="h2" className="contact-lead">
              {block.heading}
            </RevealItem>
            {block.description ? (
              <RevealItem as="p" className="contact-intro">
                {block.description}
              </RevealItem>
            ) : null}

            <RevealItem as="dl" className="contact-direct">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${email}`}>{email}</a>
                </dd>
              </div>
              {phone ? (
                <div>
                  <dt>Call</dt>
                  <dd>
                    <a href={telHref(phone)}>{phone}</a>
                  </dd>
                </div>
              ) : null}
            </RevealItem>
          </RevealGroup>

          <Reveal className="contact-form-column" delay={0.1}>
            <RFQForm
              error={error}
              productInterest={productInterest}
              sourcePage="/contact"
              submitted={submitted}
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
