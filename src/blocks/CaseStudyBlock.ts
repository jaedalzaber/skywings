import type { Block } from 'payload'

export const CaseStudyBlock: Block = {
  slug: 'caseStudy',
  interfaceName: 'CaseStudyBlock',
  labels: {
    singular: 'Case Study Block',
    plural: 'Case Study Blocks',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
    },
    {
      name: 'caseStudies',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
