import type { Field } from 'payload'

export const linkFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
      },
      {
        name: 'href',
        type: 'text',
        required: true,
      },
    ],
  },
  {
    name: 'style',
    type: 'select',
    defaultValue: 'primary',
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Text', value: 'text' },
    ],
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  },
]

export const linkGroup = (name = 'actions', label = 'Actions'): Field => ({
  name,
  label,
  type: 'array',
  fields: linkFields,
})

/**
 * A single optional call to action.
 *
 * `linkFields` marks label and href required, which is right inside a repeater
 * (a row that exists should be complete) but wrong for a standalone slot an
 * editor may simply leave empty. Renderers treat a missing label as "no
 * button".
 */
export const optionalLinkGroup = (args: {
  defaultStyle?: 'primary' | 'secondary' | 'text'
  description?: string
  label: string
  name: string
}): Field => ({
  name: args.name,
  label: args.label,
  type: 'group',
  admin: {
    description: args.description ?? 'Leave the label empty to hide this button.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: args.defaultStyle ?? 'primary',
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Text', value: 'text' },
      ],
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
})
