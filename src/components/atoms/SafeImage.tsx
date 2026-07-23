'use client'

import Image, { type ImageProps } from 'next/image'
import type { ImgHTMLAttributes, SourceHTMLAttributes, VideoHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'

type SafeImageProps = ImageProps & {
  fallbackClassName?: string
}

function sizeValue(value: ImageProps['height'] | ImageProps['width']) {
  return typeof value === 'number' ? `${value}px` : value
}

function fallbackStyle(props: Pick<SafeImageProps, 'fill' | 'height' | 'width'>) {
  if (props.fill) {
    return {
      bottom: 0,
      height: '100%',
      left: 0,
      position: 'absolute' as const,
      right: 0,
      top: 0,
      width: '100%',
    }
  }

  return {
    height: sizeValue(props.height),
    width: sizeValue(props.width),
  }
}

export function SafeImage(props: SafeImageProps) {
  const { alt, className, fallbackClassName, fill, onError, ...imageProps } = props
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={['safe-image-fallback', className, fallbackClassName]
          .filter(Boolean)
          .join(' ')}
        style={fallbackStyle(props)}
      />
    )
  }

  return (
    <Image
      {...imageProps}
      alt={alt}
      className={className}
      fill={fill}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}

export function SafeImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { alt = '', className, onError, ...imageProps } = props
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={['safe-image-fallback', className].filter(Boolean).join(' ')}
      />
    )
  }

  return (
    <img
      {...imageProps}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}

export function SafePicture(props: {
  className?: string
  image: ImgHTMLAttributes<HTMLImageElement>
  sources: SourceHTMLAttributes<HTMLSourceElement>[]
}) {
  const { className, image, sources } = props
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={['safe-image-fallback', className].filter(Boolean).join(' ')}
      />
    )
  }

  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source key={`${source.srcSet}-${index}`} {...source} />
      ))}
      <img
        {...image}
        alt={image.alt ?? ''}
        onError={(event) => {
          setFailed(true)
          image.onError?.(event)
        }}
      />
    </picture>
  )
}

export function SafeVideo(
  props: VideoHTMLAttributes<HTMLVideoElement> & {
    sourceType?: string | null
    src: string
  },
) {
  const {
    children,
    className,
    onCanPlay,
    onError,
    onLoadedData,
    onPlaying,
    sourceType,
    src,
    ...videoProps
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  function requestPlayback() {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true
      videoRef.current.muted = true
    }

    if (process.env.NODE_ENV === 'test') {
      return
    }

    const playResult = videoRef.current?.play?.()
    playResult?.catch?.(() => undefined)
  }

  useEffect(() => {
    setReady(false)

    if (!videoProps.autoPlay) {
      return
    }

    requestPlayback()
  }, [src, videoProps.autoPlay])

  if (failed) {
    return null
  }

  return (
    <video
      {...videoProps}
      key={src}
      ref={videoRef}
      className={className}
      data-loaded={ready ? 'true' : 'false'}
      muted
      playsInline={videoProps.playsInline ?? true}
      onCanPlay={(event) => {
        setReady(true)

        if (videoProps.autoPlay) {
          requestPlayback()
        }

        onCanPlay?.(event)
      }}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
      onLoadedData={(event) => {
        setReady(true)
        onLoadedData?.(event)
      }}
      onPlaying={(event) => {
        setReady(true)
        onPlaying?.(event)
      }}
    >
      <source
        key="source"
        src={src}
        type={sourceType ?? undefined}
        onError={() => setFailed(true)}
      />
      {children}
    </video>
  )
}
