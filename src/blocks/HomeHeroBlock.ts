import type { Block, Field } from 'payload'

function coverMediaFields(prefix: 'desktop' | 'laptop' | 'mobile', label: string): Field[] {
  const typeField = `${prefix}CoverType`

  return [
    {
      type: 'row',
      fields: [
        {
          name: typeField,
          label: `${label} cover type`,
          type: 'select',
          defaultValue: 'image',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
          ],
        },
        {
          name: `${prefix}CoverImage`,
          label: `${label} cover image`,
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => siblingData?.[typeField] !== 'video',
            description: `Shown on ${label.toLowerCase()} screens when cover type is image.`,
          },
        },
        {
          name: `${prefix}CoverVideo`,
          label: `${label} cover video`,
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => siblingData?.[typeField] === 'video',
            description: `Shown on ${label.toLowerCase()} screens when cover type is video.`,
          },
        },
      ],
    },
  ]
}

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
      defaultValue: 'Metal products engineered, fabricated, and delivered to spec.',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Sky Wings helps contractors, factories, aviation teams, and industrial buyers turn drawings, samples, and custom requirements into reliable finished metalwork.',
    },
    {
      type: 'collapsible',
      label: 'Cover media',
      admin: {
        initCollapsed: false,
      },
      fields: [
        ...coverMediaFields('desktop', 'Desktop'),
        ...coverMediaFields('laptop', 'Laptop'),
        ...coverMediaFields('mobile', 'Mobile'),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'primaryLabel',
          type: 'text',
          defaultValue: 'Start an RFQ',
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
          defaultValue: 'Explore products',
        },
        {
          name: 'secondaryHref',
          type: 'text',
          defaultValue: '/products',
        },
      ],
    },
    {
      name: 'previewHeading',
      type: 'text',
      defaultValue: 'Built for complex requirements',
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
