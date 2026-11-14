import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  hint?: string
  error?: string
  id?: string
  children: ReactNode
}

/** One labeled block of the search form, with its error under it. */
export function Section({ title, hint, error, id, children }: SectionProps) {
  return (
    <fieldset id={id} className="flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-display text-lg font-bold text-ink">{title}</span>
        {hint && <span className="text-sm text-muted">{hint}</span>}
      </legend>
      {children}
      {error && (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </fieldset>
  )
}
