import type { Product } from '@/payload-types'

import { Collapsible } from './Collapsible'

type SpecRow = { id?: string | null; label: string; unit?: string | null; value: string }

function SpecTable(props: { caption?: string; rows: SpecRow[] }) {
  const { caption, rows } = props

  return (
    <div className="pdp-spec-table">
      {caption ? <p className="pdp-spec-caption">{caption}</p> : null}
      <dl className="pdp-spec-rows">
        {rows.map((row, index) => (
          <div className="pdp-spec-row" key={row.id ?? `${row.label}-${index}`}>
            <dt>{row.label}</dt>
            <dd>
              {row.value}
              {row.unit ? ` ${row.unit}` : ''}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function ProductSpecs(props: { product: Product }) {
  const { product } = props
  const specifications = product.specifications ?? []
  const accessories = product.accessories ?? []

  if (!specifications.length && !accessories.length) {
    return null
  }

  return (
    <Collapsible title="Specification">
      <div className="pdp-spec-tables" data-cols={accessories.length ? 'two' : 'one'}>
        <SpecTable rows={specifications} />
        {accessories.length ? <SpecTable caption="Accessories" rows={accessories} /> : null}
      </div>
    </Collapsible>
  )
}
