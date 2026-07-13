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
