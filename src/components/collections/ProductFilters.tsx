import type { Industry, ProductFamily } from '@/payload-types'

import type { ProductFilters } from '@/data/catalog'

type ProductFiltersProps = {
  families: ProductFamily[]
  filters: ProductFilters
  industries: Industry[]
}

export function ProductFilters(props: ProductFiltersProps) {
  const { families, filters, industries } = props

  return (
    <form action="/products" className="filter-panel">
      <label>
        Search
        <input defaultValue={filters.q || ''} name="q" placeholder="Conveyor, GSE, enclosure..." />
      </label>
      <label>
        Industry
        <select defaultValue={filters.industry || ''} name="industry">
          <option value="">All industries</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.slug}>
              {industry.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Family
        <select defaultValue={filters.family || ''} name="family">
          <option value="">All families</option>
          {families.map((family) => (
            <option key={family.id} value={family.slug}>
              {family.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select defaultValue={filters.type || ''} name="type">
          <option value="">All types</option>
          <option value="standard">Standard</option>
          <option value="configurable">Configurable</option>
          <option value="custom">Custom</option>
          <option value="service">Service</option>
        </select>
      </label>
      <div className="filter-actions">
        <button className="button button-primary" type="submit">
          Apply
        </button>
        <a className="button button-secondary" href="/products">
          Reset
        </a>
      </div>
    </form>
  )
}
