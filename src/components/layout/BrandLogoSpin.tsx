'use client'

import { useEffect } from 'react'

import type { BrandLogoMotion } from '@/data/site'

/**
 * Turns the mark in the navigation bar: one full rotation, eased in and out,
 * then a rest, then again. The timings are editorial -- Site Settings ->
 * Navigation logo animation -- and reach here through the header data.
 *
 * It drives whichever marks are in the bar, so the full lockup and the
 * compact symbol both turn: they are the same element with a different mask,
 * swapped by the stylesheet when the bar tightens on scroll.
 *
 * Written against the element rather than as a CSS keyframe animation for two
 * reasons: the rest between turns would otherwise have to be baked into the
 * keyframe percentages, which cannot be set from a variable, and the reveal
 * that sets the bar down on load animates the same transform -- a running CSS
 * animation would fight it, while this waits for it to finish.
 */

/** Enough for the entrance reveal to have set the bar down first. */
const FIRST_TURN_DELAY = 1200

/**
 * Slow at either end, quick through the middle, by however much the setting
 * asks for: the curve's two handles are pulled in from the ends by the same
 * amount, so 0 is a steady turn and 1 creeps in and settles out.
 */
function turnEasing(amount: number) {
  const pull = Math.min(1, Math.max(0, amount))

  return `cubic-bezier(${pull.toFixed(2)}, 0, ${(1 - pull).toFixed(2)}, 1)`
}

/** How many steps the turn is cut into; enough that the curve reads smooth. */
const TURN_STEPS = 24

/*
 * The light the turn is lit by, as [position, opacity]: two soft-edged
 * streaks with clear surface between them. Only the streaks are painted --
 * everything else leaves the mark its own colour -- so what crosses a white
 * mark is a band of grey, and what crosses a dark one is a band of light.
 *
 * Two streaks and not one because only a quarter of this is over the mark at
 * a time (see SHEEN_WIDTH): one would cross the mark once in a whole turn and
 * leave the other half of it unlit.
 */
const SHEEN_STOPS = [
  [0, 0],
  [14, 0],
  [22, 0.45],
  [30, 0.62],
  [38, 0.45],
  [46, 0],
  [54, 0],
  [62, 0.45],
  [70, 0.62],
  [78, 0.45],
  [86, 0],
  [100, 0],
]

/** How much of the light is over the mark at once: a quarter of its length. */
const SHEEN_WIDTH = '400% 100%'

/** Over the first and last of the turn the light fades up and back out. */
const SHEEN_FADE = 0.15

/**
 * The light at a given strength, in the tone that shows against the mark. At
 * nothing it is completely clear, which is what the mark looks like at rest
 * -- so the turn can begin and end on it and the light arrives and leaves
 * rather than switching on and off.
 */
function sheen(strength: number, tone: number) {
  const stops = SHEEN_STOPS.map(
    ([at, alpha]) => `rgba(${tone}, ${tone}, ${tone}, ${(alpha * strength).toFixed(3)}) ${at}%`,
  )

  return `linear-gradient(100deg, ${stops.join(', ')})`
}

/**
 * Which tone the streak is painted in: dark over a pale mark, pale over a
 * dark one. A white streak on the white lockup over the footage is no streak
 * at all -- there is nothing brighter than the mark already is -- so it is
 * read from the mark's own fill rather than fixed, and the bar's two states
 * (white over the hero, near-black on a white bar) each get the one that
 * shows. A mark whose fill cannot be read is taken to be pale, which is what
 * it is wherever the turn is most often seen.
 */
function streakTone(mark: HTMLElement) {
  const [red, green, blue] = (getComputedStyle(mark).backgroundColor.match(/\d+/g) ?? []).map(
    Number,
  )

  if ([red, green, blue].some((channel) => !Number.isFinite(channel))) return 0

  // Rec. 601 luma: green carries most of what the eye reads as brightness.
  return (red * 0.299 + green * 0.587 + blue * 0.114) / 255 > 0.5 ? 0 : 255
}

/**
 * The turn, as keyframes that hold the mark's apparent size steady and light
 * it as it goes.
 *
 * Under perspective the half of the mark swinging towards the viewer is drawn
 * larger, so the whole silhouette swells mid-turn and settles back -- which
 * reads as the logo shifting up and down rather than turning in place. Each
 * step therefore carries a scale that holds it at the size it rests at: the
 * near edge stands at most half the mark's width in front of the rest of it,
 * and how much perspective makes of that is a matter of the depth it is seen
 * at.
 *
 * With no perspective to speak of (a very deep setting, or a browser that
 * reports none) the correction falls out to 1 and this is a plain rotation.
 *
 * A flat silhouette has no shape to catch the light, so a rotation on its own
 * reads as the mark being squashed sideways and let go. Two things stand in
 * for the modelling it hasn't got: the surface dims as it turns away from the
 * viewer, and dims further on its back; and a streak of light travels across
 * it over the course of the turn, one crossing as the mark swings away and
 * another as it comes back round. The streak is painted as a background, so
 * the mask the mark is cut by carries it too and it is only ever laid on the
 * lettering, in whichever tone shows against it. A mark shown as a plain
 * picture instead is dimmed but not lit: there the gradient would show around
 * the artwork rather than on it.
 */
function turnFrames(args: { depth: number; masked: boolean; tone: number; width: number }) {
  const { depth, masked, tone, width } = args
  const reach = width / 2

  return Array.from({ length: TURN_STEPS + 1 }, (_, step) => {
    const angle = (360 / TURN_STEPS) * step
    const radians = (angle * Math.PI) / 180
    const near = reach * Math.abs(Math.sin(radians))
    /*
     * Solved rather than inverted: the scale is applied before the rotation,
     * so it draws the near edge in as well, and perspective then magnifies
     * the closer edge it has left. Cancelling the swell of the full-size edge
     * instead overshoots -- by a pixel of height at a shallow depth, which is
     * the wobble this is here to be rid of. Wanted is the s where the edge at
     * s * near is magnified back to exactly 1.
     */
    const hold = depth > 0 ? depth / (depth + near) : 1

    // Square on to the viewer it is fully lit; edge on there is next to
    // nothing facing the light, and its back catches less than its face.
    const facing = Math.cos(radians)
    const shade = (0.55 + 0.45 * Math.abs(facing)) * (facing < 0 ? 0.85 : 1)

    /*
     * The light runs the length of itself once over the turn, so a band
     * crosses the mark as it swings away and the other as it comes back --
     * evenly, with nothing to jump over, since the whole thing is clear at
     * both ends of the turn.
     */
    const progress = step / TURN_STEPS
    const strength = Math.min(1, Math.min(progress, 1 - progress) / SHEEN_FADE)

    return {
      opacity: shade.toFixed(3),
      transform: `rotateY(${-angle}deg) scale(${hold.toFixed(4)})`,
      ...(masked
        ? {
            backgroundImage: sheen(strength, tone),
            // The themes set background as a shorthand, which resets each of
            // these, so the turn has to restate them.
            backgroundPosition: `${(100 - progress * 100).toFixed(1)}% 50%`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: SHEEN_WIDTH,
          }
        : {}),
    }
  })
}

/** The depth CSS is working with, in pixels; 0 when there is none. */
function perspectiveOf(mark: HTMLElement) {
  const parent = mark.parentElement
  const depth = parent ? Number.parseFloat(getComputedStyle(parent).perspective) : Number.NaN

  return Number.isFinite(depth) ? depth : 0
}

export function BrandLogoSpin({ motion }: { motion: BrandLogoMotion }) {
  const { durationMs, easeAmount, enabled, restMs } = motion

  useEffect(() => {
    if (!enabled) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduced?.matches) return

    const marks = Array.from(
      document.querySelectorAll<HTMLElement>('.nav-container .brand-logo'),
    ).filter((mark) => typeof mark.animate === 'function')
    if (!marks.length) return

    let timer = window.setTimeout(turn, FIRST_TURN_DELAY)

    function turn() {
      // A hidden tab throws no frames: skip the turn rather than queue it up.
      if (document.visibilityState === 'visible') {
        for (const mark of marks) {
          // Anticlockwise seen from above: the near edge sweeps towards the
          // start of the bar. Measured per turn, since the bar condenses on
          // scroll and the mark is narrower once it does.
          mark.animate(
            turnFrames({
              depth: perspectiveOf(mark),
              masked: !mark.querySelector('.safe-image-fallback'),
              tone: streakTone(mark),
              width: mark.offsetWidth,
            }),
            {
              duration: durationMs,
              easing: turnEasing(easeAmount),
            },
          )
        }
      }

      timer = window.setTimeout(turn, durationMs + restMs)
    }

    return () => window.clearTimeout(timer)
  }, [durationMs, easeAmount, enabled, restMs])

  return null
}
