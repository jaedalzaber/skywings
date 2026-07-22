'use client'

import { ContactShadows, Environment } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import {
  ACESFilmicToneMapping,
  AgXToneMapping,
  BasicShadowMap,
  CineonToneMapping,
  LinearToneMapping,
  NeutralToneMapping,
  NoToneMapping,
  PCFShadowMap,
  PCFSoftShadowMap,
  ReinhardToneMapping,
  VSMShadowMap,
  type ShadowMapType,
  type ToneMapping,
} from 'three'

import type {
  ShadowMapTypeName,
  ToneMappingName,
  ViewerLightingPreset,
} from '@/lib/three/lightingPreset'

const TONE_MAPPING_VALUES: Record<ToneMappingName, ToneMapping> = {
  none: NoToneMapping,
  linear: LinearToneMapping,
  reinhard: ReinhardToneMapping,
  cineon: CineonToneMapping,
  'aces-filmic': ACESFilmicToneMapping,
  agx: AgXToneMapping,
  neutral: NeutralToneMapping,
}

const SHADOW_MAP_VALUES: Record<ShadowMapTypeName, ShadowMapType> = {
  basic: BasicShadowMap,
  percentage: PCFShadowMap,
  soft: PCFSoftShadowMap,
  variance: VSMShadowMap,
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

export function RendererPreset({ preset }: { preset: ViewerLightingPreset }) {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    gl.toneMapping = TONE_MAPPING_VALUES[preset.renderer.toneMapping]
    gl.toneMappingExposure = preset.renderer.exposure
    gl.shadowMap.enabled = preset.renderer.shadows
    gl.shadowMap.type = SHADOW_MAP_VALUES[preset.renderer.shadowMapType]
    gl.shadowMap.needsUpdate = true
    invalidate()
  }, [gl, invalidate, preset.renderer])

  return null
}

function EnvironmentLighting({ preset }: { preset: ViewerLightingPreset }) {
  const { background, environment } = preset
  if (environment.source === 'none') return null

  const common = {
    background: background.mode === 'environment',
    backgroundBlurriness: background.blur,
    backgroundIntensity: background.intensity,
    environmentIntensity: environment.intensity,
    environmentRotation: environment.rotation.map(degreesToRadians) as [number, number, number],
  }

  if (environment.source === 'hdri') {
    return environment.hdriUrl ? <Environment files={environment.hdriUrl} {...common} /> : null
  }

  return <Environment preset={environment.preset} {...common} />
}

export function LightingRig({ preset }: { preset: ViewerLightingPreset }) {
  return (
    <>
      <RendererPreset preset={preset} />

      {preset.background.mode === 'color' ? (
        <color args={[preset.background.color]} attach="background" />
      ) : null}

      {preset.ambient.enabled ? (
        <ambientLight color={preset.ambient.color} intensity={preset.ambient.intensity} />
      ) : null}

      {preset.hemisphere.enabled ? (
        <hemisphereLight
          color={preset.hemisphere.skyColor}
          groundColor={preset.hemisphere.groundColor}
          intensity={preset.hemisphere.intensity}
        />
      ) : null}

      {preset.directionalLights.map((light, index) =>
        light.enabled ? (
          <directionalLight
            castShadow={preset.renderer.shadows && light.castShadow}
            color={light.color}
            intensity={light.intensity}
            key={`${light.name}-${index}`}
            position={light.position}
            shadow-bias={light.shadowBias}
            shadow-mapSize-height={light.shadowMapSize}
            shadow-mapSize-width={light.shadowMapSize}
          />
        ) : null,
      )}

      <Suspense fallback={null}>
        <EnvironmentLighting preset={preset} />
      </Suspense>

      {preset.contactShadows.enabled ? (
        <ContactShadows
          blur={preset.contactShadows.blur}
          color={preset.contactShadows.color}
          far={preset.contactShadows.far}
          opacity={preset.contactShadows.opacity}
          position={[0, preset.contactShadows.positionY, 0]}
          scale={preset.contactShadows.scale}
        />
      ) : null}
    </>
  )
}
