'use client'

import { useEffect, useState } from 'react'

/**
 * When the form was put in front of the sender, for the server's fill-time
 * check. Set after mount rather than during render, so a cached page cannot
 * carry an old time and a script that never runs the page has none at all.
 *
 * Pass a value that changes after each submission to restart the clock.
 */
export function useStartedAt(restartKey?: unknown) {
  const [startedAt, setStartedAt] = useState('')

  useEffect(() => {
    setStartedAt(String(Date.now()))
  }, [restartKey])

  return startedAt
}
