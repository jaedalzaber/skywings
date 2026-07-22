import { AnimationClip, AnimationMixer, NumberKeyframeTrack, Object3D } from 'three'
import { describe, expect, it } from 'vitest'

import {
  findAnimationClip,
  toggleReversibleAnimation,
} from '@/components/collections/product/viewer/animation'

function animationFixture() {
  const root = new Object3D()
  const clip = new AnimationClip('Plane.016Action', 1, [
    new NumberKeyframeTrack('.position[x]', [0, 1], [0, 1]),
  ])
  const mixer = new AnimationMixer(root)
  const action = mixer.clipAction(clip)

  return { action, clip, mixer, root }
}

describe('reversible viewer animation', () => {
  it('uses the only clip when an exported name does not describe the action', () => {
    const { clip } = animationFixture()

    expect(findAnimationClip([clip], ['fold', 'unfold'])).toBe(clip)
    expect(findAnimationClip([clip, clip.clone()], ['fold', 'unfold'])).toBeNull()
  })

  it('plays forward on the first click and backward on the second', () => {
    const { action, clip, mixer, root } = animationFixture()

    expect(toggleReversibleAnimation(action, clip)).toBe(1)
    mixer.update(clip.duration)
    expect(root.position.x).toBeCloseTo(1)

    expect(toggleReversibleAnimation(action, clip)).toBe(-1)
    mixer.update(clip.duration)
    expect(root.position.x).toBeCloseTo(0)
  })

  it('reverses from the current frame when clicked during playback', () => {
    const { action, clip, mixer, root } = animationFixture()

    toggleReversibleAnimation(action, clip)
    mixer.update(0.4)
    expect(root.position.x).toBeCloseTo(0.4)

    expect(toggleReversibleAnimation(action, clip)).toBe(-1)
    mixer.update(0.2)
    expect(root.position.x).toBeCloseTo(0.2)
  })
})
