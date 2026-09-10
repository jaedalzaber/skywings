import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { getHomeLayout } from '@/data/home'
import { getSiteFooter } from '@/data/site'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // The locations section shows the facility addresses and photograph, both
  // edited on the Footer global rather than the home page.
  const [layout, footer] = await Promise.all([getHomeLayout(), getSiteFooter()])

  return (
    <HomeBlockRenderer
      blocks={layout}
      locations={{ addresses: footer.addresses, image: footer.locationsImage }}
    />
  )
}
