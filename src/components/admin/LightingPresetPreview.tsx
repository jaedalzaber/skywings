'use client'

import { Bounds, OrbitControls, RoundedBox } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

import { LightingRig } from '@/components/three/LightingRig'
import { normalizeLightingPreset } from '@/lib/three/lightingPreset'

import './LightingPresetPreview.scss'

type MediaDocument = {
  id: number | string
  url?: string | null
}

function PreviewObject({ shadows }: { shadows: boolean }) {
  return (
    <group rotation={[0, -0.45, 0]}>
      <RoundedBox
        args={[2.8, 0.45, 1.75]}
        castShadow={shadows}
        position={[0, 0.35, 0]}
        radius={0.08}
        receiveShadow={shadows}
        smoothness={5}
      >
        <meshStandardMaterial color="#dfe3e8" metalness={0.75} roughness={0.24} />
      </RoundedBox>
      <RoundedBox
        args={[1.35, 0.75, 1.1]}
        castShadow={shadows}
        position={[0.15, 0.95, 0]}
        radius={0.12}
        receiveShadow={shadows}
        smoothness={5}
      >
        <meshStandardMaterial color="#ffffff" metalness={0.15} roughness={0.38} />
      </RoundedBox>
      <mesh castShadow={shadows} position={[-1, -0.15, 0.55]} receiveShadow={shadows}>
        <sphereGeometry args={[0.38, 48, 48]} />
        <meshStandardMaterial color="#285cff" metalness={0.35} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function LightingPresetPreview() {
  const { getData } = useForm()
  const fields = useFormFields(([formFields]) => formFields)
  const data = useMemo(() => getData(), [fields, getData])
  const environment = data.environment as Record<string, unknown> | undefined
  const hdriValue = environment?.hdri
  const hdriId =
    typeof hdriValue === 'number' || typeof hdriValue === 'string' ? hdriValue : undefined
  const [hdriDocument, setHdriDocument] = useState<MediaDocument | null>(null)

  useEffect(() => {
    if (hdriId === undefined) {
      setHdriDocument(null)
      return
    }

    const controller = new AbortController()
    void fetch(`/api/media/${hdriId}?depth=0`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((document: MediaDocument | null) => setHdriDocument(document))
      .catch(() => undefined)

    return () => controller.abort()
  }, [hdriId])

  const previewData = useMemo(
    () => ({
      ...data,
      environment: {
        ...environment,
        hdri: hdriDocument ?? hdriValue,
      },
    }),
    [data, environment, hdriDocument, hdriValue],
  )
  const preset = useMemo(() => normalizeLightingPreset(previewData), [previewData])

  return (
    <section className="lighting-preset-preview">
      <div className="lighting-preset-preview__header">
        <div>
          <strong>Live lighting preview</strong>
          <p>Drag to orbit and scroll to zoom. Unsaved field changes appear here immediately.</p>
        </div>
        <span>{preset.renderer.toneMapping}</span>
      </div>
      <div className="lighting-preset-preview__stage">
        <Canvas
          camera={{ fov: 38, position: [4.5, 3, 5.5] }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          shadows={preset.renderer.shadows ? preset.renderer.shadowMapType : false}
        >
          <LightingRig preset={preset} />
          <Bounds fit margin={1.35} observe>
            <PreviewObject shadows={preset.renderer.shadows} />
          </Bounds>
          <OrbitControls makeDefault maxDistance={12} minDistance={2.5} />
        </Canvas>
      </div>
    </section>
  )
}
