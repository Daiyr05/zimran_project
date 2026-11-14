import { Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

/** Read-only 1–5 stars with an accessible label. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden className={cn('size-4', n <= value ? 'fill-warn text-warn' : 'text-line')} />
      ))}
    </span>
  )
}

const WORDS = ['', 'Not for me', 'It was OK', 'Good', 'Great', 'Loved it']

/** 1–5 star input that works with the keyboard (radio group). */
export function StarInput({
  value,
  onChange,
  invalid,
}: {
  value: number
  onChange: (v: number) => void
  invalid?: boolean
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <div role="radiogroup" aria-label="Rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="grid size-11 place-items-center rounded-full transition active:scale-90"
          >
            <Star
              className={cn('size-8', n <= shown ? 'fill-warn text-warn' : invalid ? 'text-bad/50' : 'text-line')}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-muted">{WORDS[shown]}</span>
    </div>
  )
}
