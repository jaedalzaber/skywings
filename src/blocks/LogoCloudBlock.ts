import type { Block } from 'payload'

export const LogoCloudBlock: Block = {
  slug: 'logoCloud',
  interfaceName: 'LogoCloudBlock',
  labels: {
    singular: 'Logo Cloud Block',
    plural: 'Logo Cloud Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'logos',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'href',
          type: 'text',
        },
      ],
    },
  ],
}
