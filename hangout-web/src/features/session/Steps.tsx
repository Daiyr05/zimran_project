import { Check } from 'lucide-react'
import type { SessionStatus } from '@/api/types'
import { cn } from '@/lib/cn'

const STEPS = ['Everyone answers', 'Vote', 'Go'] as const

/** Where the group is: answering → voting → final plan. */
export function Steps({ status }: { status: SessionStatus }) {
  const current = status === 'OPEN' ? 0 : status === 'GENERATED' ? 1 : 2
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              'grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold',
              i < current && 'bg-good text-white',
              i === current && 'bg-accent text-accent-ink',
              i > current && 'bg-surface-2 text-muted',
            )}
            aria-current={i === current ? 'step' : undefined}
          >
            {i < current ? <Check className="size-4" aria-hidden /> : i + 1}
          </span>
          <span className={cn('truncate text-sm font-semibold', i === current ? 'text-ink' : 'text-muted')}>{label}</span>
          {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
        </li>
      ))}
    </ol>
  )
}
