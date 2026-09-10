/**
 * Product search for the catalogue.
 *
 * Seventy-five products is small enough to search entirely in the browser,
 * which is what keeps the field instant -- but a plain substring test over one
 * run-together string, which is what this replaces, only found a product if
 * the visitor typed a fragment of it exactly as written. So:
 *
 * - Every word of the query has to match somewhere, in any order: "cart
 *   baggage open" finds "Open Baggage Cart".
 * - Model numbers match however they are typed. "GSE-FS-038", "gse fs 038",
 *   "FS038" and "fs-038" are the same code, because codes are compared with
 *   their punctuation and spacing stripped out.
 * - Plurals and small typos are forgiven -- "trolly", "pallett", "ladders" --
 *   but never inside a model number, where one digit is a different product.
 * - A handful of trade spellings and shorthands are interchangeable:
 *   aluminium / aluminum, GSE / ground support equipment, and so on.
 * - Results are ranked. An exact model number beats a name, a name beats a
 *   family, a family beats a passing mention in the summary.
 *
 * No dependency and no request: the index is built once from the products the
 * page already holds.
 */

/** What a product offers to the search, as raw text. */
export type SearchFields = {
  /** The model number / SKU, e.g. "GSE-FS-038". */
  code: string | null
  /** Industries, capabilities, applications, and the editor's own labels. */
  context: string
  family: string
  summary: string
  title: string
}

type FieldName = 'code' | 'context' | 'family' | 'summary' | 'title'

/*
 * How much a match in each place is worth. A visitor who types a name or a
 * code means that product; one whose words only turn up in the summary is
 * probably browsing.
 */
const FIELD_WEIGHT: Record<FieldName, number> = {
  code: 9,
  context: 3,
  family: 5,
  summary: 2,
  title: 10,
}

/** Words that carry no meaning on their own, dropped from a query. */
const STOPWORDS = new Set(['a', 'an', 'and', 'by', 'for', 'in', 'of', 'on', 'the', 'to', 'with'])

/*
 * Interchangeable terms. British and American spellings both turn up in a
 * UAE catalogue, and the trade shorthands are how buyers actually ask. A
 * variant with a space in it is matched as a phrase.
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['aluminium', 'aluminum'],
  ['galvanised', 'galvanized'],
  ['colour', 'color'],
  ['stainless', 'ss'],
  ['gse', 'ground support equipment'],
  ['uld', 'unit load device'],
  ['cart', 'trolley'],
]

const SYNONYMS = new Map<string, string[]>()
for (const group of SYNONYM_GROUPS) {
  for (const term of group) {
    SYNONYMS.set(
      term,
      group.filter((other) => other !== term),
    )
  }
}

/** Lowercase, accents off, "&" read as "and", everything else a word break. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** A code with its punctuation and spacing gone: "GSE-FS-038" -> "gsefs038". */
export function compactCode(text: string): string {
  return normalizeText(text).replace(/ /g, '')
}

/** Just enough stemming to make a plural find its singular. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && /(ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

const hasDigit = (word: string) => /\d/.test(word)

/**
 * Edit distance with adjacent swaps counted as one edit ("trolely" is one
 * slip from "trolley", not two). Gives up as soon as it cannot come in under
 * `limit`, which keeps a pass over the whole catalogue cheap.
 */
export function editDistance(a: string, b: string, limit = 2): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1

  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, j) => j)]

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i]
    let best = row[0]

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, rows[i - 2][j - 2] + 1)
      }
      row.push(value)
      best = Math.min(best, value)
    }

    if (best > limit) return limit + 1
    rows.push(row)
  }

  return rows[a.length][b.length]
}

/*
 * How many slips a word of this length may carry. Short words get none:
 * "cart" one letter off is "card", "care", "part" -- different words, not
 * typos -- so nothing under five letters gets one. Nor does anything with a
 * digit in it, because a model number one character off is another product.
 */
function allowedSlips(word: string): number {
  if (hasDigit(word) || word.length < 5) return 0
  return word.length >= 8 ? 2 : 1
}

type FieldIndex = { stems: Set<string>; text: string; words: string[] }

export type SearchIndex<T> = {
  entries: { code: string; fields: Record<FieldName, FieldIndex>; item: T; order: number }[]
  /** Every word in the catalogue, for suggesting a correction. */
  vocabulary: Map<string, number>
}

function indexField(raw: string | null): FieldIndex {
  const text = normalizeText(raw ?? '')
  const words = text ? text.split(' ') : []

  return { stems: new Set(words.map(stem)), text, words }
}

/** Built once per page from the products it already holds. */
export function buildSearchIndex<T>(items: T[], fieldsOf: (item: T) => SearchFields): SearchIndex<T> {
  const vocabulary = new Map<string, number>()

  const entries = items.map((item, order) => {
    const raw = fieldsOf(item)
    const fields = {
      code: indexField(raw.code),
      context: indexField(raw.context),
      family: indexField(raw.family),
      summary: indexField(raw.summary),
      title: indexField(raw.title),
    }

    for (const name of ['title', 'family', 'context', 'summary'] as const) {
      for (const word of fields[name].words) {
        if (word.length >= 3 && !hasDigit(word)) vocabulary.set(word, (vocabulary.get(word) ?? 0) + 1)
      }
    }

    return { code: raw.code ? compactCode(raw.code) : '', fields, item, order }
  })

  return { entries, vocabulary }
}

/** How well one variant of a query word matches one field, 0 to 1. */
function matchQuality(variant: string, field: FieldIndex): number {
  if (!field.text) return 0

  // A phrase variant, from a shorthand like "gse".
  if (variant.includes(' ')) {
    return ` ${field.text} `.includes(` ${variant} `) ? 0.9 : 0
  }

  if (field.words.includes(variant)) return 1
  if (field.stems.has(stem(variant))) return 0.95
  if (variant.length >= 2 && field.words.some((word) => word.startsWith(variant))) return 0.8
  if (variant.length >= 3 && field.text.includes(variant)) return 0.5

  const slips = allowedSlips(variant)
  if (slips > 0) {
    let closest = slips + 1
    for (const word of field.words) {
      if (hasDigit(word)) continue
      closest = Math.min(closest, editDistance(variant, word, slips))
      if (closest === 1) break
    }
    // Only a distance within the allowance counts. editDistance reports
    // "gave up" as limit + 1, which for a limit of 1 is 2 -- reading that as
    // a two-slip match is what once let every word match every product.
    if (closest <= slips) return closest === 1 ? 0.6 : 0.45
  }

  return 0
}

/** The best a single query word does anywhere in one product. */
function scoreWord(word: string, entry: SearchIndex<unknown>['entries'][number]): number {
  const variants = [
    { quality: 1, text: word },
    ...(SYNONYMS.get(word) ?? []).map((text) => ({ quality: 0.85, text })),
  ]

  let best = 0

  for (const variant of variants) {
    for (const name of Object.keys(FIELD_WEIGHT) as FieldName[]) {
      const score = FIELD_WEIGHT[name] * matchQuality(variant.text, entry.fields[name]) * variant.quality
      if (score > best) best = score
    }
  }

  // A fragment of a model number, however it was punctuated: "fs038".
  if (entry.code && word.length >= 2 && entry.code.includes(compactCode(word))) {
    best = Math.max(best, FIELD_WEIGHT.code * 0.9)
  }

  return best
}

/** The words of a query worth matching on, stopwords removed. */
export function queryWords(query: string): string[] {
  return normalizeText(query)
    .split(' ')
    .filter((word) => word && !STOPWORDS.has(word))
}

/**
 * Every product the query matches, best first. A product matches only if
 * every word of the query is found somewhere in it; ties keep the shelf order
 * the catalogue arrived in.
 */
export function searchIndex<T>(index: SearchIndex<T>, query: string): { item: T; score: number }[] {
  const words = queryWords(query)
  if (!words.length) return index.entries.map((entry) => ({ item: entry.item, score: 0 }))

  const phrase = normalizeText(query)
  const code = compactCode(query)
  const results: { item: T; order: number; score: number }[] = []

  for (const entry of index.entries) {
    let score = 0
    let matchedAll = true

    for (const word of words) {
      const wordScore = scoreWord(word, entry)
      if (wordScore === 0) {
        matchedAll = false
        break
      }
      score += wordScore
    }

    // The whole query as a model number: however it was typed, a buyer who
    // has the code wants that product and nothing near it.
    if (!matchedAll && code.length >= 3 && entry.code.includes(code)) {
      matchedAll = true
      score = FIELD_WEIGHT.code
    }

    if (!matchedAll) continue

    if (code.length >= 3 && entry.code) {
      if (entry.code === code) score += 60
      else if (entry.code.startsWith(code)) score += 25
      else if (entry.code.includes(code)) score += 12
    }

    const title = entry.fields.title.text
    if (title === phrase) score += 20
    else if (title.startsWith(phrase)) score += 10
    else if (words.length > 1 && title.includes(phrase)) score += 6

    results.push({ item: entry.item, order: entry.order, score })
  }

  return results
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ item, score }) => ({ item, score }))
}

/**
 * A corrected query, for when nothing matched: each word the catalogue does
 * not contain is swapped for the closest word it does, and the correction is
 * only offered if it actually finds something. Model numbers are left alone.
 */
export function suggestQuery<T>(index: SearchIndex<T>, query: string): string | null {
  const words = queryWords(query)
  if (!words.length) return null

  let changed = false
  const corrected = words.map((word) => {
    if (hasDigit(word) || word.length < 3 || index.vocabulary.has(word)) return word

    let best: { count: number; distance: number; word: string } | null = null
    for (const [candidate, count] of index.vocabulary) {
      const distance = editDistance(word, candidate, 2)
      if (distance > 2 || distance >= word.length) continue
      if (
        !best ||
        distance < best.distance ||
        (distance === best.distance && count > best.count)
      ) {
        best = { count, distance, word: candidate }
      }
    }

    if (!best) return word
    changed = true
    return best.word
  })

  if (!changed) return null

  const suggestion = corrected.join(' ')
  return searchIndex(index, suggestion).length ? suggestion : null
}
