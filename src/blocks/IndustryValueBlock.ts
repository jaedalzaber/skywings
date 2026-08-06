import type { Block } from 'payload'

import { sectionSettings } from '../fields/section'

/**
 * Editorial value-proposition section: formatted heading and copy beside a
 * large feature image, with an optional client-logo row along the bottom.
 *
 * The logo row lives here rather than in a separate block because the design
 * treats it as the foot of the same dark surface. It is optional, so a page
 * that wants logos on their own can still use the standalone Logo Cloud block.
 */
export const IndustryValueBlock: Block = {
  slug: 'industryValue',
  interfaceName: 'IndustryValueBlock',
  // Shortened so nested array/enum identifiers stay under Postgres's 63-char cap.
  dbName: 'ind_value',
  labels: {
    singular: 'Industry Value',
    plural: 'Industry Value Sections',
  },
  fields: [
    {
      name: 'headingSegments',
      label: 'Heading',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description:
          'The heading is built from segments so individual words can be emphasised, as in "High-Quality GSE Sales". Segments flow inline; use "Line break after" to start a new line.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
            {
              name: 'emphasis',
              type: 'select',
              defaultValue: 'normal',
              enumName: 'enum_ind_value_heading_emphasis',
              options: [
                { label: 'Normal', value: 'normal' },
                { label: 'Bold', value: 'bold' },
              ],
            },
            {
              name: 'breakAfter',
              label: 'Line break after',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'featureImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'logosLabel',
      label: 'Supporting label',
      type: 'text',
      admin: {
        description: 'Small line above the logo row, e.g. "Our Clients In Aviation GSE Supply".',
      },
    },
    {
      name: 'clientLogos',
      label: 'Client logos',
      type: 'array',
      labels: { singular: 'Logo', plural: 'Logos' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Client name',
              type: 'text',
              required: true,
              admin: { description: 'Used as the accessible name for the logo.' },
            },
            {
              name: 'href',
              label: 'Link',
              type: 'text',
            },
          ],
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'altOverride',
          label: 'Alternative text override',
          type: 'text',
          admin: {
            description: 'Only needed when the client name is not the right description.',
          },
        },
      ],
    },
    ...sectionSettings('dark'),
  ],
}
