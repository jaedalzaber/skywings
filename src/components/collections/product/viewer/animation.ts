import { LoopOnce, type AnimationAction, type AnimationClip } from 'three'

const ENDPOINT_EPSILON = 0.001

export function findAnimationClip(clips: AnimationClip[], clipNames: string[]) {
  const matchingClip = clips.find((clip) =>
    clipNames.some((name) => clip.name.toLowerCase().includes(name.toLowerCase())),
  )

  if (matchingClip) return matchingClip

  // Authoring tools often export generic names such as "Plane.016Action".
  // A single clip is unambiguous; multiple unnamed clips are not.
  return clips.length === 1 ? clips[0] : null
}

export function toggleReversibleAnimation(action: AnimationAction, clip: AnimationClip) {
  if (clip.duration <= 0) return 0

  const atStart = action.time <= ENDPOINT_EPSILON
  const atEnd = action.time >= clip.duration - ENDPOINT_EPSILON
  const currentDirection = action.timeScale < 0 ? -1 : 1
  const direction = atStart ? 1 : atEnd ? -1 : currentDirection * -1

  action.setLoop(LoopOnce, 1)
  action.clampWhenFinished = true
  action.enabled = true
  action.paused = false

  if (atStart || atEnd) {
    action.reset()
    action.setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    action.time = direction < 0 ? clip.duration : 0
  }

  action.timeScale = direction
  action.play()

  return direction
}
