import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

export const Finishes: CollectionConfig = {
  slug: 'finishes',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Manufacturing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'finishType', 'sortOrder'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'finishType',
      type: 'select',
      options: [
        { label: 'Powder Coating', value: 'powder-coating' },
        { label: 'Painting', value: 'painting' },
        { label: 'Galvanizing', value: 'galvanizing' },
        { label: 'Polishing', value: 'polishing' },
        { label: 'Brushing', value: 'brushing' },
        { label: 'Raw / Unfinished', value: 'raw' },
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
