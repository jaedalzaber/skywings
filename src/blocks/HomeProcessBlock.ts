import type { Block } from 'payload'

export const HomeProcessBlock: Block = {
  slug: 'homeProcess',
  interfaceName: 'HomeProcessBlock',
  labels: {
    singular: 'Home Process Block',
    plural: 'Home Process Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Manufacturing process',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'A clear production path from brief to delivery.',
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      defaultValue: [
        { title: 'Requirement' },
        { title: 'CAD design' },
        { title: 'Cutting' },
        { title: 'Machining' },
        { title: 'Fabrication' },
        { title: 'Finish' },
        { title: 'Delivery' },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
