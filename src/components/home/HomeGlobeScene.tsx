'use client'

import { Line } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  MathUtils,
  QuadraticBezierCurve3,
  Vector3,
} from 'three'

type PointerTarget = { x: number; y: number }

const globeRadius = 2.2
const uae = { lat: 24.45, lon: 54.38 }
const destinations = [
  { lat: 24.7, lon: 46.7 },
  { lat: 50.1, lon: 10.4 },
  { lat: 1.5, lon: 25.2 },
]

const subscribeToWebGLAvailability = () => () => undefined
const getWebGLAvailability = () =>
  typeof window !== 'undefined' && typeof window.WebGLRenderingContext !== 'undefined'

function coordinateToVector(lat: number, lon: number, radius = globeRadius) {
  const latitude = MathUtils.degToRad(lat)
  const longitude = MathUtils.degToRad(lon - uae.lon)

  return new Vector3(
    -radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
    radius * Math.cos(latitude) * Math.cos(longitude),
  )
}

function isVisibleLand(lat: number, lon: number) {
  const africa = ((lat - 8) / 43) ** 2 + ((lon - 21) / 31) ** 2 < 1
  const europe = lat > 35 && lat < 72 && lon > -12 && lon < 48
  const arabia = lat > 12 && lat < 36 && lon > 34 && lon < 62
  const asia = lat > 5 && lat < 73 && lon > 42 && lon < 145
  const india = lat > 6 && lat < 34 && lon > 67 && lon < 90

  return africa || europe || arabia || asia || india
}

function buildLandGeometry() {
  const positions: number[] = []
  const colors: number[] = []
  const neutral = new Color('#8790aa')
  const accent = new Color('#4167ff')

  for (let lat = -55; lat <= 76; lat += 3.2) {
    for (let lon = -18; lon <= 148; lon += 3.2) {
      if (!isVisibleLand(lat, lon)) continue

      const point = coordinateToVector(lat, lon, globeRadius + 0.018)
      positions.push(point.x, point.y, point.z)

      const nearUae = Math.abs(lat - uae.lat) < 22 && Math.abs(lon - uae.lon) < 35
      const color = nearUae ? accent : neutral
      colors.push(color.r, color.g, color.b)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  return geometry
}

function createRoutePoints(lat: number, lon: number) {
  const start = coordinateToVector(uae.lat, uae.lon, globeRadius + 0.04)
  const end = coordinateToVector(lat, lon, globeRadius + 0.04)
  const distance = start.distanceTo(end)
  const midpoint = start
    .clone()
    .add(end)
    .normalize()
    .multiplyScalar(globeRadius + Math.max(0.28, distance * 0.32))

  return new QuadraticBezierCurve3(start, midpoint, end).getPoints(42)
}

function GlobeContents({ pointer, reduceMotion }: { pointer: MutableRefObject<PointerTarget>; reduceMotion: boolean }) {
  const globe = useRef<Group>(null)
  const landGeometry = useMemo(() => buildLandGeometry(), [])
  const routePoints = useMemo(
    () => destinations.map((destination) => createRoutePoints(destination.lat, destination.lon)),
    [],
  )
  const markerPositions = useMemo(
    () => [uae, ...destinations].map((location) => coordinateToVector(location.lat, location.lon, globeRadius + 0.055)),
    [],
  )
  const restPitch = MathUtils.degToRad(uae.lat)

  useEffect(() => () => landGeometry.dispose(), [landGeometry])

  useFrame((state, delta) => {
    if (!globe.current) return

    const loop = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.42) * MathUtils.degToRad(2)
    const targetX = restPitch + (reduceMotion ? 0 : pointer.current.y * MathUtils.degToRad(3))
    const targetY = loop + (reduceMotion ? 0 : pointer.current.x * MathUtils.degToRad(3))

    globe.current.rotation.x = MathUtils.damp(globe.current.rotation.x, targetX, 4.5, delta)
    globe.current.rotation.y = MathUtils.damp(globe.current.rotation.y, targetY, 4.5, delta)
  })

  return (
    <group position={[0.18, -1, 0]} ref={globe} rotation={[restPitch, 0, 0]}>
      <mesh>
        <sphereGeometry args={[globeRadius, 72, 72]} />
        <meshStandardMaterial color="#20242d" metalness={0.15} roughness={0.92} />
      </mesh>

      <points geometry={landGeometry}>
        <pointsMaterial size={0.034} sizeAttenuation transparent opacity={0.98} vertexColors />
      </points>

      {routePoints.map((points, index) => (
        <Line
          color="#f8f8f8"
          dashScale={18}
          dashSize={0.42}
          dashed
          gapSize={0.28}
          key={index}
          lineWidth={1.25}
          points={points}
          transparent
          opacity={0.92}
        />
      ))}

      {markerPositions.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[index === 0 ? 0.065 : 0.045, 18, 18]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}

export function HomeGlobeScene() {
  const reduceMotion = Boolean(useReducedMotion())
  const pointer = useRef<PointerTarget>({ x: 0, y: 0 })
  const canRenderWebGL = useSyncExternalStore(
    subscribeToWebGLAvailability,
    getWebGLAvailability,
    () => false,
  )

  const updatePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointer.current.x = MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1)
    pointer.current.y = MathUtils.clamp(-(((event.clientY - bounds.top) / bounds.height) * 2 - 1), -1, 1)
  }

  const resetPointer = () => {
    pointer.current.x = 0
    pointer.current.y = 0
  }

  if (!canRenderWebGL) {
    return (
      <div
        aria-hidden="true"
        className="globe-scene-fallback"
        data-testid="globe-scene-fallback"
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="globe-canvas-shell"
      onPointerLeave={resetPointer}
      onPointerMove={updatePointer}
    >
      <Canvas camera={{ fov: 34, position: [0, 0.15, 5.2] }} dpr={[1, 1.5]}>
        <color attach="background" args={['#2d2d2d']} />
        <ambientLight intensity={1.35} />
        <directionalLight intensity={1.1} position={[2.5, 3.5, 5]} />
        <GlobeContents pointer={pointer} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  )
}
