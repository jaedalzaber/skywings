import type { Block } from 'payload'

export const LeadFormBlock: Block = {
  slug: 'leadForm',
  interfaceName: 'LeadFormBlock',
  labels: {
    singular: 'Lead Form Block',
    plural: 'Lead Form Blocks',
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
      name: 'submitLabel',
      type: 'text',
      defaultValue: 'Submit',
    },
    {
      name: 'fields',
      type: 'array',
      required: true,
      defaultValue: [
        { name: 'name', label: 'Name', fieldType: 'text', required: true },
        { name: 'email', label: 'Email', fieldType: 'email', required: true },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'label',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'fieldType',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Textarea', value: 'textarea' },
            { label: 'Select', value: 'select' },
          ],
        },
        {
          name: 'required',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            condition: (_, siblingData) => siblingData?.fieldType === 'select',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
