import type { CollectionConfig } from 'payload'

import { TAGS } from '../data/tags'
import { makeCollectionRevalidateHooks } from './hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: makeCollectionRevalidateHooks(() => [TAGS.media]),
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
