import type { Field, GlobalConfig } from 'payload'

import { anyone } from '../access'
import { linkGroup } from '../fields/link'

/**
 * Where a row in the bar points. Most rows are addresses typed in by hand;
 * the ones inside the Products menu are a shelf of the catalogue instead, and
 * an editor should not have to know that the shelf for aviation containers is
 * spelled /products?industry=aviation&family=uld-containers. Choosing the
 * industry, and the family within it, builds that address on the way out --
 * see productCategoryHref in src/data/site.ts.
 */
const linkTarget: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'label',
        type: 'text',
        required: true,
      },
      {
        name: 'href',
        type: 'text',
        admin: {
          condition: (_data, siblingData) => (siblingData?.linkType ?? 'custom') === 'custom',
          description: 'A path on this site, such as /capabilities, or a full web address.',
        },
        validate: (value: string | null | undefined, options: { siblingData?: unknown }) => {
          const sibling = options.siblingData as { linkType?: string } | undefined
          if ((sibling?.linkType ?? 'custom') !== 'custom') return true

          return typeof value === 'string' && value.trim()
            ? true
            : 'Add an address, or point this at a product category instead.'
        },
      },
    ],
  },
  {
    name: 'linkType',
    type: 'radio',
    defaultValue: 'custom',
    label: 'Points at',
    options: [
      { label: 'An address', value: 'custom' },
      { label: 'A product category', value: 'productCategory' },
    ],
    admin: {
      layout: 'horizontal',
    },
  },
  {
    type: 'row',
    admin: {
      condition: (_data, siblingData) => siblingData?.linkType === 'productCategory',
    },
    fields: [
      {
        name: 'industry',
        type: 'relationship',
        relationTo: 'industries',
        admin: {
          description: 'The catalogue opens filtered to this industry.',
        },
      },
      {
        name: 'family',
        type: 'relationship',
        relationTo: 'product-families',
        admin: {
          description: 'Optional. Narrows it further to one family within that industry.',
        },
      },
    ],
  },
]

/**
 * What becomes of the row. The two are deliberately separate: an entry whose
 * page is being written should stay in the menu so the range still reads
 * whole, while one that is not to be seen at all should leave no trace --
 * and either can be undone without retyping the row.
 */
const visibility: Field = {
  type: 'row',
  fields: [
    {
      name: 'disabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show, but do not link',
      admin: {
        description: 'Stays in the menu, reading as it always did, but goes nowhere when clicked.',
      },
    },
    {
      name: 'hidden',
      type: 'checkbox',
      defaultValue: false,
      label: 'Hide',
      admin: {
        description: 'Left out of the site altogether, and kept here for later.',
      },
    },
  ],
}

/**
 * A row and everything under it, to three levels: the entry in the bar, the
 * columns of its menu, and the links in each column. Three is what the
 * Products menu takes -- industry, then the families within it -- and it is
 * as deep as any menu on the site goes.
 *
 * The third level is 'links' rather than another 'children': an array named
 * the same as the one holding it gives the two tables a relation of the same
 * name, and the database layer cannot tell them apart -- reading the global
 * fails outright, and the bar silently falls back to its built-in menu.
 */
function navigationRow(depth: 1 | 2 | 3): Field[] {
  if (depth === 3) return [...linkTarget, visibility]

  return [
    ...linkTarget,
    visibility,
    {
      name: depth === 1 ? 'children' : 'links',
      type: 'array',
      label: depth === 1 ? 'Menu entries' : 'Links in this column',
      admin: {
        description:
          depth === 1
            ? 'Leave empty for a plain link in the bar. Entries given links of their own become the columns of a mega menu.'
            : undefined,
        initCollapsed: true,
      },
      fields: navigationRow((depth + 1) as 2 | 3),
    },
  ]
}

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: anyone,
  },
  fields: [
    {
      name: 'navigation',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: navigationRow(1),
    },
    {
      name: 'showProudBadge',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show the Proud of UAE badge',
      admin: {
        description: 'Sits in the bar just before the call to action, on wide screens.',
      },
    },
    linkGroup('cta', 'CTA'),
  ],
}
