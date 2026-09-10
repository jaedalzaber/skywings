import type { Block } from 'payload'

/**
 * The locations section: the headline and reach line, the photograph, and the
 * facility list.
 *
 * The facilities and the photograph have always been edited on the Footer
 * global, and they still are -- the rows here are an override for the home
 * page alone. Precedence, per field: this block, then the Footer, then the
 * committed defaults in src/data/homeLocationsDefaults.ts.
 */
export const HomeLocationsBlock: Block = {
  slug: 'homeLocations',
  interfaceName: 'HomeLocationsBlock',
  labels: {
    singular: 'Home Locations Block',
    plural: 'Home Locations Blocks',
  },
  fields: [
    {
      name: 'lead',
      label: 'Headline',
      type: 'text',
      defaultValue: 'We deliver all over',
      admin: { description: 'Set light, above the regions.' },
    },
    {
      /*
       * The earlier design's second line. Hidden rather than removed: dropping
       * the field would drop its column, and the schema push is additive only.
       */
      name: 'reach',
      label: 'Second line',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'regions',
      type: 'array',
      admin: {
        description:
          'Set heavy under the headline and joined as a list: "Middle-East, Europe & Africa".',
      },
      defaultValue: [{ text: 'Middle-East' }, { text: 'Europe' }, { text: 'Africa' }],
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'image',
      label: 'Photograph',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'A portrait aerial, about 4:7. "UAE" is set across its foot in white, so keep the lower part of the picture free of detail. Falls back to the image set on the Footer (Locations image).',
      },
    },
    {
      name: 'locations',
      label: 'Facilities',
      type: 'array',
      admin: {
        description:
          'Leave empty to use the addresses set on the Footer. Filling this in overrides them for the home page only.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { description: 'Set bold, e.g. "Sharjah".' },
        },
        {
          name: 'kind',
          type: 'text',
          admin: { description: 'Set beside the name, e.g. "Head office" or "Branch".' },
        },
        {
          name: 'address',
          type: 'textarea',
          admin: {
            description:
              'One address, written with commas as on the Footer. Broken into lines for the page.',
          },
        },
        {
          name: 'phone',
          type: 'text',
        },
      ],
    },
  ],
}
