import type { Block } from 'payload'

export const HomeProcessBlock: Block = {
  slug: 'homeProcess',
  interfaceName: 'HomeProcessBlock',
  labels: {
    singular: 'Home Process Block',
    plural: 'Home Process Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Our Manufacturing Process',
    },
    /*
     * Both run alongside the row: `intro` sits opposite the heading, `summary`
     * closes the section under the row. Authored as runs so the brand phrases
     * can come forward in white against muted copy, the same shape the
     * services heading uses.
     */
    {
      name: 'intro',
      label: 'Line beside the heading',
      type: 'array',
      admin: {
        description:
          'Short line shown top-right, opposite the heading. Tick Emphasise to bring a run forward; keep the spaces around each run.',
      },
      defaultValue: [
        { text: 'Sky Wings provides ' },
        { emphasis: true, text: 'End-to-End Metal Manufacturing.' },
      ],
      fields: [
        { name: 'text', type: 'text', required: true },
        { name: 'emphasis', type: 'checkbox', defaultValue: false, label: 'Emphasise' },
      ],
    },
    {
      name: 'summary',
      label: 'Closing paragraph',
      type: 'array',
      admin: {
        description: 'Paragraph shown bottom-left, under the row.',
      },
      defaultValue: [
        { text: 'Sky Wings provides ' },
        { emphasis: true, text: 'End-to-End Metal Manufacturing.' },
        { text: ' We take a ' },
        { emphasis: true, text: 'requirement' },
        {
          text: ' — a drawing, a sample, a concept, or a problem to solve — and convert it into a ',
        },
        { emphasis: true, text: 'manufactured product' },
        { text: '.' },
      ],
      fields: [
        { name: 'text', type: 'text', required: true },
        { name: 'emphasis', type: 'checkbox', defaultValue: false, label: 'Emphasise' },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description:
          'Shown as a pinned accordion on desktop: each step expands in turn and collapses into a narrow rail showing its number, label and icon.',
      },
      defaultValue: [
        { label: 'Brief', title: 'Client Brief' },
        { label: 'Design', title: 'Mechanical CAD Design' },
        { label: 'Machining', title: 'Laser Cutting & Machining' },
        { label: 'Assembly', title: 'Welding & Assembly' },
        { label: 'Finishing', title: 'Surface Treatment & Finishing' },
        { label: 'Delivery', title: 'Final Inspection & Delivery' },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            description:
              'One or two words for the collapsed rail, e.g. "Brief". Falls back to the title.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'One sentence shown while the step is expanded.',
          },
        },
        {
          name: 'infographicImage',
          label: 'Icon',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Line icon for the step. Stays visible in the collapsed rail.',
          },
        },
      ],
    },
    {
      name: 'cta',
      label: 'Closing panel',
      type: 'group',
      admin: {
        description: 'The panel that fills the row once every step has collapsed.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Custom engineering',
        },
        {
          name: 'heading',
          type: 'text',
          defaultValue: 'Custom Product Development',
        },
        {
          name: 'copy',
          type: 'textarea',
          defaultValue:
            'For requirements outside our standard product range, Sky Wings develops purpose-built equipment and fabricated products from specification and engineering through manufacturing and final assembly.',
        },
        {
          name: 'ctaLabel',
          type: 'text',
          defaultValue: 'Custom Product Service',
        },
        {
          name: 'ctaHref',
          type: 'text',
          defaultValue: '/contact',
        },
      ],
    },

    /*
     * Retired by the accordion redesign: the section no longer shows an
     * eyebrow or a 3D viewer. Kept hidden so a schema push stays additive --
     * dropping them makes drizzle ask, interactively, whether each removal is
     * a rename, and takes authored content with it. Drop them in a written
     * migration once the old content is confirmed dead.
     */
    {
      name: 'eyebrow',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'model3D',
      type: 'upload',
      relationTo: 'three-d-assets',
      admin: { hidden: true },
    },
    {
      name: 'modelAppearance',
      type: 'group',
      admin: { hidden: true },
      fields: [
        { name: 'lineOpacity', type: 'number', defaultValue: 0.3 },
        { name: 'lineThickness', type: 'number', defaultValue: 0.75 },
        { name: 'fadeStart', type: 'number', defaultValue: 5.5 },
        { name: 'fadeEnd', type: 'number', defaultValue: 12 },
      ],
    },
  ],
}
