/*
  Planned outings this browser knows about, for the "How was it?" prompt (FR-MOMENT-6).
  Recorded when an invite closes with a final plan. Kept in localStorage.
*/
import type { Plan } from '@/api/types'
import { stopsOf } from '@/features/plans/labels'

const KEY = 'hangout.outings'

export interface Outing {
  /** Session code: one outing per invite. */
  id: string
  planId: string
  endsAt: string
  perPersonCents: number
  stops: { placeId: string; name: string; date: string }[]
  dismissed?: boolean
}

function read(): Outing[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Outing[]
  } catch {
    return []
  }
}

function write(list: Outing[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-20)))
  } catch {
    /* storage blocked: no prompt */
  }
}

export function recordOuting(id: string, plan: Plan) {
  const list = read()
  if (list.some((o) => o.id === id)) return
  const stops = stopsOf(plan)
  const last = stops.at(-1)
  if (!last) return
  list.push({
    id,
    planId: plan.id,
    endsAt: last.departAt,
    perPersonCents: plan.perPersonCents,
    stops: stops.map((s) => ({ placeId: s.place.id, name: s.place.name, date: s.arriveAt.slice(0, 10) })),
  })
  write(list)
}

/** The most recent outing that has ended and wasn't answered or dismissed. */
export function dueOuting(now = Date.now()): Outing | null {
  return (
    read()
      .filter((o) => !o.dismissed && new Date(o.endsAt).getTime() < now)
      .sort((a, b) => b.endsAt.localeCompare(a.endsAt))[0] ?? null
  )
}

export function dismissOuting(id: string) {
  write(read().map((o) => (o.id === id ? { ...o, dismissed: true } : o)))
}
