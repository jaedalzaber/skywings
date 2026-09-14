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
      name: 'logoSymbol',
      type: 'upload',
      label: 'Navigation symbol',
      relationTo: 'media',
      admin: {
        description:
          'Compact mark shown in the navigation once the page is scrolled and the bar tightens. Optional — the full logo is scaled down instead when this is empty. SVG is recommended.',
      },
    },
    {
      name: 'logoMotion',
      label: 'Navigation logo animation',
      type: 'group',
      admin: {
        description:
          'The logo turns on its axis in the navigation bar, waits, and turns again. Applies to the full logo and to the compact symbol alike. Visitors who ask for reduced motion never see it.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Turn the logo',
        },
        {
          name: 'durationSeconds',
          type: 'number',
          defaultValue: 1.6,
          label: 'Seconds per turn',
          min: 0.3,
          max: 8,
          admin: {
            description: 'How long one full turn takes. It eases in and out.',
            step: 0.1,
          },
        },
        {
          name: 'easeAmount',
          type: 'number',
          defaultValue: 0.65,
          label: 'Easing',
          min: 0,
          max: 1,
          admin: {
            description:
              'How much the turn slows at each end. 0 turns at one steady speed; 1 creeps in, sweeps through the middle and settles.',
            step: 0.05,
          },
        },
        {
          name: 'perspectiveRem',
          type: 'number',
          defaultValue: 34,
          label: 'Depth of the turn (rem)',
          min: 4,
          max: 200,
          admin: {
            description:
              'How near the viewer the logo appears to be while it turns. Small numbers exaggerate the perspective -- the near edge swells and the far edge shrinks; large numbers flatten it.',
            step: 1,
          },
        },
        {
          name: 'restSeconds',
          type: 'number',
          defaultValue: 9,
          label: 'Seconds of rest between turns',
          min: 1,
          max: 120,
          admin: {
            description: 'How long the logo sits still before it turns again.',
            step: 1,
          },
        },
      ],
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
