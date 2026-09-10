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
      defaultValue: 'UAE manufacturing presence.',
    },
    {
      name: 'reach',
      label: 'Second line',
      type: 'text',
      defaultValue: 'Regional and international reach.',
      admin: { description: 'Set lighter under the headline.' },
    },
    {
      name: 'regions',
      type: 'array',
      admin: { description: 'Listed under the headline, separated by dots.' },
      defaultValue: [{ text: 'Middle East' }, { text: 'Europe' }, { text: 'Africa' }],
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'image',
      label: 'Photograph',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Falls back to the image set on the Footer (Locations image).',
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
