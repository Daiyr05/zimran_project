import { ChevronDown, Clock } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { hmLabel } from '@/lib/time'

const PARTS = [
  { label: 'Morning', from: '00:00', to: '12:00' },
  { label: 'Afternoon', from: '12:00', to: '17:00' },
  { label: 'Evening', from: '17:00', to: '21:00' },
  { label: 'Late', from: '21:00', to: '24:00' },
]

/** Start time picker: a themed grid of times grouped by part of day, instead of the browser's list. */
export function TimeSelect({ value, times, onChange }: { value: string; times: string[]; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false)
  // Where the panel fits: below the field, or above it when the sticky bottom bar would cover it.
  const [place, setPlace] = useState({ up: false, maxH: 320 })
  const root = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    // Bring the chosen time into view and focus it.
    root.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: false })
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (t: string) => {
    onChange(t)
    setOpen(false)
    root.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }

  // Arrow keys move through the grid (4 columns).
  const onGridKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 }[e.key]
    if (!step) return
    e.preventDefault()
    const all = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-time]')]
    const i = all.indexOf(document.activeElement as HTMLButtonElement)
    all[Math.max(0, Math.min(all.length - 1, i + step))]?.focus()
  }

  return (
    <div ref={root} className="relative sm:w-48">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(e) => {
          if (!open) {
            const rect = e.currentTarget.getBoundingClientRect()
            const below = window.innerHeight - rect.bottom - 150 // room left above the sticky bars
            const above = rect.top - 90 // room left below the top header
            const up = below < 260 && above > below
            setPlace({ up, maxH: Math.max(200, Math.min(320, up ? above : below)) })
          }
          setOpen((o) => !o)
        }}
        className={cn(
          'flex h-13 w-full items-center gap-2 rounded-2xl border bg-surface px-4 text-left transition',
          open ? 'border-brand ring-4 ring-brand/15' : 'border-line hover:border-muted',
        )}
      >
        <Clock className="size-5 text-muted" aria-hidden />
        <span className="sr-only">Start time: </span>
        <span className="flex-1 text-base font-semibold">{hmLabel(value)}</span>
        <ChevronDown className={cn('size-4 text-muted transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Start time"
          onKeyDown={onGridKey}
          style={{ maxHeight: place.maxH }}
          className={cn(
            'absolute left-0 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-3 shadow-[0_20px_50px_-15px_rgb(0_0_0/0.35)]',
            place.up ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
        >
          {PARTS.map((p) => {
            const list = times.filter((t) => t >= p.from && t < p.to)
            if (!list.length) return null
            return (
              <div key={p.label} className="flex flex-col gap-2 pb-3 last:pb-0">
                <p className="px-1 text-xs font-semibold tracking-wide text-muted uppercase">{p.label}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {list.map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-time={t}
                      aria-pressed={t === value}
                      onClick={() => pick(t)}
                      className={cn(
                        'h-10 rounded-xl text-sm font-semibold tabular-nums transition',
                        t === value ? 'bg-brand text-brand-ink' : 'bg-surface-2 text-ink hover:bg-brand-soft',
                      )}
                    >
                      {hmLabel(t).replace(' ', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
