import type { Block } from 'payload'

export const PageHeroBlock: Block = {
  slug: 'pageHero',
  interfaceName: 'PageHeroBlock',
  labels: {
    singular: 'Page Hero Block',
    plural: 'Page Hero Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'primaryLabel',
      type: 'text',
    },
    {
      name: 'primaryHref',
      type: 'text',
    },
    {
      name: 'secondaryLabel',
      type: 'text',
    },
    {
      name: 'secondaryHref',
      type: 'text',
    },
  ],
}
