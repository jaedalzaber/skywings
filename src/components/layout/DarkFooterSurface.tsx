'use client'

import { useEffect } from 'react'

/**
 * Tells the header that the footer is dark on this page.
 *
 * The footer is shared by every page and marks itself `data-nav-surface=
 * "white"`, which is right for its usual white ground. A page that turns the
 * footer dark (`data-page-tone="dark"`, styled in styles.css) mounts this, so
 * the bar stays dark over it too instead of flashing white at the foot of the
 * page. The mark goes back when the page is left.
 */
export function DarkFooterSurface() {
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('.site-footer')
    if (!footer) return

    const previous = footer.dataset.navSurface
    footer.dataset.navSurface = 'dark'

    return () => {
      if (previous === undefined) delete footer.dataset.navSurface
      else footer.dataset.navSurface = previous
    }
  }, [])

  return null
}
