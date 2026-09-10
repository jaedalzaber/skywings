import type { CollectionConfig } from 'payload'

import { ARTICLE_CATEGORIES } from '../data/articleCategories'
import { TAGS } from '../data/tags'
import { publishedOrAuthenticated } from '../access'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'

/**
 * The knowledge hub's articles, published at /resources/<slug>.
 *
 * The collection keeps its original `blog-posts` slug -- renaming it would
 * rename its tables -- but reads as Articles in the admin. Headings in the
 * content become the article's table of contents, so write sections as H2 and
 * sub-sections as H3.
 */
export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'featured', 'updatedAt'],
    description:
      'Articles for the Resources hub. Use H2 for sections and H3 for sub-sections -- they become the table of contents.',
  },
  versions: {
    drafts: true,
  },
  // The hub and every article page are cached; an edit here clears both.
  hooks: makeCollectionRevalidateHooks((doc) => [
    TAGS.blog,
    ...(doc?.slug ? [TAGS.post(doc.slug)] : []),
  ]),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'category',
      type: 'select',
      defaultValue: 'guides',
      options: ARTICLE_CATEGORIES.map(({ label, value }) => ({ label, value })),
      admin: {
        position: 'sidebar',
        description: 'Sets the filter it appears under and the breadcrumb above its title.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Leads the hub, above the grid. With none ticked, the newest article leads instead.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'byline',
      type: 'group',
      admin: {
        description: 'Shown under the title. Leave empty to credit the Sky Wings engineering team.',
      },
      fields: [
        { name: 'name', type: 'text' },
        { name: 'role', type: 'text' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'One or two sentences, shown on the article card and as the page description.',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    seoFields,
  ],
}
