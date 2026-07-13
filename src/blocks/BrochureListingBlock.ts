import type { Block } from 'payload'

export const BrochureListingBlock: Block = {
  slug: 'brochureListing',
  interfaceName: 'BrochureListingBlock',
  labels: {
    singular: 'Brochure Listing Block',
    plural: 'Brochure Listing Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Brochures',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Download catalogues, profiles, and technical documents.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Brochures can be public or lead-gated, and can connect to products, industries, and capabilities.',
    },
  ],
}
