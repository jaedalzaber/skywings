import type { GlobalConfig } from 'payload'

import { anyone } from '../access'

export const SocialLinks: GlobalConfig = {
  slug: 'social-links',
  label: 'Social Links',
  access: {
    read: anyone,
  },
  fields: [
    {
      name: 'links',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X', value: 'x' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
