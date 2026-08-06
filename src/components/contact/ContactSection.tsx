import Image from 'next/image'

import { RFQForm } from '@/components/forms/RFQForm'

export function ContactSection(props: { productInterest?: string; submitted?: boolean }) {
  const { productInterest, submitted } = props

  return (
    <section aria-labelledby="contact-title" className="contact-page">
      <div className="contact-stage">
        <figure className="contact-person-card">
          <Image
            alt="Mahfuzur Rahman speaking at an industry event"
            className="contact-person-image"
            fill
            priority
            sizes="(min-width: 1280px) 498px, (min-width: 1024px) 40vw, 100vw"
            src="/images/contact/mahfuzur-rahman.png"
          />

          <figcaption className="contact-person-caption">
            <span className="contact-person-copy">
              <strong>Mahfuzur Rahman</strong>
              <span>CEO</span>
              <small>Ornate Global Fashion</small>
            </span>
            <Image
              alt=""
              aria-hidden="true"
              className="contact-person-mark"
              height={47}
              src="/images/contact/ornate-mark.svg"
              width={50}
            />
          </figcaption>
        </figure>

        <div className="contact-form-border">
          <div className="contact-form-card">
            <div className="contact-form-content">
              <header className="contact-form-header">
                <h1 className="contact-title" id="contact-title">
                  Get In Touch
                </h1>
                <p className="contact-intro">
                  <strong>Send a direct message to our CEO</strong> — a pioneer in Bangladesh&apos;s
                  garments industry. Start a conversation and experience how effortless sourcing can
                  be.
                </p>
              </header>

              <RFQForm
                productInterest={productInterest}
                sourcePage="/contact"
                submitted={submitted}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
