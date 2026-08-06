import { createRFQ } from '@/actions/rfq'

export function RFQForm(props: {
  productInterest?: string
  sourcePage: string
  submitted?: boolean
}) {
  const { productInterest, sourcePage, submitted } = props

  return (
    <div className="form-panel contact-message-form" id="rfq-form">
      {submitted ? (
        <div className="form-success" role="status">
          <strong>Message received.</strong>
          <p>Thank you. Our CEO will be in touch soon.</p>
        </div>
      ) : null}

      <form action={createRFQ}>
        <input name="sourcePage" type="hidden" value={sourcePage} />
        {productInterest ? (
          <input name="productInterest" type="hidden" value={productInterest} />
        ) : null}

        <label className="contact-field contact-field-name">
          <span>Name</span>
          <input autoComplete="name" name="buyerName" placeholder="name" required />
        </label>

        <div className="contact-field-row">
          <label className="contact-field">
            <span>Email address</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="Email address"
              required
              type="email"
            />
          </label>

          <label className="contact-field">
            <span>Phone (optional)</span>
            <input autoComplete="tel" name="phone" placeholder="Phone" type="tel" />
          </label>
        </div>

        <label className="contact-field contact-field-message">
          <span>Your message</span>
          <textarea
            minLength={10}
            name="message"
            placeholder="The more detail the better..."
            required
            rows={4}
          />
        </label>

        <div className="contact-submit-group">
          <button aria-describedby="contact-response-note" type="submit">
            Send message
          </button>
          <p id="contact-response-note">Our CEO will reach out to you very soon.</p>
        </div>
      </form>
    </div>
  )
}
