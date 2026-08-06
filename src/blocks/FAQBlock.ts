import type { Block, Field } from 'payload'

import { sectionSettings } from '../fields/section'

const questionFields: Field[] = [
  {
    name: 'question',
    type: 'text',
    required: true,
  },
  {
    name: 'answer',
    type: 'richText',
    required: true,
  },
  {
    name: 'defaultOpen',
    label: 'Open by default',
    type: 'checkbox',
    defaultValue: false,
  },
]

/**
 * Accordion FAQ.
 *
 * `heading`, `faqs` and `items` predate the industry pages and are kept so
 * pages already using this block keep rendering. `categories` is the grouped
 * form the industry design uses; renderers show categories when present and
 * fall back to the flat lists otherwise.
 */
export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: {
    singular: 'FAQ Block',
    plural: 'FAQ Blocks',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Small label above the heading, e.g. "FAQ".' },
    },
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Frequently asked questions',
    },
    {
      name: 'secondaryHeading',
      type: 'text',
      admin: {
        description: 'Optional lighter second line under the heading, e.g. "GSE".',
      },
    },
    {
      name: 'categories',
      label: 'Grouped questions',
      type: 'array',
      labels: { singular: 'Category', plural: 'Categories' },
      admin: {
        description:
          'Groups questions under a label, e.g. "Products" and "Services". Takes precedence over the ungrouped list below.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'questions',
          type: 'array',
          required: true,
          minRows: 1,
          fields: questionFields,
        },
      ],
    },
    {
      name: 'allowMultipleOpen',
      label: 'Allow multiple answers open at once',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'When off, opening an answer closes the previously open one.',
      },
    },
    {
      name: 'faqs',
      label: 'Linked FAQ records',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      admin: {
        description: 'Used when no grouped questions are set.',
      },
    },
    {
      name: 'items',
      label: 'Ungrouped questions',
      type: 'array',
      admin: {
        description: 'Used when no grouped questions are set.',
      },
      fields: questionFields,
    },
    ...sectionSettings('light'),
  ],
}
