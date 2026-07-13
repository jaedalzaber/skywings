import { ButtonLink } from './ButtonLink'

type EmptyStateProps = {
  actionHref?: string
  actionLabel?: string
  message: string
  title: string
}

export function EmptyState(props: EmptyStateProps) {
  const { actionHref, actionLabel, message, title } = props

  return (
    <div className="empty-state">
      <span className="wire-label">Empty state</span>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionHref && actionLabel ? (
        <ButtonLink href={actionHref} variant="secondary">
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  )
}
