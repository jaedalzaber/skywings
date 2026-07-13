import { createRFQ } from '@/actions/rfq'

export function RFQForm(props: {
  productInterest?: string
  sourcePage: string
  submitted?: boolean
}) {
  const { productInterest, sourcePage, submitted } = props

  return (
    <div className="form-panel" id="rfq-form">
      {submitted ? (
        <div className="form-success">
          <strong>Request received.</strong>
          <p>Thanks. The team can now review this RFQ inside Payload.</p>
        </div>
      ) : null}
      <form action={createRFQ}>
        <input name="sourcePage" type="hidden" value={sourcePage} />
        <label>
          Name
          <input name="buyerName" placeholder="Your name" required />
        </label>
        <label>
          Company
          <input name="company" placeholder="Company / organization" />
        </label>
        <label>
          Email
          <input name="email" placeholder="name@company.com" required type="email" />
        </label>
        <label>
          Phone
          <input name="phone" placeholder="+971..." />
        </label>
        <label>
          Product or requirement
          <input
            defaultValue={productInterest}
            name="productInterest"
            placeholder="Modular conveyor system, platform, enclosure..."
          />
        </label>
        <label>
          Quantity
          <input name="quantity" placeholder="1 unit, 20 assemblies..." />
        </label>
        <label className="field-full">
          Message
          <textarea
            name="message"
            placeholder="Share drawings, dimensions, material, load, finish, industry, or problem to solve."
            required
            rows={6}
          />
        </label>
        <button className="button button-primary" type="submit">
          Submit RFQ
        </button>
      </form>
    </div>
  )
}
