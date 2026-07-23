import { revalidateTag } from 'next/cache'
import type { CollectionConfig, GlobalConfig } from 'payload'

// Derive exact hook types from the config shape (avoids TypeWithID generic friction).
type CollectionAfterChange = NonNullable<NonNullable<CollectionConfig['hooks']>['afterChange']>[number]
type CollectionAfterDelete = NonNullable<NonNullable<CollectionConfig['hooks']>['afterDelete']>[number]
type GlobalAfterChange = NonNullable<NonNullable<GlobalConfig['hooks']>['afterChange']>[number]

function revalidate(tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag)
    } catch (error) {
      // revalidateTag throws outside a request scope (seed scripts, migrations).
      // Content still self-heals via the route ISR backstop.
      console.warn(`[revalidate] skipped tag "${tag}"`, error)
    }
  }
}

export function makeCollectionRevalidateHooks(buildTags: (doc: any) => string[]): {
  afterChange: CollectionAfterChange
  afterDelete: CollectionAfterDelete
} {
  const afterChange: CollectionAfterChange = ({ doc }) => {
    revalidate(buildTags(doc))
    return doc
  }
  const afterDelete: CollectionAfterDelete = ({ doc }) => {
    revalidate(buildTags(doc))
    return doc
  }
  return { afterChange, afterDelete }
}

export function makeGlobalRevalidateHook(tags: string[]): GlobalAfterChange {
  const afterChange: GlobalAfterChange = ({ doc }) => {
    revalidate(tags)
    return doc
  }
  return afterChange
}
