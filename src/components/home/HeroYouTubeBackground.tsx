'use client'

import { useState } from 'react'
import { div } from 'three/src/nodes/math/OperatorNode.js'

function youtubeEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    autoplay: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    loop: '1',
    mute: '1',
    playlist: videoId,
    playsinline: '1',
    rel: '0',
  })

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`
}

export function HeroYouTubeBackground(props: { videoId: string }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
        <iframe
      allow="autoplay; encrypted-media"
      aria-hidden="true"
      className="hero-youtube-video absolute top-0 left-0 w-full h-full pointer-events-none scale-105"
      data-loaded={loaded ? 'true' : 'false'}
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
      src={youtubeEmbedUrl(props.videoId)}
      tabIndex={-1}
      title="Sky Wings hero video"
      onLoad={() => setLoaded(true)}
    />
    <div className="absolute inset-0 z-10 bg-transparent block"></div>
    </>

  )
}
