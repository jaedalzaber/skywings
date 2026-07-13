import type { Block } from 'payload'

export const ThreeDShowcaseBlock: Block = {
  slug: 'threeDShowcase',
  interfaceName: 'ThreeDShowcaseBlock',
  labels: {
    singular: '3D Showcase Block',
    plural: '3D Showcase Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'modelFile',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'fallbackImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'cameraPreset',
      type: 'select',
      defaultValue: 'orbit',
      options: [
        { label: 'Orbit', value: 'orbit' },
        { label: 'Static', value: 'static' },
        { label: 'Exploded', value: 'exploded' },
      ],
    },
  ],
}
