import type { CollectionConfig } from 'payload'

import { anyone } from '../access'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  access: {
    read: anyone,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'featured', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'relatedCaseStudy',
      type: 'relationship',
      relationTo: 'case-studies',
    },
    {
      name: 'relatedProduct',
      type: 'relationship',
      relationTo: 'products',
    },
  ],
}
