import type { Block } from 'payload'

export const ProcessStepsBlock: Block = {
  slug: 'processSteps',
  interfaceName: 'ProcessStepsBlock',
  labels: {
    singular: 'Process / Steps Block',
    plural: 'Process / Steps Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
  ],
}
