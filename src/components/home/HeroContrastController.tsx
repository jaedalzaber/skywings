'use client'

import { useEffect } from 'react'

type RGB = {
  blue: number
  green: number
  red: number
}

type RGBA = RGB & {
  alpha: number
}

type TextTone = 'dark' | 'light'

const SAMPLE_WIDTH = 32
const SAMPLE_HEIGHT = 16

function linearChannel(value: number) {
  const channel = value / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(color: RGB) {
  return (
    0.2126 * linearChannel(color.red) +
    0.7152 * linearChannel(color.green) +
    0.0722 * linearChannel(color.blue)
  )
}

export function textToneForBackground(color: RGB): TextTone {
  const luminance = relativeLuminance(color)
  const whiteContrast = 1.05 / (luminance + 0.05)
  const blackContrast = (luminance + 0.05) / 0.05

  return whiteContrast > blackContrast ? 'light' : 'dark'
}

export function averageColors(colors: RGB[]): RGB {
  const totals = colors.reduce(
    (result, color) => ({
      red: result.red + color.red,
      green: result.green + color.green,
      blue: result.blue + color.blue,
    }),
    { red: 0, green: 0, blue: 0 },
  )

  return {
    red: totals.red / colors.length,
    green: totals.green / colors.length,
    blue: totals.blue / colors.length,
  }
}

function parseColor(value: string): RGBA | null {
  if (value === 'transparent') return null

  const channels = value.match(/[\d.]+/g)?.map(Number)
  if (!channels || channels.length < 3) return null

  return {
    red: channels[0],
    green: channels[1],
    blue: channels[2],
    alpha: channels[3] ?? 1,
  }
}

function composite(foreground: RGBA, background: RGB): RGB {
  return {
    red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha),
    green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
    blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
  }
}

function averagePixels(data: Uint8ClampedArray): RGB | null {
  let red = 0
  let green = 0
  let blue = 0
  let pixels = 0

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue

    red += data[index]
    green += data[index + 1]
    blue += data[index + 2]
    pixels += 1
  }

  if (pixels === 0) return null

  return {
    red: red / pixels,
    green: green / pixels,
    blue: blue / pixels,
  }
}

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

function activeHeroMedia(hero: HTMLElement): HTMLImageElement | HTMLVideoElement | null {
  const video = Array.from(hero.querySelectorAll<HTMLVideoElement>('.hero-cover-video')).find(
    (candidate) =>
      candidate.dataset.loaded === 'true' && candidate.readyState >= 2 && isVisible(candidate),
  )

  if (video) return video

  const image = hero.querySelector<HTMLImageElement>('.hero-image img')
  return image?.complete && image.naturalWidth > 0 ? image : null
}

function mediaDimensions(media: HTMLImageElement | HTMLVideoElement) {
  if (media instanceof HTMLVideoElement) {
    return { height: media.videoHeight, width: media.videoWidth }
  }

  return { height: media.naturalHeight, width: media.naturalWidth }
}

function sampleMediaRegion(
  context: CanvasRenderingContext2D,
  media: HTMLImageElement | HTMLVideoElement,
  region: DOMRect,
): RGB | null {
  const mediaRect = media.getBoundingClientRect()
  const left = Math.max(region.left, mediaRect.left)
  const top = Math.max(region.top, mediaRect.top)
  const right = Math.min(region.right, mediaRect.right)
  const bottom = Math.min(region.bottom, mediaRect.bottom)

  if (right <= left || bottom <= top || mediaRect.width === 0 || mediaRect.height === 0) {
    return null
  }

  const source = mediaDimensions(media)
  if (source.width === 0 || source.height === 0) return null

  const scale = Math.max(mediaRect.width / source.width, mediaRect.height / source.height)
  const offsetX = (mediaRect.width - source.width * scale) / 2
  const offsetY = (mediaRect.height - source.height * scale) / 2
  const sourceX = (left - mediaRect.left - offsetX) / scale
  const sourceY = (top - mediaRect.top - offsetY) / scale
  const sourceWidth = (right - left) / scale
  const sourceHeight = (bottom - top) / scale

  try {
    context.clearRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
    context.drawImage(
      media,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      SAMPLE_WIDTH,
      SAMPLE_HEIGHT,
    )

    return averagePixels(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data)
  } catch {
    // Cross-origin media without canvas permission keeps the previous safe tone.
    return null
  }
}

function visibleBackground(region: HTMLElement, hero: HTMLElement, sampledMedia: RGB | null): RGB {
  let color = sampledMedia ?? parseColor(window.getComputedStyle(hero).backgroundColor) ?? {
    red: 255,
    green: 255,
    blue: 255,
  }
  const layers: HTMLElement[] = []
  let element: HTMLElement | null = region

  while (element && element !== hero) {
    layers.push(element)
    element = element.parentElement
  }

  for (const layer of layers.reverse()) {
    const background = parseColor(window.getComputedStyle(layer).backgroundColor)
    if (background && background.alpha > 0) color = composite(background, color)
  }

  return color
}

function updateHeroContrast(
  hero: HTMLElement,
  context: CanvasRenderingContext2D,
  headingRegion: HTMLElement,
  descriptionRegion: HTMLElement,
) {
  const media = activeHeroMedia(hero)
  const headingMedia = media
    ? sampleMediaRegion(context, media, headingRegion.getBoundingClientRect())
    : null
  const descriptionMedia = media
    ? sampleMediaRegion(context, media, descriptionRegion.getBoundingClientRect())
    : null

  hero.dataset.heroCopyTone = textToneForBackground(
    averageColors([
      visibleBackground(headingRegion, hero, headingMedia),
      visibleBackground(descriptionRegion, hero, descriptionMedia),
    ]),
  )
}

export function HeroContrastController() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return

    const hero = document.querySelector<HTMLElement>("[data-responsive-layout='hero']")
    const headingRegion = hero?.querySelector<HTMLElement>('.hero-copy')
    const descriptionRegion = hero?.querySelector<HTMLElement>('.hero-summary')
    if (!hero || !headingRegion || !descriptionRegion) return

    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_WIDTH
    canvas.height = SAMPLE_HEIGHT
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    const update = () => updateHeroContrast(hero, context, headingRegion, descriptionRegion)
    const mediaElements = Array.from(
      hero.querySelectorAll<HTMLImageElement | HTMLVideoElement>('.hero-image img, .hero-cover-video'),
    )
    const observer = new MutationObserver(update)
    observer.observe(hero, {
      attributeFilter: ['data-loaded', 'src', 'srcset'],
      attributes: true,
      subtree: true,
    })

    mediaElements.forEach((media) => {
      media.addEventListener('load', update)
      media.addEventListener('loadeddata', update)
    })
    window.addEventListener('resize', update)

    const animationFrame = window.requestAnimationFrame(update)
    const interval = window.setInterval(() => {
      if (!document.hidden && activeHeroMedia(hero) instanceof HTMLVideoElement) update()
    }, 500)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearInterval(interval)
      window.removeEventListener('resize', update)
      observer.disconnect()
      mediaElements.forEach((media) => {
        media.removeEventListener('load', update)
        media.removeEventListener('loadeddata', update)
      })
    }
  }, [])

  return null
}
