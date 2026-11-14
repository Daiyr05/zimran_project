import { Loader2, MapPin, Search, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { usePlaceAutocomplete } from '@/api/social'
import { KIND } from '@/features/plans/labels'
import { cn } from '@/lib/cn'

export interface PickedPlace {
  id: string
  name: string
  address?: string
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Place search by name with keyboard support (FR-MAP-4). ARIA combobox pattern. */
export function PlacePicker({
  value,
  onChange,
  invalid,
}: {
  value: PickedPlace | null
  onChange: (p: PickedPlace | null) => void
  invalid?: boolean
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const term = useDebounced(q)
  const { data = [], isFetching } = usePlaceAutocomplete(term)
  const listId = useId()

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand bg-brand-soft px-3.5 py-3">
        <MapPin className="size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{value.name}</p>
          {value.address && <p className="truncate text-sm text-muted">{value.address}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Change place"
          className="grid size-9 place-items-center rounded-full hover:bg-surface"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    )
  }

  const pick = (i: number) => {
    const p = data[i]
    if (!p) return
    onChange({ id: p.id, name: p.name, address: p.address })
    setQ('')
    setOpen(false)
  }

  const showList = open && term.length >= 2

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id="moment-place"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && data[active] ? `${listId}-${active}` : undefined}
        value={q}
        placeholder="Search a place by name"
        autoComplete="off"
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, data.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && showList) {
            e.preventDefault()
            pick(active)
          }
        }}
        className={cn(
          'h-11 w-full rounded-xl border bg-surface pr-10 pl-10 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none',
          invalid ? 'border-bad/60' : 'border-line',
        )}
      />
      {isFetching && <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />}
      {showList && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-card">
          {data.length === 0 && !isFetching && <li className="px-4 py-3 text-sm text-muted">No places match "{term}"</li>}
          {data.map((p, i) => {
            const { icon: Icon, label } = KIND[p.kind]
            return (
              <li
                key={p.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(i)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center gap-3 px-4 py-2.5', i === active && 'bg-surface-2')}
              >
                <Icon className="size-4 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted">
                    {label} · {p.address}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
