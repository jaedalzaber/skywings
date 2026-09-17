import type { Block } from 'payload'

export const ContactRFQBlock: Block = {
  slug: 'contactRFQ',
  interfaceName: 'ContactRFQBlock',
  labels: {
    singular: 'Contact / RFQ Block',
    plural: 'Contact / RFQ Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Request a quote',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Tell us what you need built.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Send a drawing, a sample or just the idea. Our engineers review every enquiry and come back with a clear quote, usually within one working day.',
    },
    {
      name: 'contactEmail',
      type: 'email',
      defaultValue: 'info@skywings.ae',
    },
    {
      name: 'contactPhone',
      type: 'text',
      defaultValue: '+971 50 538 9979',
    },
  ],
}
