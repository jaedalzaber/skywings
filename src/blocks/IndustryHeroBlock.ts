import type { Block } from 'payload'

import { sectionAlignment, sectionSettings } from '../fields/section'

/**
 * Full-bleed media hero for any industry page.
 *
 * The poster image is required rather than optional: it is what renders on
 * first paint, when autoplay is blocked, when the video 404s, and when the
 * visitor has asked for reduced motion. Without it the hero has no reliable
 * first frame.
 */
export const IndustryHeroBlock: Block = {
  slug: 'industryHero',
  interfaceName: 'IndustryHeroBlock',
  // Shortened so nested array/enum identifiers stay under Postgres's 63-char cap.
  dbName: 'ind_hero',
  labels: {
    singular: 'Industry Hero',
    plural: 'Industry Heroes',
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Media',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'poster',
          label: 'Poster image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description:
              'Required. Renders immediately, and stays visible if the video is blocked, slow, or unavailable.',
          },
        },
        {
          name: 'video',
          label: 'Desktop video',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional. Without a video the poster image is shown on its own.',
          },
        },
        {
          name: 'mobileVideo',
          label: 'Mobile video',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.video),
            description: 'Optional lighter or differently cropped cut for narrow screens.',
          },
        },
        {
          name: 'mediaDescription',
          label: 'Accessible media description',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Describes what the footage shows, for screen readers and when media fails to load.',
          },
        },
        {
          name: 'aspectRatio',
          type: 'select',
          defaultValue: '16-9',
          admin: {
            description: 'Reserves space before media loads so the page does not shift.',
          },
          options: [
            { label: '16:9', value: '16-9' },
            { label: '21:9 (cinematic)', value: '21-9' },
            { label: '4:3', value: '4-3' },
            { label: 'Full viewport height', value: 'viewport' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Overlay panel',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showOverlay',
          label: 'Show text panel over the media',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'headline',
          type: 'textarea',
          admin: {
            condition: (_, siblingData) => siblingData?.showOverlay !== false,
            description: 'Line breaks are preserved.',
          },
        },
        {
          name: 'supportingStatement',
          type: 'textarea',
          admin: {
            condition: (_, siblingData) => siblingData?.showOverlay !== false,
          },
        },
        sectionAlignment({
          condition: (_, siblingData) => siblingData?.showOverlay !== false,
          description: 'Horizontal placement of the panel across the bottom of the media.',
          name: 'overlayAlignment',
        }),
        {
          name: 'overlayTextAlignment',
          type: 'select',
          defaultValue: 'left',
          admin: {
            condition: (_, siblingData) => siblingData?.showOverlay !== false,
          },
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
          ],
        },
      ],
    },
    {
      name: 'stats',
      label: 'Statistics',
      type: 'array',
      maxRows: 4,
      admin: {
        description: 'Shown alongside the overlay panel, e.g. "60+ Products".',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: { description: 'e.g. 60+' },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: { description: 'e.g. Products' },
            },
          ],
        },
      ],
    },
    ...sectionSettings('dark'),
  ],
}
