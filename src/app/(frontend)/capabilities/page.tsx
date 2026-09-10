import { ProcessCapabilities } from '@/components/capabilities/ProcessCapabilities'
import { capabilitiesCopyFromLayout, getCapabilityProcesses } from '@/data/capabilities'
import { capabilitiesLayout } from '@/data/pageDefaults'
import { getPageLayout } from '@/data/pages'

export const dynamic = 'force-dynamic'

export default async function CapabilitiesPage() {
  const [layout, processes] = await Promise.all([
    getPageLayout('capabilities', capabilitiesLayout),
    getCapabilityProcesses(),
  ])

  return <ProcessCapabilities copy={capabilitiesCopyFromLayout(layout)} processes={processes} />
}
