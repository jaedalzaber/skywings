import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { getArticleCards } from '@/data/articles'
import { getHomeLayout } from '@/data/home'
import { pickHomeArticles } from '@/data/homeInsights'
import { getSiteFooter } from '@/data/site'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // The locations section shows the facility addresses and photograph, both
  // edited on the Footer global rather than the home page. The resources
  // section is a pick from the hub's articles; a failed read only drops it.
  const [layout, footer, articles] = await Promise.all([
    getHomeLayout(),
    getSiteFooter(),
    getArticleCards().catch((error) => {
      console.error('Unable to load articles for the home page', error)
      return []
    }),
  ])

  return (
    <HomeBlockRenderer
      blocks={layout}
      insights={pickHomeArticles(articles)}
      locations={{ addresses: footer.addresses, image: footer.locationsImage }}
    />
  )
}
