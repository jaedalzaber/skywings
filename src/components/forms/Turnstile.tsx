'use client'

import { useEffect, useRef } from 'react'

type RenderOptions = {
  callback?: (token: string) => void
  'error-callback'?: (code: string) => boolean | void
  'expired-callback'?: () => void
  size?: 'flexible' | 'normal'
  sitekey: string
  theme?: 'auto' | 'dark' | 'light'
}

declare global {
  interface Window {
    turnstile?: {
      remove: (widgetId: string) => void
      render: (container: HTMLElement, options: RenderOptions) => string
      reset: (widgetId: string) => void
    }
  }
}

/** Where the check stands: the form waits for `ready` before sending. */
export type TurnstileStatus =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'expired' }
  | { code: string; kind: 'error' }

export const turnstileEnabled = () => Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<void> | undefined

function loadScript() {
  if (window.turnstile) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = undefined
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Explains a Turnstile error code in terms a person can act on. 110200 is the
 * one met in practice: the widget's hostname list in Cloudflare does not
 * include the address the page is open on -- localhost, or a preview URL.
 */
export function describeTurnstileError(code: string) {
  if (code.startsWith('1102')) {
    return 'Verification is not set up for this site address. Please email us directly instead.'
  }
  if (code === 'script') {
    return 'The verification check could not load. Check your connection or ad blocker, then reload the page.'
  }
  return 'The verification check failed. Please reload the page and try again.'
}

/**
 * Cloudflare Turnstile, the human check for the enquiry form. It renders
 * nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so the form works
 * without it; the server enforces it only once TURNSTILE_SECRET_KEY is set.
 *
 * Turnstile writes its token into a hidden `cf-turnstile-response` input
 * inside the container, so it posts with the form on its own. In invisible
 * mode nothing shows either way, which is why every state is reported
 * through `onStatus`: a failure would otherwise only surface as a refused
 * submission. A token is single use, so remount this (change its key) after
 * each submission.
 */
export function Turnstile(props: {
  onStatus?: (status: TurnstileStatus) => void
  theme?: 'auto' | 'dark' | 'light'
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const container = useRef<HTMLDivElement>(null)
  const onStatus = useRef(props.onStatus)
  onStatus.current = props.onStatus

  useEffect(() => {
    const report = (status: TurnstileStatus) => onStatus.current?.(status)

    if (!siteKey || !container.current) {
      report({ kind: 'disabled' })
      return
    }

    let widgetId: string | undefined
    let cancelled = false
    report({ kind: 'loading' })

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return
        widgetId = window.turnstile.render(container.current, {
          callback: () => report({ kind: 'ready' }),
          'error-callback': (code) => {
            console.error(`[forms] Turnstile error ${code}`)
            report({ code: String(code), kind: 'error' })
            // Handled: stops Turnstile retrying and logging the same failure.
            return true
          },
          'expired-callback': () => {
            report({ kind: 'expired' })
            if (widgetId && window.turnstile) window.turnstile.reset(widgetId)
          },
          sitekey: siteKey,
          size: 'flexible',
          theme: props.theme ?? 'auto',
        })
      })
      .catch((error) => {
        console.error('[forms]', error)
        if (!cancelled) report({ code: 'script', kind: 'error' })
      })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [props.theme, siteKey])

  if (!siteKey) return null

  return <div className="form-turnstile" ref={container} />
}
