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
    group: '3D Viewer',
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
      type: 'relationship',
      relationTo: 'lighting-presets',
      admin: {
        description:
          'Select a reusable lighting preset. Editing the preset updates every linked model automatically.',
      },
    },
    {
      name: 'viewerActions',
      label: 'Viewer actions',
      type: 'select',
      hasMany: true,
      defaultValue: ['auto-rotate', 'reset-view'],
      admin: {
        description:
          'Controls shown in the 3D viewer for this model. Clip-based actions play a matching animation clip in the GLB (e.g. an action named "fold").',
      },
      options: [
        { label: 'Fold / Unfold', value: 'fold-unfold' },
        { label: 'Open / Close', value: 'open-close' },
        { label: 'Extend / Retract', value: 'extend-retract' },
        { label: 'Exploded View', value: 'exploded-view' },
        { label: 'Play / Pause Animation', value: 'play-pause' },
        { label: 'Reset View', value: 'reset-view' },
        { label: 'Auto Rotate', value: 'auto-rotate' },
        { label: 'Hotspots / Annotations', value: 'hotspots' },
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
