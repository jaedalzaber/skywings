import type { GlobalConfig } from 'payload'

import { anyone } from '../access'

export const SEODefaults: GlobalConfig = {
  slug: 'seo-defaults',
  label: 'SEO Defaults',
  access: {
    read: anyone,
  },
  fields: [
    {
      name: 'defaultTitle',
      type: 'text',
      required: true,
      maxLength: 70,
    },
    {
      name: 'titleTemplate',
      type: 'text',
      defaultValue: '%s | Skywings',
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      maxLength: 160,
    },
    {
      name: 'defaultImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'robots',
      type: 'select',
      defaultValue: 'index,follow',
      options: [
        { label: 'Index, follow', value: 'index,follow' },
        { label: 'No index, follow', value: 'noindex,follow' },
        { label: 'No index, no follow', value: 'noindex,nofollow' },
      ],
    },
  ],
}
