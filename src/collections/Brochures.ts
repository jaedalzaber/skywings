import type { CollectionConfig } from 'payload'

import { authenticated, publicAssetOrAuthenticated } from '../access'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'

export const Brochures: CollectionConfig = {
  slug: 'brochures',
  access: {
    read: publicAssetOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Assets',
    useAsTitle: 'title',
    defaultColumns: ['title', 'brochureType', 'isPublic', 'updatedAt'],
  },
  upload: {
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'brochureType',
      type: 'select',
      defaultValue: 'product-catalogue',
      options: [
        { label: 'Company Profile', value: 'company-profile' },
        { label: 'Product Catalogue', value: 'product-catalogue' },
        { label: 'Capability Brochure', value: 'capability-brochure' },
        { label: 'Industry Brochure', value: 'industry-brochure' },
        { label: 'Technical Data Sheet', value: 'technical-data-sheet' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'industries',
      type: 'relationship',
      relationTo: 'industries',
      hasMany: true,
    },
    {
      name: 'capabilities',
      type: 'relationship',
      relationTo: 'capabilities',
      hasMany: true,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'requiresLeadCapture',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    seoFields,
  ],
}
