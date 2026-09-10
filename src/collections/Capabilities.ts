import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { TAGS } from '../data/tags'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'

export const Capabilities: CollectionConfig = {
  slug: 'capabilities',
  /*
   * getCapabilities() is cached under this tag, and nothing used to clear it:
   * a photo uploaded to a process in the admin stayed invisible on the site
   * until the cache was wiped by hand.
   */
  hooks: makeCollectionRevalidateHooks(() => [TAGS.capabilities]),
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Manufacturing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'processType', 'sortOrder', 'updatedAt'],
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
      name: 'processType',
      type: 'select',
      required: true,
      options: [
        { label: 'Machining', value: 'machining' },
        { label: 'Sheet Metal', value: 'sheet-metal' },
        { label: 'Fabrication', value: 'fabrication' },
        { label: 'Welding', value: 'welding' },
        { label: 'Bending & Forming', value: 'bending-forming' },
        { label: 'Surface Treatment', value: 'surface-treatment' },
        { label: 'Assembly', value: 'assembly' },
        { label: 'Engineering Design', value: 'engineering-design' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
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
      name: 'capacityNotes',
      type: 'textarea',
    },
    {
      name: 'toleranceNotes',
      type: 'textarea',
    },
    {
      name: 'typicalOutputs',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
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
