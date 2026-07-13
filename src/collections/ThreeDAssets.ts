import type { CollectionConfig } from 'payload'

import { authenticated, publicAssetOrAuthenticated } from '../access'
import { slugField } from '../fields/slug'

export const ThreeDAssets: CollectionConfig = {
  slug: 'three-d-assets',
  labels: {
    singular: '3D Asset',
    plural: '3D Assets',
  },
  access: {
    read: publicAssetOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Assets',
    useAsTitle: 'title',
    defaultColumns: ['title', 'format', 'isPublic', 'updatedAt'],
  },
  upload: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'format',
      type: 'select',
      required: true,
      options: [
        { label: 'GLB', value: 'glb' },
        { label: 'GLTF', value: 'gltf' },
        { label: 'USDZ', value: 'usdz' },
        { label: 'FBX', value: 'fbx' },
        { label: 'OBJ', value: 'obj' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    {
      name: 'scale',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'defaultCamera',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'x',
              type: 'number',
              defaultValue: 3,
            },
            {
              name: 'y',
              type: 'number',
              defaultValue: 2,
            },
            {
              name: 'z',
              type: 'number',
              defaultValue: 4,
            },
          ],
        },
      ],
    },
    {
      name: 'lightingPreset',
      type: 'select',
      defaultValue: 'studio',
      options: [
        { label: 'Studio', value: 'studio' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Outdoor', value: 'outdoor' },
        { label: 'Technical', value: 'technical' },
      ],
    },
    {
      name: 'viewerNotes',
      type: 'textarea',
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
