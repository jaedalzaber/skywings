/*
 * Re-measures every ScrollTrigger when the header condenses.
 *
 * The condense is a real layout change above any pinned section: it drops
 * --header-height from 5rem to 3.5rem, the industry cards pin 24px higher and
 * each of the six grows by that much -- ~144px of document height appearing
 * after ScrollTrigger measured. Left alone, every pin below engaged that far
 * early and snapped into place, then snapped again on the way out.
 *
 * Shared by every scroll-driven section rather than owned by one of them: the
 * shift is a page-level fact, and a section that forgets to handle it inherits
 * the snap.
 */
type RefreshableScrollTrigger = { refresh: () => void }

export function watchHeaderCondense(scrollTrigger: RefreshableScrollTrigger): () => void {
  const root = document.documentElement
  let timer = 0

  /*
   * A record arrives for every write, including one that sets the attribute
   * to the value it already had. Refreshing on those is not merely wasted
   * work: a refresh tears a pinned section's pin down and re-applies it, and
   * anything mid-transition inside it -- a button under the pointer, say --
   * is cancelled and starts over. So a write that changed nothing is ignored.
   */
  const observer = new MutationObserver((records) => {
    if (records.every((record) => record.oldValue === root.getAttribute('data-nav-stuck'))) {
      return
    }
    window.clearTimeout(timer)
    timer = window.setTimeout(() => scrollTrigger.refresh(), 60)
  })
  observer.observe(root, { attributeFilter: ['data-nav-stuck'], attributeOldValue: true })

  return () => {
    observer.disconnect()
    window.clearTimeout(timer)
  }
}

/*
 * Runs `start` the first time the viewport satisfies `query`, and never
 * otherwise. The pinned scenes only play on a wide screen without reduced
 * motion, so a phone or a reduced-motion visitor should not download GSAP for
 * a scene that would not run; once started, gsap.matchMedia owns any later
 * change of state. Returns a function that cancels a start still pending.
 */
export function onFirstMediaMatch(query: string, start: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const list = window.matchMedia(query)
  if (list.matches) {
    start()
    return () => {}
  }
  const onChange = (event: MediaQueryListEvent) => {
    if (!event.matches) return
    list.removeEventListener('change', onChange)
    start()
  }
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}
