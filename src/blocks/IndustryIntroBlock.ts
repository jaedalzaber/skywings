import type { Block } from 'payload'

import { optionalLinkGroup } from '../fields/link'
import { sectionSettings } from '../fields/section'

/**
 * Two-column introduction: a stacked display heading on one side, body copy
 * and calls to action on the other.
 */
export const IndustryIntroBlock: Block = {
  slug: 'industryIntro',
  interfaceName: 'IndustryIntroBlock',
  // Postgres caps identifiers at 63 characters. The generated names combine
  // collection + block + array + field, so the block name is shortened here to
  // keep nested enums inside the limit.
  dbName: 'ind_intro',
  labels: {
    singular: 'Industry Intro',
    plural: 'Industry Intros',
  },
  fields: [
    {
      name: 'eyebrow',
      label: 'Eyebrow / category label',
      type: 'text',
      admin: { description: 'Small label above the heading, e.g. "Aviation GSE".' },
    },
    {
      name: 'headingLines',
      label: 'Display heading',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 4,
      admin: {
        description:
          'One row per visual line. Emphasised lines render in the heavier weight seen in the design.',
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
              defaultValue: 'strong',
              enumName: 'enum_ind_intro_heading_emphasis',
              options: [
                { label: 'Strong', value: 'strong' },
                { label: 'Light', value: 'light' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      admin: { description: 'Body copy beside the heading.' },
    },
    optionalLinkGroup({ label: 'Primary action', name: 'primaryAction' }),
    optionalLinkGroup({
      defaultStyle: 'secondary',
      label: 'Secondary action',
      name: 'secondaryAction',
    }),
    {
      name: 'layout',
      label: 'Layout',
      type: 'select',
      defaultValue: 'split',
      options: [
        { label: 'Split (heading left, copy right)', value: 'split' },
        { label: 'Stacked', value: 'stacked' },
        { label: 'Centered', value: 'centered' },
      ],
    },
    ...sectionSettings('light'),
  ],
}
