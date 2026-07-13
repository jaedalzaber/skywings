import { notFound } from 'next/navigation'

import { BlogDetail } from '@/components/collections/BlogDetail'
import { getBlogPostBySlug } from '@/data/catalog'

export const dynamic = 'force-dynamic'

export default async function BlogDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return <BlogDetail post={post} />
}
