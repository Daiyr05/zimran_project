import { config } from './config'

/** "YYYY-MM-DD" for a Date, in the demo city's time zone. */
export function cityDate(d: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** "HH:MM" (24 h) for a Date, in the demo city's time zone. */
export function cityTime(d: Date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: config.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

/** Add whole days to a "YYYY-MM-DD" string. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** The city's UTC offset on a given day, e.g. "-05:00" (handles daylight saving). */
function cityOffset(date: string) {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName')?.value
  const m = part?.match(/GMT([+-]\d{2}):?(\d{2})?/)
  return m ? `${m[1]}:${m[2] ?? '00'}` : '+00:00'
}

/** "2026-11-20" + "18:30" → "2026-11-20T18:30:00-05:00" (the API's format, SRS 7). */
export function cityIso(date: string, hm: string) {
  return `${date}T${hm}:00${cityOffset(date)}`
}

/** "Today", "Tomorrow", then "Sat 22". */
export function dayLabel(date: string, today = cityDate()) {
  if (date === today) return 'Today'
  if (date === addDays(today, 1)) return 'Tomorrow'
  const d = new Date(`${date}T12:00:00Z`)
  const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(d)
  return `${wd} ${d.getUTCDate()}`
}

/** "18:30" → "6:30 PM". */
export function hmLabel(hm: string) {
  const [h, m] = hm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Start times every 30 min. For today, only times at least 15 min from now. */
export function startTimes(date: string, now = new Date()) {
  const all: string[] = []
  for (let mins = 7 * 60; mins <= 23 * 60 + 30; mins += 30) {
    all.push(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`)
  }
  if (date !== cityDate(now)) return all
  const soon = new Date(now.getTime() + 15 * 60_000)
  const floor = cityDate(soon) === date ? cityTime(soon) : '24:00'
  return all.filter((t) => t >= floor)
}
