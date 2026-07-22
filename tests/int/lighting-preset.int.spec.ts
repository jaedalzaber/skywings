import { describe, expect, it } from 'vitest'

import { DEFAULT_LIGHTING_PRESET, normalizeLightingPreset } from '@/lib/three/lightingPreset'

describe('lighting preset normalization', () => {
  it('keeps the studio presentation as the fallback', () => {
    expect(normalizeLightingPreset(null)).toEqual(DEFAULT_LIGHTING_PRESET)
  })

  it('normalizes reusable preset data and a populated HDRI upload', () => {
    const preset = normalizeLightingPreset({
      environment: {
        source: 'hdri',
        hdri: { url: '/api/media/file/studio.hdr' },
        intensity: 1.8,
        rotation: { x: 10, y: 45, z: -5 },
      },
      background: {
        mode: 'environment',
        blur: 0.25,
        intensity: 0.8,
      },
      lights: {
        ambient: { enabled: false },
        directionalLights: [
          {
            name: 'Key',
            enabled: true,
            intensity: 2.5,
            color: '#ffeecc',
            position: { x: 2, y: 4, z: 6 },
            castShadow: true,
            shadowMapSize: 2048,
            shadowBias: -0.001,
          },
        ],
      },
      renderer: {
        exposure: 1.25,
        shadows: true,
        shadowMapType: 'variance',
        toneMapping: 'neutral',
      },
    })

    expect(preset.environment).toMatchObject({
      hdriUrl: '/api/media/file/studio.hdr',
      intensity: 1.8,
      rotation: [10, 45, -5],
      source: 'hdri',
    })
    expect(preset.background.mode).toBe('environment')
    expect(preset.ambient.enabled).toBe(false)
    expect(preset.directionalLights[0]).toMatchObject({
      color: '#ffeecc',
      intensity: 2.5,
      position: [2, 4, 6],
      shadowMapSize: 2048,
    })
    expect(preset.renderer).toEqual({
      exposure: 1.25,
      shadows: true,
      shadowMapType: 'variance',
      toneMapping: 'neutral',
    })
  })

  it('clamps unsafe renderer values and rejects malformed colors', () => {
    const preset = normalizeLightingPreset({
      background: { color: 'white' },
      renderer: { exposure: 99 },
    })

    expect(preset.background.color).toBe(DEFAULT_LIGHTING_PRESET.background.color)
    expect(preset.renderer.exposure).toBe(10)
  })
})
