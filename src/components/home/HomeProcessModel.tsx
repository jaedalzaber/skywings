'use client'

import { Edges, Grid } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Group } from 'three'

const subscribeToWebGLAvailability = () => () => undefined
const getWebGLAvailability = () =>
  typeof window !== 'undefined' && typeof window.WebGLRenderingContext !== 'undefined'

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

export function HomeProcessModel() {
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
      <ambientLight intensity={1.2} />
      <WireframeProduct />
      <Grid
        args={[10, 10]}
        cellColor="#7292ff"
        cellSize={0.5}
        fadeDistance={9}
        fadeStrength={1}
        infiniteGrid
        position={[0, -1.35, 0]}
        sectionColor="#a6b8ff"
        sectionSize={2}
      />
    </Canvas>
  )
}
