'use client'

import { Center, Edges, Grid, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { DoubleSide, MeshBasicMaterial } from 'three'
import type { Group, Mesh, Object3D } from 'three'

const subscribeToWebGLAvailability = () => () => undefined
const getWebGLAvailability = () =>
  typeof window !== 'undefined' && typeof window.WebGLRenderingContext !== 'undefined'
const uploadedModelZoom = 0.56
const defaultModelAppearance = {
  fadeEnd: 12,
  fadeStart: 5.5,
  lineOpacity: 0.3,
  lineThickness: 0.65,
} as const

export type HomeProcessModelAppearance = {
  fadeEnd?: number | null
  fadeStart?: number | null
  lineOpacity?: number | null
  lineThickness?: number | null
}

function clampNumber(value: number | null | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback

  return Math.min(max, Math.max(min, value))
}

function resolveModelAppearance(appearance?: HomeProcessModelAppearance | null) {
  const fadeStart = clampNumber(appearance?.fadeStart, defaultModelAppearance.fadeStart, 0, 30)
  const fadeEnd = Math.max(
    fadeStart + 0.1,
    clampNumber(appearance?.fadeEnd, defaultModelAppearance.fadeEnd, 0.1, 50),
  )

  return {
    fadeEnd,
    fadeStart,
    lineOpacity: clampNumber(appearance?.lineOpacity, defaultModelAppearance.lineOpacity, 0.05, 1),
    lineThickness: clampNumber(
      appearance?.lineThickness,
      defaultModelAppearance.lineThickness,
      0.25,
      2,
    ),
  }
}

function WireframeProduct() {
  const group = useRef<Group>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReduceMotion(query.matches)

    updatePreference()
    query.addEventListener('change', updatePreference)
    return () => query.removeEventListener('change', updatePreference)
  }, [])

  useFrame((_, delta) => {
    if (group.current && !reduceMotion) {
      group.current.rotation.y += delta * 0.22
    }
  })

  return (
    <group ref={group} rotation={[0.18, -0.55, 0]}>
      <mesh>
        <boxGeometry args={[2.8, 1.15, 1.7]} />
        <meshBasicMaterial color="#0877ff" transparent opacity={0.32} />
        <Edges color="#ffffff" linewidth={1.5} />
      </mesh>
      <mesh scale={[1.01, 1.01, 1.01]}>
        <boxGeometry args={[2.8, 1.15, 1.7]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
      </mesh>
    </group>
  )
}

function UploadedProcessModel(props: {
  appearance: ReturnType<typeof resolveModelAppearance>
  scale: number
  url: string
}) {
  const { appearance, scale, url } = props
  const group = useRef<Group>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const { scene } = useGLTF(url)
  const wireframeScenes = useMemo(
    () => createWireframeScenes(scene, appearance),
    [appearance, scene],
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReduceMotion(query.matches)

    updatePreference()
    query.addEventListener('change', updatePreference)
    return () => query.removeEventListener('change', updatePreference)
  }, [])

  useFrame((_, delta) => {
    if (group.current && !reduceMotion) {
      group.current.rotation.y += delta * 0.22
    }
  })

  return (
    <group ref={group} rotation={[0.12, -0.45, 0]} scale={scale}>
      <Center>
        <group>
          <primitive object={wireframeScenes.solid} />
          <primitive object={wireframeScenes.wire} scale={1.002} />
          <primitive
            object={wireframeScenes.thickness}
            scale={1 + appearance.lineThickness * 0.003}
          />
        </group>
      </Center>
    </group>
  )
}

function createWireframeScenes(
  scene: Object3D,
  appearance: ReturnType<typeof resolveModelAppearance>,
) {
  const solid = scene.clone(true)
  const wire = scene.clone(true)
  const thickness = scene.clone(true)
  const solidOpacity = Math.min(0.14, appearance.lineOpacity * 0.42)

  solid.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return

    mesh.material = new MeshBasicMaterial({
      color: '#0877ff',
      depthWrite: false,
      opacity: solidOpacity,
      side: DoubleSide,
      transparent: true,
    })
    mesh.renderOrder = 1
  })

  wire.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return

    mesh.material = new MeshBasicMaterial({
      color: '#edf4ff',
      depthWrite: false,
      opacity: appearance.lineOpacity,
      side: DoubleSide,
      transparent: true,
      wireframe: true,
    })
    mesh.renderOrder = 2
  })

  thickness.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return

    mesh.material = new MeshBasicMaterial({
      color: '#ffffff',
      depthWrite: false,
      opacity: Math.max(0, (appearance.lineThickness - 1) * appearance.lineOpacity * 0.35),
      side: DoubleSide,
      transparent: true,
      wireframe: true,
    })
    mesh.renderOrder = 3
  })

  return { solid, thickness, wire }
}

export function HomeProcessModel(props: {
  appearance?: HomeProcessModelAppearance | null
  modelScale?: number | null
  modelUrl?: string | null
}) {
  const { modelScale, modelUrl } = props
  const appearance = useMemo(() => resolveModelAppearance(props.appearance), [props.appearance])
  const canRenderWebGL = useSyncExternalStore(
    subscribeToWebGLAvailability,
    getWebGLAvailability,
    () => false,
  )

  if (!canRenderWebGL) {
    return <div className="process-model-fallback" aria-hidden="true" />
  }

  return (
    <Canvas camera={{ fov: 38, position: [4.5, 3.2, 5.8] }} dpr={[1, 1.5]}>
      <color attach="background" args={['#2948df']} />
      <fog attach="fog" args={['#2948df', appearance.fadeStart, appearance.fadeEnd]} />
      <ambientLight intensity={1.2} />
      <directionalLight intensity={1.8} position={[3, 4, 5]} />
      <Suspense fallback={null}>
        {modelUrl ? (
          <UploadedProcessModel
            appearance={appearance}
            scale={(modelScale ?? 1) * uploadedModelZoom}
            url={modelUrl}
          />
        ) : (
          <WireframeProduct />
        )}
      </Suspense>
      <OrbitControls enableDamping enablePan={false} enableZoom={false} />
      <Grid
        args={[10, 10]}
        cellColor="#8fa7ff"
        cellSize={0.5}
        fadeDistance={10}
        fadeStrength={0.72}
        infiniteGrid
        position={[0, -1.35, 0]}
        sectionColor="#d4ddff"
        sectionSize={2}
      />
    </Canvas>
  )
}
