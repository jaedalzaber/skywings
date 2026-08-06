import type { Block } from 'payload'

import { optionalLinkGroup } from '../fields/link'
import { sectionSettings } from '../fields/section'

/**
 * Full-width call to action with a feature image and an optional decorative
 * backdrop. The heading is segmented so individual words can carry the bold
 * emphasis used in the design.
 */
export const CustomProductCtaBlock: Block = {
  slug: 'customProductCta',
  interfaceName: 'CustomProductCtaBlock',
  // Shortened so nested array/enum identifiers stay under Postgres's 63-char cap.
  dbName: 'custom_cta',
  labels: {
    singular: 'Custom Product CTA',
    plural: 'Custom Product CTAs',
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
          'Segments flow inline, e.g. "Need " + "Customized Product" (bold) + " For Your Requirement?".',
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
              enumName: 'enum_custom_cta_heading_emphasis',
              options: [
                { label: 'Normal', value: 'normal' },
                { label: 'Bold', value: 'bold' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'featureImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'The framed image beside the copy.' },
    },
    {
      name: 'featureImageAlt',
      label: 'Feature image description',
      type: 'text',
      admin: {
        description: 'Leave empty if the image is purely decorative.',
      },
    },
    {
      name: 'backgroundImage',
      label: 'Decorative background',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional watermark behind the section. Rendered decoratively and hidden from screen readers.',
      },
    },
    optionalLinkGroup({
      label: 'Call to action',
      name: 'action',
    }),
    ...sectionSettings('brand'),
  ],
}
