import type { Block } from 'payload'

export const BenefitsBlock: Block = {
  slug: 'benefits',
  interfaceName: 'BenefitsBlock',
  labels: {
    singular: 'Benefits Block',
    plural: 'Benefits Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'intro',
      type: 'textarea',
    },
    {
      name: 'benefits',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'icon',
          type: 'text',
        },
      ],
    },
  ],
}
