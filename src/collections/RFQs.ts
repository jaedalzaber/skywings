import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'

export const RFQs: CollectionConfig = {
  slug: 'rfqs',
  labels: {
    singular: 'RFQ',
    plural: 'RFQs',
  },
  access: {
    create: anyone,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Sales',
    useAsTitle: 'quoteReference',
    defaultColumns: ['quoteReference', 'buyerName', 'company', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'quoteReference',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Needs Info', value: 'needs-info' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'buyerName',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'industry',
      type: 'relationship',
      relationTo: 'industries',
    },
    {
      name: 'productInterest',
      type: 'text',
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'relatedCapabilities',
      type: 'relationship',
      relationTo: 'capabilities',
      hasMany: true,
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
    },
    {
      name: 'quantity',
      type: 'text',
    },
    {
      name: 'targetDeliveryDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'uploadedFiles',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'configurationData',
      type: 'json',
    },
    {
      name: 'sourcePage',
      type: 'text',
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: {
        create: ({ req }) => Boolean(req.user),
        read: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
      },
    },
  ],
}
