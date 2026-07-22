import type { CollectionConfig, Field } from 'payload'

import { authenticated } from '../access'
import { slugField } from '../fields/slug'
import {
  DEFAULT_LIGHTING_PRESET,
  ENVIRONMENT_PRESETS,
  SHADOW_MAP_TYPES,
  TONE_MAPPINGS,
} from '../lib/three/lightingPreset'

const colorField = (name: string, label: string, defaultValue: string): Field => ({
  name,
  type: 'text',
  label,
  defaultValue,
  validate: (value: unknown) =>
    typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
      ? true
      : 'Use a six-digit hex color, for example #ffffff.',
})

const intensityField = (name: string, label: string, defaultValue: number): Field => ({
  name,
  type: 'number',
  label,
  defaultValue,
  min: 0,
  max: 100,
})

export const LightingPresets: CollectionConfig = {
  slug: 'lighting-presets',
  labels: {
    singular: 'Lighting Preset',
    plural: 'Lighting Presets',
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: '3D Viewer',
    useAsTitle: 'title',
    defaultColumns: ['title', 'environment.source', 'renderer.toneMapping', 'updatedAt'],
    description:
      'Reusable scene lighting and renderer settings. Editing a preset updates every linked 3D asset.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            slugField(),
            {
              name: 'description',
              type: 'textarea',
            },
          ],
        },
        {
          name: 'environment',
          label: 'Environment',
          fields: [
            {
              name: 'source',
              type: 'select',
              required: true,
              defaultValue: DEFAULT_LIGHTING_PRESET.environment.source,
              options: [
                { label: 'Built-in environment', value: 'preset' },
                { label: 'Uploaded HDRI', value: 'hdri' },
                { label: 'None', value: 'none' },
              ],
            },
            {
              name: 'preset',
              type: 'select',
              defaultValue: DEFAULT_LIGHTING_PRESET.environment.preset,
              options: ENVIRONMENT_PRESETS.map((value) => ({
                label: value.charAt(0).toUpperCase() + value.slice(1),
                value,
              })),
              admin: {
                condition: (_, siblingData) => siblingData?.source === 'preset',
              },
            },
            {
              name: 'hdri',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: (_, siblingData) => siblingData?.source === 'hdri',
                description:
                  'Upload an .hdr or .exr environment map in Media, then select it here.',
              },
            },
            intensityField(
              'intensity',
              'Environment intensity',
              DEFAULT_LIGHTING_PRESET.environment.intensity,
            ),
            {
              name: 'rotation',
              type: 'group',
              label: 'Environment rotation (degrees)',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'x', type: 'number', defaultValue: 0, min: -360, max: 360 },
                    { name: 'y', type: 'number', defaultValue: 0, min: -360, max: 360 },
                    { name: 'z', type: 'number', defaultValue: 0, min: -360, max: 360 },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'background',
          label: 'Background',
          fields: [
            {
              name: 'mode',
              type: 'select',
              required: true,
              defaultValue: DEFAULT_LIGHTING_PRESET.background.mode,
              options: [
                { label: 'Solid color', value: 'color' },
                { label: 'Environment', value: 'environment' },
                { label: 'Transparent', value: 'transparent' },
              ],
            },
            colorField('color', 'Background color', DEFAULT_LIGHTING_PRESET.background.color),
            intensityField(
              'intensity',
              'Background intensity',
              DEFAULT_LIGHTING_PRESET.background.intensity,
            ),
            {
              name: 'blur',
              type: 'number',
              label: 'Environment background blur',
              defaultValue: DEFAULT_LIGHTING_PRESET.background.blur,
              min: 0,
              max: 1,
              admin: {
                step: 0.05,
              },
            },
          ],
        },
        {
          name: 'lights',
          label: 'Lights',
          fields: [
            {
              name: 'ambient',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'enabled',
                      type: 'checkbox',
                      defaultValue: DEFAULT_LIGHTING_PRESET.ambient.enabled,
                    },
                    intensityField(
                      'intensity',
                      'Intensity',
                      DEFAULT_LIGHTING_PRESET.ambient.intensity,
                    ),
                    colorField('color', 'Color', DEFAULT_LIGHTING_PRESET.ambient.color),
                  ],
                },
              ],
            },
            {
              name: 'hemisphere',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'enabled',
                      type: 'checkbox',
                      defaultValue: DEFAULT_LIGHTING_PRESET.hemisphere.enabled,
                    },
                    intensityField(
                      'intensity',
                      'Intensity',
                      DEFAULT_LIGHTING_PRESET.hemisphere.intensity,
                    ),
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    colorField(
                      'skyColor',
                      'Sky color',
                      DEFAULT_LIGHTING_PRESET.hemisphere.skyColor,
                    ),
                    colorField(
                      'groundColor',
                      'Ground color',
                      DEFAULT_LIGHTING_PRESET.hemisphere.groundColor,
                    ),
                  ],
                },
              ],
            },
            {
              name: 'directionalLights',
              type: 'array',
              label: 'Directional lights',
              defaultValue: DEFAULT_LIGHTING_PRESET.directionalLights.map((light) => ({
                castShadow: light.castShadow,
                color: light.color,
                enabled: light.enabled,
                intensity: light.intensity,
                name: light.name,
                position: {
                  x: light.position[0],
                  y: light.position[1],
                  z: light.position[2],
                },
                shadowBias: light.shadowBias,
                shadowMapSize: light.shadowMapSize,
              })),
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true },
                    { name: 'enabled', type: 'checkbox', defaultValue: true },
                    intensityField('intensity', 'Intensity', 1),
                    colorField('color', 'Color', '#ffffff'),
                  ],
                },
                {
                  name: 'position',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'x', type: 'number', defaultValue: 4, min: -100, max: 100 },
                        { name: 'y', type: 'number', defaultValue: 6, min: -100, max: 100 },
                        { name: 'z', type: 'number', defaultValue: 5, min: -100, max: 100 },
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'castShadow', type: 'checkbox', defaultValue: false },
                    {
                      name: 'shadowMapSize',
                      type: 'number',
                      defaultValue: 1024,
                      min: 256,
                      max: 4096,
                    },
                    {
                      name: 'shadowBias',
                      type: 'number',
                      defaultValue: -0.0001,
                      min: -0.1,
                      max: 0.1,
                      admin: { step: 0.0001 },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'contactShadows',
          label: 'Shadows',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: DEFAULT_LIGHTING_PRESET.contactShadows.enabled,
              label: 'Enable contact shadows',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'opacity',
                  type: 'number',
                  defaultValue: DEFAULT_LIGHTING_PRESET.contactShadows.opacity,
                  min: 0,
                  max: 1,
                  admin: { step: 0.05 },
                },
                {
                  name: 'blur',
                  type: 'number',
                  defaultValue: DEFAULT_LIGHTING_PRESET.contactShadows.blur,
                  min: 0,
                  max: 20,
                  admin: { step: 0.1 },
                },
                colorField('color', 'Color', DEFAULT_LIGHTING_PRESET.contactShadows.color),
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'far',
                  type: 'number',
                  defaultValue: DEFAULT_LIGHTING_PRESET.contactShadows.far,
                  min: 0.1,
                  max: 100,
                },
                {
                  name: 'scale',
                  type: 'number',
                  defaultValue: DEFAULT_LIGHTING_PRESET.contactShadows.scale,
                  min: 0.1,
                  max: 100,
                },
                {
                  name: 'positionY',
                  type: 'number',
                  label: 'Vertical position',
                  defaultValue: DEFAULT_LIGHTING_PRESET.contactShadows.positionY,
                  min: -100,
                  max: 100,
                },
              ],
            },
          ],
        },
        {
          name: 'renderer',
          label: 'Renderer',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'toneMapping',
                  type: 'select',
                  required: true,
                  defaultValue: DEFAULT_LIGHTING_PRESET.renderer.toneMapping,
                  options: TONE_MAPPINGS.map((value) => ({
                    label: value
                      .split('-')
                      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' '),
                    value,
                  })),
                },
                {
                  name: 'exposure',
                  type: 'number',
                  defaultValue: DEFAULT_LIGHTING_PRESET.renderer.exposure,
                  min: 0,
                  max: 10,
                  admin: { step: 0.05 },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'shadows',
                  type: 'checkbox',
                  defaultValue: DEFAULT_LIGHTING_PRESET.renderer.shadows,
                  label: 'Enable renderer shadows',
                },
                {
                  name: 'shadowMapType',
                  type: 'select',
                  defaultValue: DEFAULT_LIGHTING_PRESET.renderer.shadowMapType,
                  options: SHADOW_MAP_TYPES.map((value) => ({
                    label: value.charAt(0).toUpperCase() + value.slice(1),
                    value,
                  })),
                },
              ],
            },
          ],
        },
        {
          label: 'Preview',
          fields: [
            {
              name: 'lightingPreview',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/admin/LightingPresetPreview#LightingPresetPreview',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}
