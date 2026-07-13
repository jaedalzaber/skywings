import type { Block } from 'payload'

import { linkGroup } from '../fields/link'

export const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  labels: {
    singular: 'CTA Block',
    plural: 'CTA Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    linkGroup(),
  ],
}
