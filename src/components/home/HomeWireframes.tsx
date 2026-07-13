import { defaultHeroPreviewItems, type HomeHeroLayoutBlock } from '@/data/home'

export function HeroWireframe(props: { block: HomeHeroLayoutBlock }) {
  const { block } = props
  const previewItems = block.previewItems?.length ? block.previewItems : defaultHeroPreviewItems

  return (
    <aside className="wireframe-board" aria-label="Homepage wireframe preview">
      <div className="wireframe-toolbar">
        <span />
        <span />
        <span />
      </div>
      <div className="wireframe-hero">
        <div>
          <span className="wire-label">Capability system</span>
          <strong>{block.previewHeading || 'Manufacturing under one roof'}</strong>
        </div>
        <div className="wire-cube" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="wire-grid">
        {previewItems.slice(0, 4).map((item, itemIndex) => (
          <div className="wire-card" key={item.id ?? item.title}>
            <small>{String(itemIndex + 1).padStart(2, '0')}</small>
            <span>{item.title}</span>
          </div>
        ))}
      </div>
      <div className="wire-configurator">
        <span className="wire-label">3D configurable product</span>
        <div className="conveyor-lines" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </aside>
  )
}

export function ProductWireframe() {
  return (
    <div className="product-image-wire" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

export function ConfiguratorWireframe() {
  return (
    <div className="configurator-wire" aria-hidden="true">
      <div className="config-sidebar">
        <span />
        <span />
        <span />
      </div>
      <div className="config-stage">
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}
