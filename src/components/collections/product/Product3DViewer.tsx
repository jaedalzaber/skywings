'use client'

import { CameraControls, Center, Loader, RoundedBox, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { motion, useReducedMotion } from 'motion/react'
import {
  type MutableRefObject,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type CameraControlsImpl from 'camera-controls'
import { AnimationMixer } from 'three'
import type { AnimationClip, Group, Mesh, Object3D } from 'three'

import { CloseIcon } from '@/components/atoms/icons'
import { LightingRig } from '@/components/three/LightingRig'

import { ACTION_ORDER, ACTION_REGISTRY, type ViewerApi } from './viewer/actionRegistry'
import { findAnimationClip, toggleReversibleAnimation } from './viewer/animation'
import type { ProductModel } from './viewer/types'

type SceneHandle = { clips: AnimationClip[]; mixer: AnimationMixer | null; root: Object3D | null }

type WindowWithLenis = Window & {
  __skywingsLenis?: {
    start?: () => void
    stop?: () => void
  }
}

function GltfModel(props: {
  onReady: (handle: SceneHandle) => void
  scale: number
  shadows: boolean
  url: string
}) {
  const { onReady, scale, shadows, url } = props
  const { animations, scene } = useGLTF(url)

  useEffect(() => {
    scene.traverse((object) => {
      const mesh = object as Mesh
      if (mesh.isMesh) {
        mesh.castShadow = shadows
        mesh.receiveShadow = shadows
      }
    })

    const mixer = animations.length ? new AnimationMixer(scene) : null
    onReady({ clips: animations, mixer, root: scene })
    return () => {
      mixer?.stopAllAction()
    }
  }, [animations, onReady, scene, shadows])

  return <primitive object={scene} scale={scale} />
}

function PlaceholderCube(props: { onReady: (handle: SceneHandle) => void; shadows: boolean }) {
  const { onReady, shadows } = props
  const ref = useRef<Group>(null)

  useEffect(() => {
    onReady({ clips: [], mixer: null, root: ref.current })
  }, [onReady])

  return (
    <group ref={ref}>
      <RoundedBox
        args={[2.2, 2.2, 2.2]}
        castShadow={shadows}
        radius={0.14}
        receiveShadow={shadows}
        smoothness={6}
      >
        <meshStandardMaterial color="#c9d0d8" metalness={0.35} roughness={0.4} />
      </RoundedBox>
    </group>
  )
}

function Stage(props: {
  autoRotateRef: MutableRefObject<boolean>
  cameraControlsRef: MutableRefObject<CameraControlsImpl | null>
  model: ProductModel
  sceneRef: MutableRefObject<SceneHandle | null>
}) {
  const { autoRotateRef, cameraControlsRef, model, sceneRef } = props
  const groupRef = useRef<Group>(null)
  const [cx, cy, cz] = model.camera

  const handleReady = useCallback(
    (handle: SceneHandle) => {
      sceneRef.current = handle
    },
    [sceneRef],
  )

  useFrame((_, delta) => {
    if (autoRotateRef.current && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
    sceneRef.current?.mixer?.update(delta)
  })

  useEffect(() => {
    cameraControlsRef.current?.setLookAt(cx, cy, cz, 0, 0, 0, false)
  }, [cameraControlsRef, cx, cy, cz])

  return (
    <>
      <LightingRig preset={model.lighting} />
      <group ref={groupRef}>
        <Suspense fallback={null}>
          {model.url ? (
            <Center>
              <GltfModel
                onReady={handleReady}
                scale={model.scale}
                shadows={model.lighting.renderer.shadows}
                url={model.url}
              />
            </Center>
          ) : (
            <PlaceholderCube onReady={handleReady} shadows={model.lighting.renderer.shadows} />
          )}
        </Suspense>
      </group>
      <CameraControls maxDistance={20} minDistance={1.5} ref={cameraControlsRef} />
    </>
  )
}

export function Product3DViewer(props: {
  model: ProductModel
  onClose: () => void
  title: string
}) {
  const { model, onClose, title } = props
  const reduceMotion = useReducedMotion()

  const sceneRef = useRef<SceneHandle | null>(null)
  const cameraControlsRef = useRef<CameraControlsImpl | null>(null)
  const currentClipRef = useRef<AnimationClip | null>(null)
  const autoRotateRef = useRef(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  const [autoRotate, setAutoRotate] = useState(false)
  const [hotspotsVisible, setHotspotsVisible] = useState(false)

  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  const reset = useCallback(() => {
    cameraControlsRef.current?.setLookAt(
      model.camera[0],
      model.camera[1],
      model.camera[2],
      0,
      0,
      0,
      true,
    )
  }, [model.camera])

  const toggleReversibleClip = useCallback((clipNames: string[]) => {
    const scene = sceneRef.current
    if (!scene?.mixer || !scene.clips.length) return
    const clip = findAnimationClip(scene.clips, clipNames)
    if (!clip) return

    currentClipRef.current = clip
    const action = scene.mixer.clipAction(clip)
    toggleReversibleAnimation(action, clip)
  }, [])

  const playPause = useCallback(() => {
    const scene = sceneRef.current
    if (!scene?.mixer || !scene.clips.length) return
    const clip = currentClipRef.current ?? scene.clips[0]
    currentClipRef.current = clip
    const action = scene.mixer.clipAction(clip)
    if (action.isRunning()) {
      action.paused = !action.paused
    } else {
      action.paused = false
      action.play()
    }
  }, [])

  const api: ViewerApi = useMemo(
    () => ({
      autoRotate,
      hotspotsVisible,
      playPause,
      reset,
      setAutoRotate,
      setHotspotsVisible,
      toggleReversibleClip,
    }),
    [autoRotate, hotspotsVisible, playPause, reset, toggleReversibleClip],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const scrollY = window.scrollY
    const lenis = (window as WindowWithLenis).__skywingsLenis
    const previousBody = {
      left: document.body.style.left,
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      right: document.body.style.right,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    const previousHtmlOverflow = document.documentElement.style.overflow

    lenis?.stop?.()
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.documentElement.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.position = previousBody.position
      document.body.style.top = previousBody.top
      document.body.style.left = previousBody.left
      document.body.style.right = previousBody.right
      document.body.style.width = previousBody.width
      document.body.style.overflow = previousBody.overflow
      document.documentElement.style.overflow = previousHtmlOverflow
      window.scrollTo(0, scrollY)
      lenis?.start?.()
    }
  }, [onClose])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const lockPageScroll = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }

    viewer.addEventListener('wheel', lockPageScroll, { passive: false })
    viewer.addEventListener('touchmove', lockPageScroll, { passive: false })

    return () => {
      viewer.removeEventListener('wheel', lockPageScroll)
      viewer.removeEventListener('touchmove', lockPageScroll)
    }
  }, [])

  // r3f can mis-measure the canvas when it mounts inside the animating modal,
  // leaving a 300x150 buffer. Nudge react-three-fiber's resize listener a few
  // times so one fires after it attaches, sizing the renderer to the stage.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event('resize'))
    const timers = [60, 180, 360, 600].map((ms) => window.setTimeout(fire, ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  const enabled = ACTION_ORDER.filter((id) => model.actions.includes(id))

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-label={`${title} 3D viewer`}
      aria-modal="true"
      className="pdp-viewer"
      initial={reduceMotion ? false : { opacity: 0 }}
      ref={viewerRef}
      role="dialog"
      transition={{ duration: 0.25 }}
    >
      <button
        aria-label="Close 3D viewer"
        className="pdp-viewer-backdrop"
        onClick={onClose}
        type="button"
      />
      <div className="pdp-viewer-panel">
        <header className="pdp-viewer-header">
          <span className="pdp-viewer-title">{title}</span>
          <button
            aria-label="Close 3D viewer"
            className="pdp-viewer-close"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="pdp-viewer-stage">
          <Canvas
            camera={{ fov: 40, position: model.camera }}
            dpr={[1, 1.8]}
            gl={{ alpha: true, antialias: true }}
            shadows={
              model.lighting.renderer.shadows ? model.lighting.renderer.shadowMapType : false
            }
          >
            <Stage
              autoRotateRef={autoRotateRef}
              cameraControlsRef={cameraControlsRef}
              model={model}
              sceneRef={sceneRef}
            />
          </Canvas>
          <Loader
            containerStyles={{ background: 'transparent', position: 'absolute' }}
            innerStyles={{ background: 'rgba(255,255,255,0.2)' }}
          />
        </div>

        {enabled.length ? (
          <div aria-label="Model controls" className="pdp-viewer-toolbar" role="toolbar">
            {enabled.map((id) => {
              const action = ACTION_REGISTRY[id]
              const active = action.isActive?.({ autoRotate, hotspotsVisible }) ?? false
              return (
                <button
                  aria-pressed={action.isActive ? active : undefined}
                  className="pdp-viewer-tool"
                  data-active={active ? '' : undefined}
                  key={id}
                  onClick={() => action.run(api)}
                  title={action.label}
                  type="button"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
