import type { Block } from 'payload'

export const ProductListingBlock: Block = {
  slug: 'productListing',
  interfaceName: 'ProductListingBlock',
  labels: {
    singular: 'Product Listing Block',
    plural: 'Product Listing Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Products',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Browse manufactured products and configurable systems.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Filter by industry, product family, and product type. Each product can connect to brochures, 3D assets, capabilities, and RFQ flows.',
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
