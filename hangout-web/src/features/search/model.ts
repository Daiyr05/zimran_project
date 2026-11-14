import { z } from 'zod'
import { MOODS, type Mood, type SearchRequest, type TravelMode } from '@/api/types'
import { addDays, cityDate, cityIso, startTimes } from '@/lib/time'

/** Everything the Search page collects (SRS FR-SEARCH-1 to 4). */
export interface SearchForm {
  partyType: 'PARTNER' | 'FRIENDS' | 'SOLO'
  groupSize: number // people including you, for FRIENDS (2–8)
  withKids: boolean
  kidAges: number[]
  startLabel: string // "Current location" or a typed address
  startLat: number | null
  startLng: number | null
  date: string // YYYY-MM-DD in the city's time zone
  time: string // HH:MM
  hours: number // 1–8, includes travel there and back
  budget: number // whole dollars
  budgetBasis: 'TOTAL' | 'PER_PERSON'
  moods: Mood[]
  // Advanced
  setting: 'OUT' | 'IN' | 'ANY'
  energy: 'LOW' | 'MEDIUM' | 'HIGH'
  indoorOutdoor: 'INDOOR' | 'OUTDOOR' | 'ANY'
  quietOnly: boolean
  noAlcohol: boolean
  travelMode: TravelMode
  maxLegMinutes: number
  diet: '' | 'VEGETARIAN' | 'VEGAN' | 'HALAL' | 'GLUTEN_FREE'
  discovery: number // 0 popular … 1 hidden gems
  avoidVisited: boolean
  // "Plan with this place" from a place page (FR-MAP-3)
  includePlaceId: string
  includePlaceName: string
}

export function defaultForm(): SearchForm {
  const today = cityDate()
  const times = startTimes(today)
  const evening = times.find((t) => t >= '18:30')
  const date = times.length ? today : addDays(today, 1)
  return {
    partyType: 'PARTNER',
    groupSize: 4,
    withKids: false,
    kidAges: [],
    startLabel: '',
    startLat: null,
    startLng: null,
    date,
    time: date === today ? (evening ?? times[0]) : '18:30',
    hours: 4,
    budget: 120,
    budgetBasis: 'TOTAL',
    moods: [],
    setting: 'OUT',
    energy: 'MEDIUM',
    indoorOutdoor: 'ANY',
    quietOnly: false,
    noAlcohol: false,
    travelMode: 'TRANSIT',
    maxLegMinutes: 20,
    diet: '',
    discovery: 0.5,
    avoidVisited: true,
    includePlaceId: '',
    includePlaceName: '',
  }
}

/** Client-side rules; the server checks the same ones (FR-SEARCH-5). */
export const searchSchema = z
  .object({
    startLabel: z.string().trim().min(1, 'Add where you start from'),
    hours: z.number().min(1).max(8),
    budget: z.number().gt(0, 'Set a budget above $0'),
    moods: z.array(z.enum(MOODS)).min(1, 'Pick at least one mood').max(2),
    date: z.string(),
    time: z.string(),
    withKids: z.boolean(),
    kidAges: z.array(z.number().min(0).max(17)),
  })
  .refine((v) => !v.withKids || v.kidAges.length > 0, {
    path: ['kidAges'],
    message: 'Add at least one child, or turn this off',
  })
  .refine((v) => v.date <= addDays(cityDate(), 7), {
    path: ['date'],
    message: 'Pick a day within the next 7 days',
  })

export type FormErrors = Partial<Record<keyof SearchForm, string>>

export function validate(form: SearchForm): FormErrors {
  const r = searchSchema.safeParse(form)
  if (r.success) {
    if (!startTimes(form.date).includes(form.time)) return { time: 'That time has passed. Pick a later one.' }
    return {}
  }
  const errors: FormErrors = {}
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof SearchForm
    errors[key] ??= issue.message
  }
  return errors
}

export function adultsOf(f: SearchForm) {
  return f.partyType === 'SOLO' ? 1 : f.partyType === 'PARTNER' ? 2 : f.groupSize
}

/** Form → API request body (SRS 7.2). */
export function toRequest(f: SearchForm): SearchRequest {
  return {
    party: { type: f.partyType, adults: adultsOf(f), children: f.withKids ? f.kidAges : [] },
    start: { lat: f.startLat, lng: f.startLng, label: f.startLabel.trim() },
    startTime: cityIso(f.date, f.time),
    totalMinutes: f.hours * 60,
    budgetCents: f.budget * 100,
    budgetBasis: f.budgetBasis,
    moods: f.moods,
    includePlaceId: f.includePlaceId || null,
    advanced: {
      setting: f.setting,
      energy: f.energy,
      indoorOutdoor: f.indoorOutdoor,
      quietOnly: f.quietOnly,
      noAlcohol: f.noAlcohol,
      travelMode: f.travelMode,
      maxLegMinutes: f.maxLegMinutes,
      diet: f.diet || null,
      discovery: f.discovery,
      avoidVisited: f.avoidVisited,
    },
  }
}

/*
  Inputs live in the URL so a refresh or a shared link keeps them (SRS 8.5).
  Only values that differ from the defaults are written, to keep links short.
*/
export function toParams(f: SearchForm): URLSearchParams {
  const d = defaultForm()
  const p = new URLSearchParams()
  for (const key of Object.keys(f) as (keyof SearchForm)[]) {
    const v = f[key]
    if (JSON.stringify(v) === JSON.stringify(d[key])) continue
    p.set(key, Array.isArray(v) ? v.join(',') : String(v ?? ''))
  }
  return p
}

export function fromParams(p: URLSearchParams): SearchForm {
  const f = defaultForm() as unknown as Record<string, unknown>
  for (const [key, raw] of p.entries()) {
    if (!(key in f)) continue
    const current = f[key]
    if (Array.isArray(current) || key === 'moods' || key === 'kidAges') {
      const parts = raw ? raw.split(',') : []
      f[key] = key === 'kidAges' ? parts.map(Number).filter((n) => !Number.isNaN(n)) : parts.filter((m) => (MOODS as readonly string[]).includes(m))
    } else if (typeof current === 'number' || key === 'startLat' || key === 'startLng') {
      const n = Number(raw)
      f[key] = raw === '' || Number.isNaN(n) ? null : n
    } else if (typeof current === 'boolean') {
      f[key] = raw === 'true'
    } else {
      f[key] = raw
    }
  }
  return f as unknown as SearchForm
}
