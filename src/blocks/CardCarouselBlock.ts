import type { Block } from 'payload'

import { sectionSettings } from '../fields/section'

/**
 * Horizontal card carousel. Deliberately generic: the design uses it for
 * "Our Products & Services", but nothing here assumes products, so another
 * industry can use it for processes, facilities or certifications.
 */
export const CardCarouselBlock: Block = {
  slug: 'cardCarousel',
  interfaceName: 'CardCarouselBlock',
  // Shortened so nested array/enum identifiers stay under Postgres's 63-char cap.
  dbName: 'card_carousel',
  labels: {
    singular: 'Card Carousel',
    plural: 'Card Carousels',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Small label above the heading.' },
    },
    {
      name: 'heading',
      type: 'textarea',
      required: true,
      admin: { description: 'Line breaks are preserved.' },
    },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Card', plural: 'Cards' },
      admin: {
        description: 'Card order here is the order shown. Numbering is generated automatically.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          admin: { description: 'Optional short supporting line.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'href',
              label: 'Link',
              type: 'text',
              admin: { description: 'Optional. Makes the whole card actionable.' },
            },
            {
              name: 'numberOverride',
              label: 'Number override',
              type: 'text',
              admin: { description: 'Optional. Defaults to the card position, e.g. 01.' },
            },
          ],
        },
      ],
    },
    {
      name: 'showControls',
      label: 'Show previous / next controls',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'cardsPerView',
      label: 'Cards per view (desktop)',
      type: 'number',
      defaultValue: 4,
      min: 1,
      max: 6,
      admin: {
        description:
          'Tablet and mobile always fall back to a swipeable scroller regardless of this value.',
      },
    },
    ...sectionSettings('light'),
  ],
}
