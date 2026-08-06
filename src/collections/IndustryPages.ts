import type { CollectionConfig } from 'payload'

import { publishedOrAuthenticated } from '../access'
import { industryPageBlocks } from '../blocks/industryBlocks'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { TAGS } from '../data/tags'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'

/**
 * Industry landing pages, assembled from reusable blocks.
 *
 * Separate from the `industries` collection, which is a taxonomy used to
 * classify products and capabilities. This one owns the marketing page: an
 * industry can exist in the taxonomy without having a page, and a page can be
 * drafted long before it is linked into navigation.
 */
export const IndustryPages: CollectionConfig = {
  slug: 'industry-pages',
  labels: {
    singular: 'Industry Page',
    plural: 'Industry Pages',
  },
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    group: 'Pages',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'navLabel', '_status', 'updatedAt'],
    description: 'Long-form landing pages for each industry, built from reusable sections.',
  },
  versions: {
    drafts: true,
  },
  hooks: makeCollectionRevalidateHooks((doc) => [
    TAGS.industryPages,
    TAGS.industryPage(String(doc?.slug ?? '')),
  ]),
  fields: [
    {
      name: 'title',
      label: 'Industry name',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. Aviation Ground Support Equipment.',
      },
    },
    slugField(),
    {
      name: 'navLabel',
      label: 'Navigation label',
      type: 'text',
      admin: {
        description: 'Shorter label for menus, e.g. "Aviation GSE". Falls back to the name.',
        position: 'sidebar',
      },
    },
    {
      name: 'industry',
      label: 'Linked industry',
      type: 'relationship',
      relationTo: 'industries',
      admin: {
        description: 'Optional. Connects this page to the industry taxonomy used by products.',
        position: 'sidebar',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first in industry listings.',
        position: 'sidebar',
      },
    },
    {
      name: 'layout',
      label: 'Page sections',
      type: 'blocks',
      blocks: industryPageBlocks,
      admin: {
        description:
          'Add, reorder, duplicate or hide sections. Every section here works on any industry page.',
      },
    },
    seoFields,
  ],
}
