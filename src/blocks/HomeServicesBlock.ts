import type { Block } from 'payload'

export const HomeServicesBlock: Block = {
  slug: 'homeServices',
  interfaceName: 'HomeServicesBlock',
  labels: {
    singular: 'Home Services Block',
    plural: 'Home Services Blocks',
  },
  fields: [
    /*
     * The heading is authored as segments rather than one string so the
     * two-tone treatment stays editable: muted text carries the sentence,
     * emphasised text carries the claim. Rich text would allow the same thing
     * but drags a whole editor in for one boolean per run.
     */
    {
      name: 'headingSegments',
      type: 'array',
      label: 'Heading',
      admin: {
        description:
          'The section headline, split into runs. Tick Emphasise to bring a run forward in white; untouched runs stay muted. Keep the spaces around each run — they are rendered as written.',
      },
      defaultValue: [
        { text: 'Sky Wings provides ' },
        { emphasis: true, text: 'End-to-End Metal Manufacturing.' },
        { text: ' We take a ' },
        { emphasis: true, text: 'Requirement' },
        {
          text: ' — a drawing, a sample, a concept, or a problem to solve — and convert it into a ',
        },
        { emphasis: true, text: 'Manufactured product' },
        { text: '.' },
      ],
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'emphasis',
          type: 'checkbox',
          defaultValue: false,
          label: 'Emphasise',
        },
      ],
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'One partner from design to delivery',
      admin: {
        description:
          'Plain-text fallback, used when no heading runs are set above. Also the accessible name for the section.',
      },
    },
    /*
     * Retired by the grid redesign but kept so a schema push stays additive.
     * Dropping them takes authored copy with it and makes drizzle ask whether
     * each removal is a rename, which cannot be answered in a non-interactive
     * run. Remove them in a written migration when the copy is confirmed dead.
     */
    {
      name: 'eyebrow',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { hidden: true },
    },
    {
      name: 'secondaryDescription',
      type: 'textarea',
      admin: { hidden: true },
    },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Services',
      defaultValue: [
        { title: 'Ground Support Equipment' },
        { title: 'Structural Steel Fabrication' },
        { title: 'Architectural & Interior Metalwork' },
        { title: 'Heavy Machinery' },
        { title: 'Sheet Metal Products' },
        { title: 'Custom Manufacturing' },
      ],
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
          admin: {
            description: 'Resting artwork. Shown at 3:2 and cropped to fill.',
          },
        },
        {
          // Retired with the card redesign; see the note above.
          name: 'accentTitle',
          type: 'checkbox',
          admin: { hidden: true },
        },
        {
          name: 'hoverMedia',
          type: 'upload',
          relationTo: 'media',
          label: 'Hover animation',
          admin: {
            description:
              'Optional GIF or short muted clip that replaces the image while the card is hovered. MP4 or WebM is far lighter than a GIF at the same quality. Leave empty and the card simply keeps its image.',
          },
        },
      ],
    },
  ],
}
