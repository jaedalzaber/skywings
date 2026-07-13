import type { CollectionConfig } from 'payload'

import { publishedOrAuthenticated } from '../access'
import { layoutField } from '../fields/layout'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'

export const LandingPages: CollectionConfig = {
  slug: 'landing-pages',
  labels: {
    singular: 'Landing Page',
    plural: 'Landing Pages',
  },
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'campaign', 'updatedAt'],
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
      name: 'campaign',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'conversionGoal',
      type: 'text',
    },
    layoutField,
    seoFields,
  ],
}
