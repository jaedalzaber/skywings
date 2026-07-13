import type { GlobalConfig } from 'payload'

import { anyone } from '../access'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: anyone,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tagline',
      type: 'textarea',
    },
    {
      name: 'linkGroups',
      type: 'array',
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'href',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
    },
  ],
}
