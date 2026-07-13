import type { Block } from 'payload'

export const BlogListingBlock: Block = {
  slug: 'blogListing',
  interfaceName: 'BlogListingBlock',
  labels: {
    singular: 'Blog Listing Block',
    plural: 'Blog Listing Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Insights',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Admin-managed manufacturing updates and articles.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Use blog posts for project updates, product education, capability stories, and procurement guidance.',
    },
  ],
}
