import { LocateFixed, MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import type { SearchForm } from './model'

type StartFields = Pick<SearchForm, 'startLabel' | 'startLat' | 'startLng'>

interface Props {
  form: StartFields
  set: (patch: Partial<StartFields>) => void
  error?: string
}

const CURRENT = 'Current location'

/**
 * Starting point (FR-SEARCH-3). Location is asked for only when the user taps the
 * button (NFR-PRIV-3). A typed address is sent as text; the API geocodes it.
 */
export function StartPointInput({ form, set, error }: Props) {
  const [locating, setLocating] = useState(false)
  const usingGps = form.startLat !== null && form.startLabel === CURRENT

  const locate = () => {
    if (!('geolocation' in navigator)) {
      toast.error("Your browser can't share location. Type an address instead.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        set({
          startLabel: CURRENT,
          startLat: Number(pos.coords.latitude.toFixed(5)),
          startLng: Number(pos.coords.longitude.toFixed(5)),
        })
      },
      () => {
        setLocating(false)
        toast.error('Location is off. Type your address instead.')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'flex h-13 items-center gap-2 rounded-2xl border bg-surface pr-1.5 pl-4 focus-within:border-brand',
          error ? 'border-bad' : 'border-line',
        )}
      >
        <MapPin className="size-5 shrink-0 text-muted" aria-hidden />
        <label htmlFor="start" className="sr-only">
          Starting point
        </label>
        <input
          id="start"
          value={form.startLabel}
          readOnly={usingGps}
          onChange={(e) => set({ startLabel: e.target.value, startLat: null, startLng: null })}
          placeholder="Home address or neighborhood"
          autoComplete="street-address"
          aria-invalid={Boolean(error)}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
        />
        {usingGps ? (
          <button
            type="button"
            onClick={() => set({ startLabel: '', startLat: null, startLng: null })}
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2"
            aria-label="Clear location"
          >
            <X className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="flex h-10 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-sm font-semibold text-brand disabled:opacity-60 dark:text-ink"
          >
            <LocateFixed className={cn('size-4', locating && 'animate-spin')} aria-hidden />
            {locating ? (
              'Locating…'
            ) : (
              <>
                <span className="sm:hidden">Locate me</span>
                <span className="hidden sm:inline">Use my location</span>
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-sm text-muted">The plan starts here and brings you back at the end.</p>
    </div>
  )
}
