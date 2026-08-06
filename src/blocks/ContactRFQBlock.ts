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
      defaultValue: 'Direct message',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Get In Touch',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        "Send a direct message to our CEO — a pioneer in Bangladesh's garments industry. Start a conversation and experience how effortless sourcing can be.",
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
