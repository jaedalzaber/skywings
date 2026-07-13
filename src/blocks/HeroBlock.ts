import type { Block } from 'payload'

import { linkGroup } from '../fields/link'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero Block',
    plural: 'Hero Blocks',
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
      name: 'content',
      type: 'richText',
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
    linkGroup(),
  ],
}
