import type { Block } from 'payload'

export const CapabilityListingBlock: Block = {
  slug: 'capabilityListing',
  interfaceName: 'CapabilityListingBlock',
  labels: {
    singular: 'Capability Listing Block',
    plural: 'Capability Listing Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Capabilities',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Manufacturing capability under one roof.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Each process can be connected to machines, materials, product outputs, brochures, and future case studies.',
    },
  ],
}
