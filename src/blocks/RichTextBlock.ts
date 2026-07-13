import type { Block } from 'payload'

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: 'Rich Text Block',
    plural: 'Rich Text Blocks',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
}
