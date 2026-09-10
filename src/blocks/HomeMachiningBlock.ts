import type { Block } from 'payload'

/**
 * The dark machining capability section: a heading cell and an accordion of
 * machine groups, each opening onto its machine list and photographs.
 *
 * Every field is optional in practice -- the section falls back, field by
 * field, to the committed defaults in src/data/homeMachiningDefaults.ts, so
 * clearing one line in the admin restores that line rather than leaving a gap.
 */
export const HomeMachiningBlock: Block = {
  slug: 'homeMachining',
  interfaceName: 'HomeMachiningBlock',
  labels: {
    singular: 'Home Machining Block',
    plural: 'Home Machining Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      defaultValue: 'Machining capability',
    },
    {
      name: 'heading',
      type: 'textarea',
      defaultValue: 'Machining\ncapability',
      admin: {
        description: 'Each line break starts a new line in the heading.',
      },
    },
    {
      name: 'stats',
      type: 'array',
      admin: {
        description: 'Set beside the heading, e.g. "Machines / 30+". Two read best.',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    {
      name: 'groups',
      label: 'Machine groups',
      type: 'array',
      admin: {
        description:
          'One row per cell. The first is open on arrival; the rest open one at a time when clicked.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'machines',
          type: 'array',
          admin: {
            description: 'Set one per line in mono, written as on the shop floor asset list.',
          },
          fields: [{ name: 'name', type: 'text', required: true }],
        },
        {
          name: 'images',
          label: 'Photographs',
          type: 'array',
          admin: {
            description: 'Stepped through with the arrows while the group is open.',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
