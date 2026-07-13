import type { Field } from 'payload'

export const seoFields: Field = {
  name: 'seo',
  label: 'SEO',
  type: 'group',
  fields: [
    {
      name: 'title',
      type: 'text',
      maxLength: 70,
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 160,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
