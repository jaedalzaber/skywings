import type { CollectionConfig } from 'payload'

import { publishedOrAuthenticated } from '../access'
import { layoutField } from '../fields/layout'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { TAGS } from '../data/tags'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  hooks: makeCollectionRevalidateHooks((doc) => [
    TAGS.pages,
    ...(doc.slug ? [TAGS.page(doc.slug)] : []),
  ]),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        position: 'sidebar',
      },
    },
    layoutField,
    seoFields,
  ],
}
