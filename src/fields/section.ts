import type { Field } from 'payload'

/**
 * Section-level appearance controls shared by the industry page blocks.
 *
 * These live here rather than inside each block so a new block picks up the
 * same vocabulary (and the same admin labels) without redefining it, and so a
 * theme added later reaches every section at once.
 */

export const sectionTheme = (defaultValue: 'brand' | 'dark' | 'light' = 'light'): Field => ({
  name: 'theme',
  type: 'select',
  defaultValue,
  admin: {
    description: 'Background and text treatment for this section.',
    position: 'sidebar',
  },
  options: [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Brand (blue)', value: 'brand' },
  ],
})

/**
 * Takes admin options directly rather than expecting callers to spread the
 * result — spreading a `Field` widens it back to the full union and TypeScript
 * can no longer tell which member it is.
 */
type FieldCondition = (
  data: Partial<Record<string, unknown>>,
  siblingData: Partial<Record<string, unknown>>,
) => boolean

export const sectionAlignment = (args: {
  condition?: FieldCondition
  defaultValue?: 'center' | 'left' | 'right'
  description?: string
  name?: string
}): Field => ({
  name: args.name ?? 'alignment',
  type: 'select',
  defaultValue: args.defaultValue ?? 'left',
  admin: {
    condition: args.condition,
    description: args.description,
  },
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
})

/**
 * Lets an editor hide a section without deleting it, which is the difference
 * between staging a change and losing the content.
 */
export const sectionVisibility: Field = {
  name: 'hidden',
  label: 'Hide this section',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Keeps the content but removes the section from the live page.',
    position: 'sidebar',
  },
}

/** Anchor id so in-page navigation and CTAs can target a section. */
export const sectionAnchor: Field = {
  name: 'anchorId',
  label: 'Anchor ID',
  type: 'text',
  admin: {
    description: 'Optional. Enables deep links such as #gse-products.',
    position: 'sidebar',
  },
}

/** Every industry block carries these, so the renderer can treat them uniformly. */
export const sectionSettings = (
  defaultTheme: 'brand' | 'dark' | 'light' = 'light',
): Field[] => [sectionTheme(defaultTheme), sectionAnchor, sectionVisibility]
