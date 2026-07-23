import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { TAGS } from '../data/tags'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'

export const Industries: CollectionConfig = {
  slug: 'industries',
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Manufacturing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'sortOrder', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  hooks: makeCollectionRevalidateHooks((doc) => [
    TAGS.industries,
    TAGS.page('home'),
    ...(doc.slug ? [TAGS.page(`industries/${doc.slug}`)] : []),
  ]),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'painPoints',
      type: 'array',
      fields: [
        {
          name: 'point',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'solutions',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'relatedCapabilities',
      type: 'relationship',
      relationTo: 'capabilities',
      hasMany: true,
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'caseStudies',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
    },
    {
      name: 'brochures',
      type: 'relationship',
      relationTo: 'brochures',
      hasMany: true,
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
