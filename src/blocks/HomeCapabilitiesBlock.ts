import type { Block } from 'payload'

export const HomeCapabilitiesBlock: Block = {
  slug: 'homeCapabilities',
  interfaceName: 'HomeCapabilitiesBlock',
  labels: {
    singular: 'Home Capabilities Block',
    plural: 'Home Capabilities Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Manufacturing capability',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'A scalable system for machines, materials, finishes, and output.',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      defaultValue: [
        { title: 'CNC machining' },
        { title: 'Sheet metal processing' },
        { title: 'Pipe bending' },
        { title: 'Fabrication' },
        { title: 'Welding and assembly' },
        { title: 'Surface treatment' },
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
          defaultValue:
            'Structured in the CMS as a capability with linked machines, materials, product outputs, brochures, and case studies.',
        },
      ],
    },
  ],
}
