import type { Block } from 'payload'

import { optionalLinkGroup } from '../fields/link'
import { sectionSettings } from '../fields/section'

/**
 * Filterable product gallery.
 *
 * Cards relate to the central Products collection rather than restating each
 * product inline, so a spec or image corrected once is corrected everywhere.
 * Per-entry overrides exist only for presentation.
 */
export const ProductGalleryBlock: Block = {
  slug: 'productGallery',
  interfaceName: 'ProductGalleryBlock',
  // Shortened so nested array/enum identifiers stay under Postgres's 63-char cap.
  dbName: 'prod_gallery',
  labels: {
    singular: 'Product Gallery',
    plural: 'Product Galleries',
  },
  fields: [
    {
      name: 'heading',
      type: 'textarea',
      required: true,
      admin: { description: 'Line breaks are preserved.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional supporting text below the heading.' },
    },
    {
      name: 'filters',
      label: 'Category filters',
      type: 'array',
      labels: { singular: 'Filter', plural: 'Filters' },
      admin: {
        description:
          'Leave empty to show every selected product without a filter bar. An "All" option is added automatically.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'productFamily',
              label: 'Product family',
              type: 'relationship',
              relationTo: 'product-families',
              admin: {
                description: 'Products in this family match the filter.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'items',
      label: 'Products',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Product', plural: 'Products' },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          admin: {
            description: 'Name, code, image, description and link are read from the product.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'featured',
              label: 'Highlighted',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Renders as the raised centre card. Use on one product at a time.',
              },
            },
            {
              name: 'imageOverride',
              label: 'Image override',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Optional. For a transparent render that differs from the catalogue.',
              },
            },
          ],
        },
      ],
    },
    optionalLinkGroup({
      description: 'Leave the label empty to hide the button.',
      label: 'Browse all products button',
      name: 'browseAction',
    }),
    ...sectionSettings('light'),
  ],
}
