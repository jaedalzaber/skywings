import type { Block } from 'payload'

export const HomeHeroBlock: Block = {
  slug: 'homeHero',
  interfaceName: 'HomeHeroBlock',
  labels: {
    singular: 'Home Hero Block',
    plural: 'Home Hero Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'End-to-end metal manufacturing',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'From drawing, sample, or problem to manufactured product.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Sky Wings brings CNC machining, sheet metal processing, pipe bending, fabrication, welding, assembly, and surface treatment into one connected manufacturing system.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'primaryLabel',
          type: 'text',
          defaultValue: 'Request Quote',
        },
        {
          name: 'primaryHref',
          type: 'text',
          defaultValue: '/contact',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'secondaryLabel',
          type: 'text',
          defaultValue: 'View product map',
        },
        {
          name: 'secondaryHref',
          type: 'text',
          defaultValue: '#products',
        },
      ],
    },
    {
      name: 'previewHeading',
      type: 'text',
      defaultValue: 'Manufacturing under one roof',
    },
    {
      name: 'previewItems',
      type: 'array',
      minRows: 1,
      defaultValue: [
        { title: 'CNC machining' },
        { title: 'Sheet metal processing' },
        { title: 'Pipe bending' },
        { title: 'Fabrication' },
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
