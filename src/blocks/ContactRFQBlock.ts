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
      defaultValue: 'Request quote',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Send a drawing, sample, concept, or production requirement.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Capture buyer details and project requirements into the RFQ collection so the sales and engineering team can qualify the enquiry.',
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
