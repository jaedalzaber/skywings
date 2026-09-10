import { relationArray, relationTitle } from '@/data/relations'
import type { Product } from '@/payload-types'

import { Collapsible } from './Collapsible'

/**
 * What the product is made of, finished with, made by, and used for.
 *
 * These live on the product as relationships and had nowhere to surface: the
 * detail page carried the gallery, the overview and the specification table,
 * so a buyer could read a size but not the material or the process. Each group
 * is dropped when it is empty rather than rendered as an empty heading, and
 * the whole block disappears when the product carries none of them -- a
 * catalogue of seventy-five is not filled in evenly.
 */
function titles(value: unknown): string[] {
  return relationArray(value)
    .map((item) => relationTitle(item, ''))
    .filter((title): title is string => Boolean(title))
}

function dimensionRows(product: Product): { label: string; value: string }[] {
  const dimensions = product.dimensions

  if (!dimensions) return []

  return (
    [
      { label: 'Length', value: dimensions.length },
      { label: 'Width', value: dimensions.width },
      { label: 'Height', value: dimensions.height },
      { label: 'Load capacity', value: product.loadCapacity },
    ] satisfies { label: string; value: unknown }[]
  )
    .filter((row): row is { label: string; value: string } => typeof row.value === 'string' && row.value.trim().length > 0)
}

export function ProductAttributes(props: { product: Product }) {
  const { product } = props

  const groups = [
    { items: titles(product.applications), title: 'Applications' },
    { items: titles(product.materials), title: 'Materials' },
    { items: titles(product.finishes), title: 'Finishes' },
    { items: titles(product.capabilities), title: 'Manufacturing processes' },
  ].filter((group) => group.items.length > 0)

  const dimensions = dimensionRows(product)
  const notes = product.dimensions?.notes?.trim()
  const surface = product.surfaceTreatment?.trim()

  if (!groups.length && !dimensions.length && !notes && !surface) {
    return null
  }

  return (
    <Collapsible title="Materials, finishes and applications">
      <div className="pdp-attributes">
        {groups.map((group) => (
          <div className="pdp-attribute" key={group.title}>
            <h3 className="pdp-attribute-title">{group.title}</h3>
            <ul className="pdp-attribute-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        {dimensions.length ? (
          <div className="pdp-attribute" key="dimensions">
            <h3 className="pdp-attribute-title">Dimensions</h3>
            <dl className="pdp-attribute-dims">
              {dimensions.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        {surface || notes ? (
          <div className="pdp-attribute pdp-attribute--wide">
            {surface ? (
              <>
                <h3 className="pdp-attribute-title">Surface treatment</h3>
                <p className="pdp-attribute-note">{surface}</p>
              </>
            ) : null}
            {notes ? <p className="pdp-attribute-note">{notes}</p> : null}
          </div>
        ) : null}
      </div>
    </Collapsible>
  )
}
