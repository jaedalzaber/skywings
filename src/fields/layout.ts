import type { Field } from 'payload'

import { pageBuilderBlocks } from '../blocks'

export const layoutField: Field = {
  name: 'layout',
  type: 'blocks',
  blocks: pageBuilderBlocks,
}
