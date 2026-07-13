import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'

export const Machines: CollectionConfig = {
  slug: 'machines',
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Manufacturing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'capability', 'machineStatus', 'sortOrder'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField('name'),
    {
      name: 'capability',
      type: 'relationship',
      relationTo: 'capabilities',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'machineType',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'brand',
          type: 'text',
        },
        {
          name: 'model',
          type: 'text',
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'capacity',
      type: 'textarea',
    },
    {
      name: 'maxWorkpieceSize',
      type: 'text',
    },
    {
      name: 'materialsSupported',
      type: 'relationship',
      relationTo: 'materials',
      hasMany: true,
    },
    {
      name: 'typicalOutputs',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'machineStatus',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Planned', value: 'planned' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Retired', value: 'retired' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    seoFields,
  ],
}
