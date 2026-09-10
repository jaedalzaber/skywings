import type { Block } from 'payload'

/**
 * The white engineering section: a photograph on the left, the heading in its
 * own cell, the disciplines side by side in the accent band, and the
 * simulation note under it.
 *
 * As with the machining block, every field falls back to the committed
 * defaults in src/data/homeEngineeringDefaults.ts when it is left empty.
 */
export const HomeEngineeringBlock: Block = {
  slug: 'homeEngineering',
  interfaceName: 'HomeEngineeringBlock',
  labels: {
    singular: 'Home Engineering Block',
    plural: 'Home Engineering Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Engineering',
    },
    {
      name: 'code',
      label: 'Section number',
      type: 'text',
      defaultValue: '5.0',
      admin: {
        description: 'Set in the corner of the heading cell, e.g. "5.0".',
      },
    },
    {
      name: 'image',
      label: 'Photograph',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Held on the left, alongside the heading and the band.',
      },
    },
    {
      name: 'disciplines',
      type: 'array',
      admin: {
        description:
          'Set side by side in the accent band -- two read best. Each carries a mono line, a large title and a list.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { description: 'Large in the band, e.g. "CAD".' },
        },
        {
          name: 'eyebrow',
          type: 'text',
          admin: { description: 'Mono line above the title.' },
        },
        {
          name: 'copy',
          type: 'textarea',
          admin: {
            description: 'Optional paragraph above the list. One paragraph per line break.',
          },
        },
        {
          name: 'listLead',
          label: 'Line above the list',
          type: 'text',
        },
        {
          name: 'items',
          label: 'List',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'note',
      label: 'Closing note',
      type: 'group',
      admin: {
        description: 'Framed under the band, in the copy column only.',
      },
      fields: [
        {
          name: 'copy',
          type: 'textarea',
          admin: { description: 'One paragraph per line break.' },
        },
        {
          name: 'listLead',
          label: 'Line above the list',
          type: 'text',
        },
        {
          name: 'items',
          label: 'List',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true }],
        },
      ],
    },
  ],
}
