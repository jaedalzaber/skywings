import type { Field } from 'payload'

import { formatSlug } from './formatSlug'

export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  index: true,
  required: true,
  unique: true,
  admin: {
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [
      ({ data, value }) => {
        if (typeof value === 'string' && value.trim()) {
          return formatSlug(value)
        }

        const source = data?.[sourceField]

        if (typeof source === 'string' && source.trim()) {
          return formatSlug(source)
        }

        return value
      },
    ],
  },
})
