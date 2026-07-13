import type { CollectionConfig } from 'payload'

import { publishedOrAuthenticated } from '../access'
import { layoutField } from '../fields/layout'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: {
    singular: 'Case Study',
    plural: 'Case Studies',
  },
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'clientName', 'industry', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'industry',
      type: 'text',
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'challenge',
      type: 'richText',
    },
    {
      name: 'solution',
      type: 'richText',
    },
    {
      name: 'results',
      type: 'richText',
    },
    {
      name: 'metrics',
      type: 'array',
      fields: [
        {
          name: 'value',
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
    layoutField,
    seoFields,
  ],
}
