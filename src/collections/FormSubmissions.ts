import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: {
    singular: 'Form Submission',
    plural: 'Form Submissions',
  },
  access: {
    create: anyone,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'formName',
    defaultColumns: ['formName', 'email', 'source', 'createdAt'],
  },
  fields: [
    {
      name: 'formName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      index: true,
    },
    {
      name: 'source',
      type: 'text',
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: ['pages', 'landing-pages'],
    },
    {
      name: 'lead',
      type: 'relationship',
      relationTo: 'leads',
    },
    {
      name: 'data',
      type: 'json',
      required: true,
    },
  ],
}
