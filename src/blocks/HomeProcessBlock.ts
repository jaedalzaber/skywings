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
      name: 'model3D',
      label: 'Process 3D model',
      type: 'upload',
      relationTo: 'three-d-assets',
      admin: {
        description: 'Upload/select the GLB or GLTF model shown in the center process viewer.',
      },
    },
    {
      name: 'modelAppearance',
      label: '3D model appearance',
      type: 'group',
      admin: {
        description: 'Tune the process viewer wireframe, fade, and floor grid.',
      },
      fields: [
        {
          name: 'lineOpacity',
          label: 'Line opacity',
          type: 'number',
          defaultValue: 0.3,
          min: 0.05,
          max: 1,
          admin: {
            description: 'Higher values make the model wire lines stronger.',
            step: 0.01,
          },
        },
        {
          name: 'lineThickness',
          label: 'Line thickness',
          type: 'number',
          defaultValue: 0.75,
          min: 0.25,
          max: 2,
          admin: {
            description: 'Controls wireframe line width where the browser supports it.',
            step: 0.05,
          },
        },
        {
          name: 'fadeStart',
          label: 'Fade start distance',
          type: 'number',
          defaultValue: 5.5,
          min: 0,
          max: 30,
          admin: {
            description: 'Distance from the camera where model fade begins.',
            step: 0.1,
          },
        },
        {
          name: 'fadeEnd',
          label: 'Fade end distance',
          type: 'number',
          defaultValue: 12,
          min: 0.1,
          max: 50,
          admin: {
            description: 'Distance from the camera where model fade reaches the background.',
            step: 0.1,
          },
        },
      ],
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
        {
          name: 'infographicImage',
          label: 'Infographic image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional visual shown when this process step is active.',
          },
        },
      ],
    },
  ],
}
