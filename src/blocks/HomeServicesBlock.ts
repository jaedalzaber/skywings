import type { Block } from 'payload'

export const HomeServicesBlock: Block = {
  slug: 'homeServices',
  interfaceName: 'HomeServicesBlock',
  labels: {
    singular: 'Home Services Block',
    plural: 'Home Services Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Manufacturing services',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'One partner from design to delivery',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Send us a drawing, sample, concept, or production challenge. Our team turns it into engineered metal parts, assemblies, and finished products ready for site, shop floor, or fleet use.',
    },
    {
      name: 'secondaryDescription',
      type: 'textarea',
      defaultValue:
        'CNC machining, sheet metal, pipe bending, fabrication, welding, assembly, finishing, and installation all managed under one roof.',
    },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      defaultValue: [
        { title: 'Custom Equipment Manufacturing' },
        { title: 'Structural Steel Fabrication' },
        { title: 'Metal Product Fabrication' },
        { title: 'Custom Equipment Manufacturing' },
        { accentTitle: true, title: 'Erection' },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'accentTitle',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Use the light title treatment for dark service artwork.',
          },
        },
      ],
    },
  ],
}
