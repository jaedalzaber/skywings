import type { Block } from 'payload'

export const IndustryListingBlock: Block = {
  slug: 'industryListing',
  interfaceName: 'IndustryListingBlock',
  labels: {
    singular: 'Industry Listing Block',
    plural: 'Industry Listing Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Industries',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Sector views for buyers with different requirements.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Industries organize products, applications, capabilities, catalogues, and case studies into buyer-friendly paths.',
    },
  ],
}
