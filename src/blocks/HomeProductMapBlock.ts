import type { Block } from 'payload'

export const HomeProductMapBlock: Block = {
  slug: 'homeProductMap',
  interfaceName: 'HomeProductMapBlock',
  labels: {
    singular: 'Home Product Map Block',
    plural: 'Home Product Map Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Product architecture',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Product families become pages, catalogue sections, and configurators.',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      defaultValue: [
        { title: 'Modular conveyor systems' },
        { title: 'Maintenance platforms' },
        { title: 'Frames and enclosures' },
        { title: 'Railings and barriers' },
        { title: 'Cargo handling equipment' },
        { title: 'Custom fabricated assemblies' },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: 'Specs, materials, finishes, related machines, downloads, 3D assets.',
        },
      ],
    },
  ],
}
