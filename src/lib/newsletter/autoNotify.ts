import type { CollectionAfterChangeHook } from 'payload'

type Kind = 'articles' | 'products'

type PublishableDoc = {
  _status?: null | string
  excerpt?: null | string
  featuredImage?: null | number | { id: number }
  id: number
  slug?: null | string
  summary?: null | string
  title?: null | string
}

const COLLECTION: Record<Kind, 'blog-posts' | 'products'> = {
  articles: 'blog-posts',
  products: 'products',
}

const SETTING: Record<Kind, 'autoNotifyArticles' | 'autoNotifyProducts'> = {
  articles: 'autoNotifyArticles',
  products: 'autoNotifyProducts',
}

function imageId(value: PublishableDoc['featuredImage']) {
  if (!value) return undefined
  return typeof value === 'object' ? value.id : value
}

/** The email announcing one article or product, ready to send. */
export function campaignFor(kind: Kind, doc: PublishableDoc) {
  const title = doc.title?.trim() || 'Untitled'
  const blurb = (kind === 'articles' ? doc.excerpt : doc.summary)?.trim() || ''

  return kind === 'articles'
    ? {
        body: blurb || `We have published a new article: ${title}.`,
        ctaLabel: 'Read the article',
        ctaUrl: `/resources/${doc.slug}`,
        heading: title,
        image: imageId(doc.featuredImage),
        preheader: blurb.slice(0, 200) || undefined,
        subject: `New article: ${title}`.slice(0, 150),
        topic: 'articles' as const,
      }
    : {
        body: blurb || `We have added a new product to our range: ${title}.`,
        ctaLabel: 'View the product',
        ctaUrl: `/products/${doc.slug}`,
        heading: title,
        image: imageId(doc.featuredImage),
        preheader: blurb.slice(0, 200) || undefined,
        subject: `New product: ${title}`.slice(0, 150),
        topic: 'products' as const,
      }
}

/**
 * Emails subscribers when an article or product goes live for the first
 * time, if that is switched on in Newsletter Settings.
 *
 * Only a publish made by a signed-in editor counts: seed and import scripts
 * publish in bulk with no user, and must never mail the whole list once per
 * product. Each item is announced once, ever -- unpublishing and publishing
 * again does not send it a second time. Pass `context.skipNewsletter` to
 * publish without announcing.
 */
export function notifySubscribersOnPublish(kind: Kind): CollectionAfterChangeHook {
  return async ({ context, doc, previousDoc, req }) => {
    const current = doc as PublishableDoc
    if (context.skipNewsletter || !req.user) return doc
    if (current._status !== 'published' || (previousDoc as PublishableDoc | undefined)?._status === 'published') {
      return doc
    }
    if (!current.slug) return doc

    try {
      const settings = await req.payload.findGlobal({
        depth: 0,
        overrideAccess: true,
        req,
        slug: 'newsletter-settings',
      })
      // Missing means never saved: the field's default, on.
      if (settings[SETTING[kind]] === false) return doc

      const sourceKey = `${COLLECTION[kind]}:${current.id}`
      const existing = await req.payload.count({
        collection: 'newsletter-campaigns',
        overrideAccess: true,
        req,
        where: { sourceKey: { equals: sourceKey } },
      })
      if (existing.totalDocs > 0) return doc

      await req.payload.create({
        collection: 'newsletter-campaigns',
        data: {
          ...campaignFor(kind, current),
          source: { relationTo: COLLECTION[kind], value: current.id },
          sourceKey,
          status: 'queued',
        },
        overrideAccess: true,
        req,
      })
    } catch (error) {
      // Never block the publish itself over the announcement.
      req.payload.logger.error({ err: error, msg: `[newsletter] Could not queue announcement for ${kind} ${current.id}` })
    }

    return doc
  }
}
