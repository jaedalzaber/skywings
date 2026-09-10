import type { Block } from 'payload'

/**
 * The dark machining capability section: a heading cell and an accordion of
 * the capability processes, each opening onto its machine list and
 * photographs.
 *
 * This block carries the heading and the figures. The rows are the
 * Capabilities collection, with the Machines filed under each -- edit the
 * processes, machines and their photographs there, and both the home page and
 * /capabilities follow.
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
      /*
       * No longer read: the rows come from the Capabilities and Machines
       * collections, so the home page and /capabilities show one shop list.
       * Hidden rather than removed -- dropping the field would drop its tables,
       * and the schema push is additive only.
       */
      name: 'groups',
      label: 'Machine groups',
      type: 'array',
      admin: {
        hidden: true,
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
