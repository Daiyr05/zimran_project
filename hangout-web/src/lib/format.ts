import { config } from './config'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** API money is integer cents (SRS 7). 10850 → "$108.50". */
export function money(cents: number, opts: { whole?: boolean } = {}) {
  return (opts.whole ? usdWhole : usd).format(cents / 100)
}

const clock = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: config.timeZone,
})

/** "2026-11-20T18:44:00-05:00" → "6:44 PM" in the demo city's time zone. */
export function clockTime(iso: string) {
  return clock.format(new Date(iso))
}

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const fullDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** Visit date the way the author chose to show it (FR-MOMENT-8). */
export function visitDate(date: string | null, hide: 'NONE' | 'DAY' | 'FULL') {
  if (!date || hide === 'FULL') return null
  const d = new Date(`${date}T12:00:00Z`)
  return hide === 'DAY' ? monthYear.format(d) : fullDay.format(d)
}

const rel = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })

/** "2 hours ago", "yesterday", "3 weeks ago". */
export function timeAgo(iso: string, now = Date.now()) {
  let v = (new Date(iso).getTime() - now) / 1000
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
    ['week', 4.35],
    ['month', 12],
    ['year', Infinity],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(v) < size) return unit === 'second' ? 'just now' : rel.format(Math.round(v), unit)
    v /= size
  }
  return ''
}

/** "$38 per person" or "$92 total". */
export function spent(cents: number, basis: 'TOTAL' | 'PER_PERSON') {
  if (cents === 0) return 'Free'
  return `${money(cents, { whole: cents % 100 === 0 })} ${basis === 'PER_PERSON' ? 'per person' : 'total'}`
}

/** 225 → "3 h 45 min", 40 → "40 min". */
export function duration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}
