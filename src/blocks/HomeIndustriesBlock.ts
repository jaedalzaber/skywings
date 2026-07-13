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
      defaultValue: 'One product database, multiple industry views.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Buyers can browse by sector, then move into relevant product families, catalogues, 3D previews, and quote requests.',
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
