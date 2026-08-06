import type { Block } from 'payload'

import { optionalLinkGroup } from '../fields/link'
import { sectionSettings } from '../fields/section'

/**
 * Brochure download. The file is a real Payload upload rather than a typed URL
 * so the download cannot rot when a document is replaced, and so format and
 * size can be reported honestly to the visitor before they click.
 */
export const BrochureBlock: Block = {
  slug: 'brochureDownload',
  interfaceName: 'BrochureBlock',
  // Shortened so nested array/enum identifiers stay under Postgres's 63-char cap.
  dbName: 'brochure_dl',
  labels: {
    singular: 'Brochure Download',
    plural: 'Brochure Downloads',
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
      type: 'richText',
    },
    {
      name: 'source',
      label: 'Brochure source',
      type: 'select',
      defaultValue: 'brochure',
      admin: {
        description:
          'Link an existing brochure record, or upload a standalone file for this page only.',
      },
      options: [
        { label: 'Brochure record', value: 'brochure' },
        { label: 'Direct file upload', value: 'file' },
      ],
    },
    {
      name: 'brochure',
      type: 'relationship',
      relationTo: 'brochures',
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'file',
        description: 'Cover image, page count and file are read from the brochure record.',
      },
    },
    {
      name: 'file',
      label: 'PDF file',
      type: 'upload',
      relationTo: 'brochures',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'file',
      },
    },
    {
      name: 'coverImage',
      label: 'Cover image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional override. Falls back to the brochure record cover.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'format',
          type: 'text',
          defaultValue: 'PDF',
        },
        {
          name: 'pageCount',
          label: 'Pages',
          type: 'number',
          min: 1,
          admin: { description: 'Optional override. Falls back to the brochure record.' },
        },
      ],
    },
    optionalLinkGroup({
      description: 'Label for the download button. The file comes from the source above.',
      label: 'Download button',
      name: 'downloadAction',
    }),
    optionalLinkGroup({
      defaultStyle: 'secondary',
      label: 'Secondary button',
      name: 'secondaryAction',
    }),
    ...sectionSettings('light'),
  ],
}
