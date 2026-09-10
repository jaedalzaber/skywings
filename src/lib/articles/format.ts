const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  // Fixed, so the server and the browser print the same day.
  timeZone: 'UTC',
  year: 'numeric',
})

/** "Sep 8, 2026", or null for an article saved without a date. */
export function formatArticleDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date)
}

export function readingTimeLabel(minutes: number) {
  return `${minutes} min read`
}
