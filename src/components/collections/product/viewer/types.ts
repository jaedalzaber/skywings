export type ViewerActionId =
  | 'fold-unfold'
  | 'open-close'
  | 'extend-retract'
  | 'exploded-view'
  | 'play-pause'
  | 'reset-view'
  | 'auto-rotate'
  | 'hotspots'

import type { ViewerLightingPreset } from '@/lib/three/lightingPreset'

/**
 * Normalised 3D model config passed from the product data to the viewer.
 * `url` is null when the product has no GLB yet (viewer shows a placeholder).
 */
export type ProductModel = {
  actions: ViewerActionId[]
  camera: [number, number, number]
  lighting: ViewerLightingPreset
  scale: number
  url: string | null
}
