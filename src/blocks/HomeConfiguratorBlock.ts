import type { Block } from 'payload'

export const HomeConfiguratorBlock: Block = {
  slug: 'homeConfigurator',
  interfaceName: 'HomeConfiguratorBlock',
  labels: {
    singular: 'Home Configurator / RFQ Block',
    plural: 'Home Configurator / RFQ Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: '3D viewer and RFQ flow',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Buyers can inspect, configure, and request a quote.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Start with modular conveyor systems: length, width, roller type, guards, material, finish, and application. Every choice can be captured as structured RFQ data in Payload.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: 'Send enquiry',
        },
        {
          name: 'ctaHref',
          type: 'text',
          defaultValue: 'mailto:info@skywings.ae',
        },
      ],
    },
  ],
}
