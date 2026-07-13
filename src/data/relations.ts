type RelationshipDoc = {
  id?: number | string
  slug?: string | null
  title?: string | null
}

export function asRelationDoc(value: unknown): RelationshipDoc | null {
  return typeof value === 'object' && value ? (value as RelationshipDoc) : null
}

export function relationTitle(value: unknown, fallback = 'Unassigned') {
  return asRelationDoc(value)?.title || fallback
}

export function relationSlug(value: unknown) {
  return asRelationDoc(value)?.slug || null
}

export function relationId(value: unknown) {
  const doc = asRelationDoc(value)

  if (doc?.id !== undefined) {
    return String(doc.id)
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  return null
}

export function relationArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function relationArrayIncludesSlug(value: unknown, slug: string) {
  return relationArray(value).some((item) => relationSlug(item) === slug)
}
