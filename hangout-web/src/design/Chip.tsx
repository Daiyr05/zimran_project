import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** A toggleable pill, used for moods, durations, party type. */
export function Chip({ selected = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition',
        selected
          ? 'border-brand bg-brand-soft text-brand dark:text-ink'
          : 'border-line bg-surface text-ink hover:border-muted',
        className,
      )}
      {...props}
    />
  )
}
