import type { GlobalConfig } from 'payload'

import { anyone } from '../access'

const linkFields = [
  {
    name: 'label',
    type: 'text',
    required: true,
  },
  {
    name: 'href',
    type: 'text',
    required: true,
  },
] as const

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: anyone,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero & contact',
          fields: [
            {
              name: 'headline',
              type: 'text',
              defaultValue: 'Let’s talk',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'emailLabel',
                  type: 'text',
                  defaultValue: 'Send email',
                },
                {
                  name: 'emailAddress',
                  type: 'email',
                  defaultValue: 'info@skywings.ae',
                },
              ],
            },
            {
              name: 'phoneLabel',
              type: 'text',
              defaultValue: 'Call now',
            },
            {
              name: 'phoneNumbers',
              type: 'array',
              fields: [
                {
                  name: 'number',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Navigation',
          fields: [
            {
              name: 'linkGroups',
              type: 'array',
              maxRows: 2,
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'links',
                  type: 'array',
                  fields: [...linkFields],
                },
              ],
            },
          ],
        },
        {
          label: 'Newsletter',
          fields: [
            {
              name: 'newsletterHeading',
              type: 'text',
              defaultValue: 'Subscribe to get the latest news of our products in your inbox',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'newsletterPlaceholder',
                  type: 'text',
                  defaultValue: 'Enter your email address',
                },
                {
                  name: 'newsletterButtonLabel',
                  type: 'text',
                  defaultValue: 'Subscribe',
                },
              ],
            },
            {
              name: 'newsletterPrivacyText',
              type: 'textarea',
              defaultValue:
                'The privacy policy is available at the following link. The site is protected by reCAPTCHA and Google policies apply.',
            },
            {
              name: 'newsletterPrivacyLinks',
              type: 'array',
              fields: [...linkFields],
            },
          ],
        },
        {
          label: 'Locations & legal',
          fields: [
            {
              name: 'addresses',
              type: 'array',
              maxRows: 2,
              fields: [
                {
                  name: 'address',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'phone',
                  type: 'text',
                },
              ],
            },
            {
              name: 'legalLinks',
              type: 'array',
              fields: [...linkFields],
            },
            {
              name: 'copyright',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
