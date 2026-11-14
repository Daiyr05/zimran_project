import { cn } from '@/lib/cn'

/** Placeholder block shown while data loads (SRS 8.4: no blank screens). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-xl bg-surface-2', className)} />
}
