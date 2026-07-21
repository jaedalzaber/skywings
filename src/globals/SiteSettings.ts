import type { GlobalConfig, UploadFieldValidation } from 'payload'

import { anyone } from '../access'

type BrandAssetField = 'favicon' | 'logo'

function getUploadID(value: unknown): string | null {
  if (typeof value === 'number' || typeof value === 'string') return String(value)

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    if (typeof id === 'number' || typeof id === 'string') return String(id)
  }

  return null
}

export function validateDistinctBrandAsset(
  value: unknown,
  siblingData: unknown,
  siblingField: BrandAssetField,
): string | true {
  const currentID = getUploadID(value)
  const siblingRecord =
    siblingData && typeof siblingData === 'object' ? (siblingData as Record<string, unknown>) : null
  const siblingValue =
    siblingRecord && siblingField in siblingRecord ? siblingRecord[siblingField] : null
  const siblingID = getUploadID(siblingValue)

  return currentID && siblingID && currentID === siblingID
    ? 'Logo and favicon must use separate media uploads.'
    : true
}

const validateLogo: UploadFieldValidation = (value, { siblingData }) =>
  validateDistinctBrandAsset(value, siblingData, 'favicon')

const validateFavicon: UploadFieldValidation = (value, { siblingData }) =>
  validateDistinctBrandAsset(value, siblingData, 'logo')

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: anyone,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
    },
    {
      name: 'tagline',
      type: 'text',
    },
    {
      name: 'logo',
      type: 'upload',
      label: 'Navigation logo',
      relationTo: 'media',
      admin: {
        description: 'Used only in the website navigation. SVG is recommended.',
      },
      validate: validateLogo,
    },
    {
      name: 'favicon',
      type: 'upload',
      label: 'Browser favicon',
      relationTo: 'media',
      admin: {
        description: 'Used only for browser tabs and bookmarks. Upload a separate square image.',
      },
      validate: validateFavicon,
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'address',
          type: 'textarea',
        },
      ],
    },
  ],
}
