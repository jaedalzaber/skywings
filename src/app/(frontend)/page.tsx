import { HomeBlockRenderer } from '@/components/home/HomeBlocks'
import { getHomeLayout } from '@/data/home'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const layout = await getHomeLayout()

  return <HomeBlockRenderer blocks={layout} />
}
