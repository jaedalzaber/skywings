import { createRFQ } from '@/actions/rfq'

/**
 * The enquiry form: what the sender needs, then who they are. Every entry is
 * stored as an RFQ in the admin (Sales -> RFQs).
 *
 * Plain HTML posting to a server action, so it sends with scripting off too.
 * The browser checks the required fields before sending; the server checks
 * them again and returns here with ?error=1 if a request skipped that.
 */
export function RFQForm(props: {
  error?: boolean
  productInterest?: string
  sourcePage: string
  submitted?: boolean
}) {
  const { error, productInterest, sourcePage, submitted } = props

  return (
    <div className="rfq-form" id="rfq-form">
      {submitted ? (
        <div className="rfq-form-notice" data-kind="success" role="status">
          <strong>Thank you, your message is with us.</strong>
          <p>Our team will get back to you by email or phone.</p>
        </div>
      ) : null}
      {error ? (
        <div className="rfq-form-notice" data-kind="error" role="alert">
          <strong>That did not go through.</strong>
          <p>Please add your name, a valid email and a few words about what you need.</p>
        </div>
      ) : null}

      <form action={createRFQ}>
        <input name="sourcePage" type="hidden" value={sourcePage} />
        {productInterest ? (
          <input name="productInterest" type="hidden" value={productInterest} />
        ) : null}

        {/* Hidden from people and from assistive technology; bots fill it. */}
        <div aria-hidden="true" className="rfq-form-trap">
          <label>
            Website
            <input autoComplete="off" name="website" tabIndex={-1} />
          </label>
        </div>

        <fieldset className="rfq-form-group">
          <legend>Your project</legend>
          {productInterest ? (
            <p className="rfq-form-product">
              <span>Enquiring about</span> {productInterest}
            </p>
          ) : null}
          <label className="rfq-field">
            <span>
              What do you need? <em aria-hidden="true">*</em>
            </span>
            <textarea
              minLength={10}
              name="message"
              placeholder="Product, sizes, materials, quantity, delivery date..."
              required
              rows={5}
            />
          </label>
        </fieldset>

        <fieldset className="rfq-form-group">
          <legend>About you</legend>
          <div className="rfq-form-row">
            <label className="rfq-field">
              <span>
                Name <em aria-hidden="true">*</em>
              </span>
              <input autoComplete="name" minLength={2} name="buyerName" required />
            </label>
            <label className="rfq-field">
              <span>Company</span>
              <input autoComplete="organization" name="company" />
            </label>
          </div>
          <div className="rfq-form-row">
            <label className="rfq-field">
              <span>
                Email <em aria-hidden="true">*</em>
              </span>
              <input autoComplete="email" name="email" required type="email" />
            </label>
            <label className="rfq-field">
              <span>Phone</span>
              <input autoComplete="tel" name="phone" type="tel" />
            </label>
          </div>
        </fieldset>

        <div className="rfq-form-actions">
          <button type="submit">
            Send enquiry
            <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          <p>
            Fields marked <em>*</em> are required.
          </p>
        </div>
      </form>
    </div>
  )
}
