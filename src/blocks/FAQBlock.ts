import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: {
    singular: 'FAQ Block',
    plural: 'FAQ Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Frequently asked questions',
    },
    {
      name: 'faqs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
        },
      ],
    },
  ],
}
