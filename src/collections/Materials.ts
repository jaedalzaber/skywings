import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

export const Materials: CollectionConfig = {
  slug: 'materials',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Manufacturing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'materialType', 'sortOrder'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'materialType',
      type: 'select',
      options: [
        { label: 'Mild Steel', value: 'mild-steel' },
        { label: 'Stainless Steel', value: 'stainless-steel' },
        { label: 'Aluminum', value: 'aluminum' },
        { label: 'Galvanized Steel', value: 'galvanized-steel' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
    },
  ],
}
