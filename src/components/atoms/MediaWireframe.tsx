export function MediaWireframe(props: { label?: string }) {
  return (
    <div className="media-wireframe" aria-hidden="true">
      <span />
      <span />
      <span />
      {props.label ? <small>{props.label}</small> : null}
    </div>
  )
}
