import type { IndustryHeroBlock } from '@/payload-types'

import { getMediaFile, getMediaImage, isMediaVideo } from '@/data/media'

import { HeroMedia } from './HeroMedia'
import { HeroMotion } from './HeroMotion'
import { MultilineText } from './shared'

/**
 * Full-bleed media hero. Sits under the transparent site header (negative
 * top margin) and is capped below the viewport height so the intro section
 * always peeks in beneath it.
 *
 * The headline is not the page `<h1>`: on every industry page it is the
 * company tagline, and the industry name lives in the intro block that
 * follows. Its words are wrapped in overflow masks so the entrance animation
 * can raise them line by line.
 */
export function IndustryHeroSection(props: { block: IndustryHeroBlock; priority?: boolean }) {
  const { block, priority } = props

  const poster = getMediaImage(block.poster)
  const video = isMediaVideo(block.video) ? getMediaFile(block.video) : null
  const mobileVideo = isMediaVideo(block.mobileVideo) ? getMediaFile(block.mobileVideo) : null
  const stats = (block.stats ?? []).filter((stat) => stat.value?.trim() && stat.label?.trim())
  const headline = block.headline?.trim()
  const supporting = block.supportingStatement?.trim()
  const showOverlay = block.showOverlay !== false && Boolean(headline || supporting)
  const ratio = block.aspectRatio ?? '16-9'

  const className = [
    'industry-section',
    'industry-hero',
    `is-${block.theme ?? 'dark'}`,
    `industry-hero--${ratio}`,
  ].join(' ')

  return (
    <HeroMotion
      className={className}
      id={block.anchorId || undefined}
      overlayAlign={block.overlayAlignment ?? 'left'}
    >
      <div className="industry-hero-canvas">
        {poster ? (
          <HeroMedia
            mediaDescription={block.mediaDescription}
            mobileVideoUrl={mobileVideo?.url}
            posterAlt={poster.alt}
            posterUrl={poster.url}
            priority={priority}
            videoType={video?.mimeType}
            videoUrl={video?.url}
          />
        ) : (
          <div
            aria-label={block.mediaDescription}
            className="industry-hero-media is-empty"
            role="img"
          />
        )}
        <div aria-hidden="true" className="industry-hero-scrim" />
        <div aria-hidden="true" className="industry-hero-shade" />
      </div>

      {showOverlay || stats.length > 0 ? (
        <div className="industry-hero-foot">
          {showOverlay ? (
            <div
              className="industry-hero-panel"
              data-text-align={block.overlayTextAlignment ?? 'left'}
            >
              {headline ? <MaskedHeadline value={headline} /> : null}
              {supporting ? (
                <MultilineText className="industry-hero-supporting" value={supporting} />
              ) : null}
            </div>
          ) : null}

          {stats.length > 0 ? (
            <dl className="industry-hero-stats">
              {stats.map((stat) => {
                const parsed = parseStat(stat.value)

                return (
                  <div
                    className="industry-hero-stat"
                    key={stat.id ?? `${stat.value}-${stat.label}`}
                  >
                    <dd
                      data-count={parsed?.number}
                      data-prefix={parsed?.prefix}
                      data-suffix={parsed?.suffix}
                    >
                      {stat.value}
                    </dd>
                    <dt>{stat.label}</dt>
                  </div>
                )
              })}
            </dl>
          ) : null}
        </div>
      ) : null}
    </HeroMotion>
  )
}

/**
 * Each authored line becomes one visual row; each word sits inside an
 * overflow-hidden mask so it can rise into view. Lines are kept whole on
 * wide screens (see CSS) so the tagline never exceeds the two rows the
 * design allows.
 */
function MaskedHeadline(props: { value: string }) {
  const lines = props.value.split('\n').filter((line) => line.trim().length > 0)

  return (
    <p className="industry-hero-headline">
      {lines.map((line, lineIndex) => (
        <span className="industry-hero-line" key={`${line}-${lineIndex}`}>
          {line.split(/\s+/).map((word, wordIndex) => (
            <span className="industry-hero-word-mask" key={`${word}-${wordIndex}`}>
              <span className="industry-hero-word">{word}</span>
            </span>
          ))}
        </span>
      ))}
    </p>
  )
}

/** "60+" → { prefix: "", number: 60, suffix: "+" }; non-numeric values return null. */
function parseStat(value: string): null | { number: number; prefix: string; suffix: string } {
  const match = value.trim().match(/^([^\d]*)(\d[\d,]*)(.*)$/)

  if (!match) return null

  const number = Number(match[2].replace(/,/g, ''))

  return Number.isFinite(number) ? { number, prefix: match[1], suffix: match[3] } : null
}
