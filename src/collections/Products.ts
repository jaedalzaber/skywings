import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrAuthenticated } from '../access'
import { layoutField } from '../fields/layout'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Product',
    plural: 'Products',
  },
  access: {
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Manufacturing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'productFamily', 'isConfigurable', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'sku',
      label: 'SKU / Product Code',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'productType',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Standard Product', value: 'standard' },
        { label: 'Configurable Product', value: 'configurable' },
        { label: 'Custom Manufactured Product', value: 'custom' },
        { label: 'Service', value: 'service' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'productFamily',
      type: 'relationship',
      relationTo: 'product-families',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'breadcrumb',
      type: 'text',
      admin: {
        description: 'Category path shown above the title, e.g. "Aviation / GSE / Stands".',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'industryLabel',
          type: 'text',
          admin: {
            description: 'Shown as "Industry: …" in the overview.',
          },
        },
        {
          name: 'categoryLabel',
          type: 'text',
          admin: {
            description: 'Shown as "Category: …" in the overview.',
          },
        },
      ],
    },
    {
      name: 'keySpecs',
      label: 'Key specs (overview grid)',
      type: 'array',
      admin: {
        description:
          'Short label/value pairs shown beside the description (Type, Material, Weight, Capacity, …).',
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
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'howItWorks',
      label: 'How it works (optional)',
      type: 'group',
      admin: {
        description:
          'Optional illustrated section (e.g. fold / unfold). Rendered only when an image is set.',
      },
      fields: [
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'How it works',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'caption',
          type: 'text',
        },
      ],
    },
    {
      name: 'industries',
      type: 'relationship',
      relationTo: 'industries',
      hasMany: true,
    },
    {
      name: 'capabilities',
      type: 'relationship',
      relationTo: 'capabilities',
      hasMany: true,
    },
    {
      name: 'materials',
      type: 'relationship',
      relationTo: 'materials',
      hasMany: true,
    },
    {
      name: 'finishes',
      type: 'relationship',
      relationTo: 'finishes',
      hasMany: true,
    },
    {
      name: 'applications',
      type: 'relationship',
      relationTo: 'applications',
      hasMany: true,
    },
    {
      name: 'specifications',
      type: 'array',
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
              name: 'value',
              type: 'text',
              required: true,
            },
            {
              name: 'unit',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'accessories',
      label: 'Accessories (spec table)',
      type: 'array',
      admin: {
        description: 'Second spec table shown next to Specification.',
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
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'technicalDrawing',
      label: 'Technical drawing',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Dimensioned engineering drawing shown in its own section.',
      },
    },
    {
      name: 'dimensions',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'length',
              type: 'text',
            },
            {
              name: 'width',
              type: 'text',
            },
            {
              name: 'height',
              type: 'text',
            },
          ],
        },
        {
          name: 'notes',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'loadCapacity',
      type: 'text',
    },
    {
      name: 'surfaceTreatment',
      type: 'textarea',
    },
    {
      name: 'brochures',
      type: 'relationship',
      relationTo: 'brochures',
      hasMany: true,
    },
    {
      name: 'model3D',
      label: '3D Model',
      type: 'relationship',
      relationTo: 'three-d-assets',
    },
    {
      name: 'isConfigurable',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'configurationOptions',
      type: 'array',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.isConfigurable),
      },
      fields: [
        {
          name: 'group',
          type: 'text',
          required: true,
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              required: true,
            },
            {
              name: 'priceImpactNote',
              type: 'text',
            },
            {
              name: 'swatch',
              label: 'Swatch color (optional)',
              type: 'text',
              admin: {
                description: 'Hex color to tint this option pill (Color groups), e.g. #3d47ff.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'relatedCaseStudies',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
    },
    layoutField,
    seoFields,
  ],
}
