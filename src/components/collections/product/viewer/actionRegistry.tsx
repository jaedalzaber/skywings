import type { ReactNode, SVGProps } from 'react'

import type { ViewerActionId } from './types'

/**
 * The handle the toolbar hands to each action's `run`/`isActive`. Only methods
 * and reactive state are exposed — the viewer's handlers reach the live scene
 * (model, mixer, camera) through refs at call time. Clip-based actions look up a
 * GLB animation clip by name, so a new behaviour ships by authoring the clip +
 * enabling the action, never by editing the viewer component.
 */
export type ViewerApi = {
  autoRotate: boolean
  hotspotsVisible: boolean
  playPause: () => void
  reset: () => void
  setAutoRotate: (updater: boolean | ((prev: boolean) => boolean)) => void
  setHotspotsVisible: (updater: boolean | ((prev: boolean) => boolean)) => void
  toggleReversibleClip: (clipNames: string[]) => void
}

// Plain reactive state read during render (safe — no refs) to light up toggles.
export type ViewerActionState = { autoRotate: boolean; hotspotsVisible: boolean }

export type ViewerAction = {
  icon: ReactNode
  id: ViewerActionId
  isActive?: (state: ViewerActionState) => boolean
  label: string
  run: (api: ViewerApi) => void
}

const iconBase: SVGProps<SVGSVGElement> = {
  'aria-hidden': true,
  fill: 'none',
  focusable: false,
  height: 20,
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
  width: 20,
  xmlns: 'http://www.w3.org/2000/svg',
}

const Icon = (props: { children: ReactNode }) => <svg {...iconBase}>{props.children}</svg>

/**
 * Every supported action, keyed by id. `ACTION_ORDER` fixes toolbar order.
 * Add a new action = add an entry here + its collection option; the viewer
 * component itself never changes.
 */
export const ACTION_REGISTRY: Record<ViewerActionId, ViewerAction> = {
  'fold-unfold': {
    icon: (
      <Icon>
        <path d="M12 3v18M4 8l8-5 8 5M4 16l8 5 8-5" />
      </Icon>
    ),
    id: 'fold-unfold',
    label: 'Fold / Unfold',
    run: (api) => api.toggleReversibleClip(['fold', 'unfold']),
  },
  'open-close': {
    icon: (
      <Icon>
        <path d="M3 21V5a2 2 0 0 1 2-2h9l4 4v14M3 21h18M9 21v-6h6v6" />
      </Icon>
    ),
    id: 'open-close',
    label: 'Open / Close',
    run: (api) => api.toggleReversibleClip(['open', 'close']),
  },
  'extend-retract': {
    icon: (
      <Icon>
        <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" />
      </Icon>
    ),
    id: 'extend-retract',
    label: 'Extend / Retract',
    run: (api) => api.toggleReversibleClip(['extend', 'retract']),
  },
  'exploded-view': {
    icon: (
      <Icon>
        <path d="M12 2v5M12 17v5M2 12h5M17 12h5M6 6l3 3M18 6l-3 3M6 18l3-3M18 18l-3-3" />
      </Icon>
    ),
    id: 'exploded-view',
    label: 'Exploded View',
    run: (api) => api.toggleReversibleClip(['explode', 'exploded']),
  },
  'play-pause': {
    icon: (
      <Icon>
        <path d="M8 5v14l11-7z" />
      </Icon>
    ),
    id: 'play-pause',
    label: 'Play / Pause',
    run: (api) => api.playPause(),
  },
  'reset-view': {
    icon: (
      <Icon>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
      </Icon>
    ),
    id: 'reset-view',
    label: 'Reset View',
    run: (api) => api.reset(),
  },
  'auto-rotate': {
    icon: (
      <Icon>
        <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v4h-4" />
      </Icon>
    ),
    id: 'auto-rotate',
    isActive: (state) => state.autoRotate,
    label: 'Auto Rotate',
    run: (api) => api.setAutoRotate((value) => !value),
  },
  hotspots: {
    icon: (
      <Icon>
        <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </Icon>
    ),
    id: 'hotspots',
    isActive: (state) => state.hotspotsVisible,
    label: 'Hotspots',
    run: (api) => api.setHotspotsVisible((value) => !value),
  },
}

export const ACTION_ORDER: ViewerActionId[] = [
  'play-pause',
  'fold-unfold',
  'open-close',
  'extend-retract',
  'exploded-view',
  'hotspots',
  'auto-rotate',
  'reset-view',
]
