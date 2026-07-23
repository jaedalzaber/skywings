import type { Block } from 'payload'

export const HomeIndustriesBlock: Block = {
  slug: 'homeIndustries',
  interfaceName: 'HomeIndustriesBlock',
  labels: {
    singular: 'Home Industries Block',
    plural: 'Home Industries Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Industries we serve',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Metalwork built around your industry requirements.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Browse sector-specific products, assemblies, and fabrication capabilities for the way your projects are bought, built, and delivered.',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      defaultValue: [
        { title: 'Construction and infrastructure' },
        { title: 'Industrial manufacturing' },
        { title: 'Architecture and interior' },
        { title: 'Aviation and GSE' },
        { title: 'Marine and offshore' },
        { title: 'Commercial fit-out' },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'meta',
          type: 'text',
          defaultValue: 'Products, applications, brochures, case studies',
        },
      ],
    },
  ],
}
