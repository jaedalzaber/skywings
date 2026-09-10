import type { Block, Field } from 'payload'

function coverMediaFields(prefix: 'desktop' | 'laptop' | 'mobile', label: string): Field[] {
  const typeField = `${prefix}CoverType`
  const screen = label.toLowerCase()

  return [
    {
      type: 'row',
      fields: [
        {
          // Kept in the schema so the existing column and its data survive, but
          // hidden from the editor: the hero always plays video, so an editable
          // switch here only misleads. Drop the column in a migration if it is
          // ever confirmed unused.
          name: typeField,
          label: `${label} cover type`,
          type: 'select',
          defaultValue: 'image',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
          ],
          admin: {
            hidden: true,
          },
        },
        {
          // Deliberately always editable, including in video mode: this image
          // is the poster painted while the video buffers, and the still that
          // stays put if the video fails or autoplay is blocked. Hiding it
          // behind the type switch left video covers with no first frame.
          name: `${prefix}CoverImage`,
          label: `${label} cover image`,
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: `Shown on ${screen} screens, and used as the poster while the video loads.`,
            width: '50%',
          },
        },
        {
          name: `${prefix}CoverVideo`,
          label: `${label} cover video`,
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: `Plays on ${screen} screens, over the cover image.`,
            width: '50%',
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
