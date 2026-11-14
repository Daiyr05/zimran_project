import { useMemo } from 'react'
import { Chip } from '@/design'
import { duration } from '@/lib/format'
import { addDays, cityDate, dayLabel, hmLabel, startTimes } from '@/lib/time'
import type { SearchForm } from './model'
import { TimeSelect } from './TimeSelect'

interface Props {
  form: SearchForm
  set: (patch: Partial<SearchForm>) => void
}

const HOURS = [1, 2, 3, 4, 5, 6, 8]

/** Day, start time and total time, which includes travel there and back (FR-SEARCH-1). */
export function WhenPicker({ form, set }: Props) {
  const today = cityDate()
  const days = useMemo(() => {
    const list = Array.from({ length: 8 }, (_, i) => addDays(today, i))
    return list.filter((d) => startTimes(d).length > 0)
  }, [today])
  const times = startTimes(form.date)

  const pickDay = (date: string) => {
    const next = startTimes(date)
    set({ date, time: next.includes(form.time) ? form.time : (next.find((t) => t >= '18:30') ?? next[0]) })
  }

  const endHm = (() => {
    const [h, m] = form.time.split(':').map(Number)
    const total = h * 60 + m + form.hours * 60
    const hh = Math.floor(total / 60) % 24
    return `${String(hh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })()

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Day">
        {days.map((d) => (
          <Chip key={d} selected={form.date === d} onClick={() => pickDay(d)} className="shrink-0">
            {dayLabel(d, today)}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <TimeSelect value={form.time} times={times} onChange={(time) => set({ time })} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="How long">
          {HOURS.map((h) => (
            <Chip key={h} selected={form.hours === h} onClick={() => set({ hours: h })} className="px-3.5">
              {h} h
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted">
        {hmLabel(form.time)} to about {hmLabel(endHm)} · {duration(form.hours * 60)} door to door,
        including travel there and back.
      </p>
    </div>
  )
}
