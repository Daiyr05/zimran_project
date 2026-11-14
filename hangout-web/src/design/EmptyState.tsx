import type { ReactNode } from 'react'
import { Card } from './Card'

/** Friendly empty or error screen with one next step (SRS 8.4). */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand dark:text-ink">{icon}</span>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {children && <div className="max-w-sm text-muted">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </Card>
  )
}
