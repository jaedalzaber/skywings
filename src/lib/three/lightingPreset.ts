export const ENVIRONMENT_PRESETS = [
  'apartment',
  'city',
  'dawn',
  'forest',
  'lobby',
  'night',
  'park',
  'studio',
  'sunset',
  'warehouse',
] as const

export const TONE_MAPPINGS = [
  'none',
  'linear',
  'reinhard',
  'cineon',
  'aces-filmic',
  'agx',
  'neutral',
] as const

export const SHADOW_MAP_TYPES = ['basic', 'percentage', 'soft', 'variance'] as const

export type EnvironmentPresetName = (typeof ENVIRONMENT_PRESETS)[number]
export type ToneMappingName = (typeof TONE_MAPPINGS)[number]
export type ShadowMapTypeName = (typeof SHADOW_MAP_TYPES)[number]

export type DirectionalLightSettings = {
  castShadow: boolean
  color: string
  enabled: boolean
  intensity: number
  name: string
  position: [number, number, number]
  shadowBias: number
  shadowMapSize: number
}

export type ViewerLightingPreset = {
  ambient: {
    color: string
    enabled: boolean
    intensity: number
  }
  background: {
    blur: number
    color: string
    intensity: number
    mode: 'transparent' | 'color' | 'environment'
  }
  contactShadows: {
    blur: number
    color: string
    enabled: boolean
    far: number
    opacity: number
    positionY: number
    scale: number
  }
  directionalLights: DirectionalLightSettings[]
  environment: {
    hdriUrl: string | null
    intensity: number
    preset: EnvironmentPresetName
    rotation: [number, number, number]
    source: 'none' | 'preset' | 'hdri'
  }
  hemisphere: {
    enabled: boolean
    groundColor: string
    intensity: number
    skyColor: string
  }
  renderer: {
    exposure: number
    shadowMapType: ShadowMapTypeName
    shadows: boolean
    toneMapping: ToneMappingName
  }
}

export const DEFAULT_LIGHTING_PRESET: ViewerLightingPreset = {
  ambient: {
    color: '#ffffff',
    enabled: true,
    intensity: 1.4,
  },
  background: {
    blur: 0,
    color: '#ffffff',
    intensity: 1,
    mode: 'color',
  },
  contactShadows: {
    blur: 2.4,
    color: '#9da4af',
    enabled: true,
    far: 4,
    opacity: 0.24,
    positionY: -1.4,
    scale: 12,
  },
  directionalLights: [
    {
      castShadow: true,
      color: '#ffffff',
      enabled: true,
      intensity: 3.2,
      name: 'Key',
      position: [4, 6, 5],
      shadowBias: -0.0001,
      shadowMapSize: 1024,
    },
    {
      castShadow: false,
      color: '#ffffff',
      enabled: true,
      intensity: 1.4,
      name: 'Fill',
      position: [-5, 3, -4],
      shadowBias: -0.0001,
      shadowMapSize: 1024,
    },
    {
      castShadow: false,
      color: '#e8f0ff',
      enabled: true,
      intensity: 1.2,
      name: 'Rim',
      position: [0, 4, -6],
      shadowBias: -0.0001,
      shadowMapSize: 1024,
    },
  ],
  environment: {
    hdriUrl: null,
    intensity: 1,
    preset: 'studio',
    rotation: [0, 0, 0],
    source: 'preset',
  },
  hemisphere: {
    enabled: true,
    groundColor: '#d9dde4',
    intensity: 0.9,
    skyColor: '#ffffff',
  },
  renderer: {
    exposure: 1,
    shadowMapType: 'soft',
    shadows: true,
    toneMapping: 'aces-filmic',
  },
}

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function numberValue(value: unknown, fallback: number, min = -Infinity, max = Infinity) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback
}

function selectValue<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]) {
  return typeof value === 'string' && options.includes(value) ? (value as T[number]) : fallback
}

function mediaUrl(value: unknown) {
  const media = asRecord(value)
  return typeof media.url === 'string' && media.url.length ? media.url : null
}

export function normalizeLightingPreset(value: unknown): ViewerLightingPreset {
  const root = asRecord(value)
  const environment = asRecord(root.environment)
  const background = asRecord(root.background)
  const lights = asRecord(root.lights)
  const ambient = asRecord(lights.ambient)
  const hemisphere = asRecord(lights.hemisphere)
  const contactShadows = asRecord(root.contactShadows)
  const renderer = asRecord(root.renderer)
  const defaults = DEFAULT_LIGHTING_PRESET

  const directionalLights = Array.isArray(lights.directionalLights)
    ? lights.directionalLights.map((item, index): DirectionalLightSettings => {
        const light = asRecord(item)
        const position = asRecord(light.position)
        const fallback = defaults.directionalLights[index] ?? defaults.directionalLights[0]

        return {
          castShadow: booleanValue(light.castShadow, fallback.castShadow),
          color: colorValue(light.color, fallback.color),
          enabled: booleanValue(light.enabled, fallback.enabled),
          intensity: numberValue(light.intensity, fallback.intensity, 0, 100),
          name:
            typeof light.name === 'string' && light.name.length ? light.name : `Light ${index + 1}`,
          position: [
            numberValue(position.x, fallback.position[0], -100, 100),
            numberValue(position.y, fallback.position[1], -100, 100),
            numberValue(position.z, fallback.position[2], -100, 100),
          ],
          shadowBias: numberValue(light.shadowBias, fallback.shadowBias, -0.1, 0.1),
          shadowMapSize: numberValue(light.shadowMapSize, fallback.shadowMapSize, 256, 4096),
        }
      })
    : defaults.directionalLights

  return {
    ambient: {
      color: colorValue(ambient.color, defaults.ambient.color),
      enabled: booleanValue(ambient.enabled, defaults.ambient.enabled),
      intensity: numberValue(ambient.intensity, defaults.ambient.intensity, 0, 100),
    },
    background: {
      blur: numberValue(background.blur, defaults.background.blur, 0, 1),
      color: colorValue(background.color, defaults.background.color),
      intensity: numberValue(background.intensity, defaults.background.intensity, 0, 100),
      mode: selectValue(
        background.mode,
        ['transparent', 'color', 'environment'] as const,
        defaults.background.mode,
      ),
    },
    contactShadows: {
      blur: numberValue(contactShadows.blur, defaults.contactShadows.blur, 0, 20),
      color: colorValue(contactShadows.color, defaults.contactShadows.color),
      enabled: booleanValue(contactShadows.enabled, defaults.contactShadows.enabled),
      far: numberValue(contactShadows.far, defaults.contactShadows.far, 0.1, 100),
      opacity: numberValue(contactShadows.opacity, defaults.contactShadows.opacity, 0, 1),
      positionY: numberValue(
        contactShadows.positionY,
        defaults.contactShadows.positionY,
        -100,
        100,
      ),
      scale: numberValue(contactShadows.scale, defaults.contactShadows.scale, 0.1, 100),
    },
    directionalLights,
    environment: {
      hdriUrl: mediaUrl(environment.hdri),
      intensity: numberValue(environment.intensity, defaults.environment.intensity, 0, 100),
      preset: selectValue(environment.preset, ENVIRONMENT_PRESETS, defaults.environment.preset),
      rotation: [
        numberValue(asRecord(environment.rotation).x, defaults.environment.rotation[0], -360, 360),
        numberValue(asRecord(environment.rotation).y, defaults.environment.rotation[1], -360, 360),
        numberValue(asRecord(environment.rotation).z, defaults.environment.rotation[2], -360, 360),
      ],
      source: selectValue(
        environment.source,
        ['none', 'preset', 'hdri'] as const,
        defaults.environment.source,
      ),
    },
    hemisphere: {
      enabled: booleanValue(hemisphere.enabled, defaults.hemisphere.enabled),
      groundColor: colorValue(hemisphere.groundColor, defaults.hemisphere.groundColor),
      intensity: numberValue(hemisphere.intensity, defaults.hemisphere.intensity, 0, 100),
      skyColor: colorValue(hemisphere.skyColor, defaults.hemisphere.skyColor),
    },
    renderer: {
      exposure: numberValue(renderer.exposure, defaults.renderer.exposure, 0, 10),
      shadowMapType: selectValue(
        renderer.shadowMapType,
        SHADOW_MAP_TYPES,
        defaults.renderer.shadowMapType,
      ),
      shadows: booleanValue(renderer.shadows, defaults.renderer.shadows),
      toneMapping: selectValue(renderer.toneMapping, TONE_MAPPINGS, defaults.renderer.toneMapping),
    },
  }
}
