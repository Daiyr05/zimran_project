/*
  Mock invite-and-vote server (SRS 4.4). Stored in localStorage so a host tab and a guest tab
  in the same browser share one session, like two phones would with the real API.
  A simulated friend ("Alikhan") answers ~6 s after the session opens and votes ~5 s after
  plans are generated, so the flow can be demoed alone. Remove SIM_FRIEND to turn it off.
*/
import { delay, http, HttpResponse } from 'msw'
import type { MemberInputs, Mood, SearchRequest, Session } from '@/api/types'
import { config } from '@/lib/config'
import { demoSearch } from './fixtures'

const STORE = 'hangout.mock.sessions'
const SIM_FRIEND = true

interface MockMember {
  id: string
  token: string
  displayName: string
  isOrganizer: boolean
  inputs: MemberInputs | null
  votes: Record<string, boolean>
  simulated?: boolean
}

interface MockSession {
  code: string
  status: Session['status']
  organizerName: string
  createdAt: number
  generatedAt: number | null
  expiresAt: number
  members: MockMember[]
  plans: Session['plans']
  start: Session['start']
  winningPlanId: string | null
}

const url = (path: string) => `${config.apiUrl}${path}`
const rand = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')

function load(): Record<string, MockSession> {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? '{}')
  } catch {
    return {}
  }
}

function save(all: Record<string, MockSession>) {
  try {
    localStorage.setItem(STORE, JSON.stringify(all))
  } catch {
    /* ignore */
  }
}

function err(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

/** Advance the simulated friend based on elapsed time. */
function tick(s: MockSession) {
  const now = Date.now()
  for (const m of s.members.filter((x) => x.simulated)) {
    if (!m.inputs && now - s.createdAt > 6000) {
      m.inputs = { moods: ['PLAYFUL', 'CHILL'], totalMinutes: 180, budgetCents: 6000, start: { lat: 40.7301, lng: -73.9875, label: 'Union Square' } }
    }
    if (s.status === 'GENERATED' && s.plans && s.generatedAt && now - s.generatedAt > 5000 && Object.keys(m.votes).length === 0) {
      s.plans.forEach((p, i) => (m.votes[p.id] = i !== 1))
    }
  }
}

function caller(s: MockSession, request: Request): MockMember | null {
  const token = request.headers.get('X-Member-Token')
  if (token) return s.members.find((m) => m.token === token) ?? null
  if (request.headers.get('Authorization')) return s.members.find((m) => m.isOrganizer) ?? null
  return null
}

/** What the API returns: no other member's budget, address or token (FR-INVITE-3, NFR-PRIV-1). */
function view(s: MockSession, me: MockMember | null): Session {
  const likes: Record<string, number> = {}
  for (const p of s.plans ?? []) likes[p.id] = s.members.filter((m) => m.votes[p.id]).length
  return {
    code: s.code,
    status: s.status,
    organizerName: s.organizerName,
    expiresAt: new Date(s.expiresAt).toISOString(),
    members: s.members.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      isOrganizer: m.isOrganizer,
      hasAnswered: Boolean(m.inputs),
      hasVoted: Object.keys(m.votes).length > 0,
    })),
    plans: s.plans,
    start: s.start,
    partySize: s.members.length,
    likes,
    winningPlanId: s.winningPlanId,
    me: me
      ? { memberId: me.id, isOrganizer: me.isOrganizer, hasAnswered: Boolean(me.inputs), votes: me.votes }
      : null,
  }
}

/** Run a handler against one stored session, then save it. */
async function withSession(
  code: string,
  request: Request,
  fn: (s: MockSession, me: MockMember | null) => Response | Promise<Response>,
) {
  await delay(250)
  const all = load()
  const s = all[code]
  if (!s) return err(404, 'NOT_FOUND', "We couldn't find this invite. Check the link.")
  if (Date.now() > s.expiresAt) return err(410, 'SESSION_EXPIRED', 'This invite has expired.')
  tick(s)
  const res = await fn(s, caller(s, request))
  save(all)
  return res
}

function blendedMoods(members: MockMember[]): Mood[] {
  const lists = members.flatMap((m) => (m.inputs ? [m.inputs.moods] : []))
  const shared = lists.reduce<Mood[]>((acc, l) => acc.filter((x) => l.includes(x)), lists[0] ?? [])
  if (shared.length) return shared
  const counts = new Map<Mood, number>()
  lists.flat().forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m]) => m)
}

const title = (m: string) => m.charAt(0) + m.slice(1).toLowerCase()

export const sessionHandlers = [
  http.post(url('/sessions'), async ({ request }) => {
    await delay(400)
    const { inputs } = (await request.json()) as { inputs: SearchRequest }
    const code = rand(8)
    const now = Date.now()
    const organizer: MockMember = {
      id: `m-${rand(6)}`,
      token: `t-${rand(16)}`,
      displayName: 'Zhandaulet',
      isOrganizer: true,
      votes: {},
      inputs: {
        moods: inputs.moods,
        totalMinutes: inputs.totalMinutes,
        budgetCents: inputs.budgetBasis === 'TOTAL' ? Math.round(inputs.budgetCents / Math.max(1, inputs.party.adults)) : inputs.budgetCents,
        start: inputs.start,
      },
    }
    const members = [organizer]
    if (SIM_FRIEND) {
      members.push({ id: `m-${rand(6)}`, token: `t-${rand(16)}`, displayName: 'Alikhan', isOrganizer: false, votes: {}, inputs: null, simulated: true })
    }
    const all = load()
    all[code] = { code, status: 'OPEN', organizerName: organizer.displayName, createdAt: now, generatedAt: null, expiresAt: now + 48 * 3600_000, members, plans: null, start: null, winningPlanId: null }
    save(all)
    return HttpResponse.json({ code, link: `${location.origin}/s/${code}` }, { status: 201 })
  }),

  http.get(url('/sessions/:code'), ({ params, request }) =>
    withSession(String(params.code), request, (s, me) => HttpResponse.json(view(s, me))),
  ),

  http.post(url('/sessions/:code/join'), async ({ params, request }) => {
    const { displayName } = (await request.json()) as { displayName: string }
    return withSession(String(params.code), request, (s) => {
      if (s.status === 'CLOSED') return err(409, 'CONFLICT', 'Voting has already closed.')
      const m: MockMember = { id: `m-${rand(6)}`, token: `t-${rand(16)}`, displayName: displayName.trim().slice(0, 30), isOrganizer: false, votes: {}, inputs: null }
      s.members.push(m)
      return HttpResponse.json({ memberToken: m.token, memberId: m.id }, { status: 201 })
    })
  }),

  http.put(url('/sessions/:code/inputs'), async ({ params, request }) => {
    const inputs = (await request.json()) as MemberInputs
    return withSession(String(params.code), request, (s, me) => {
      if (!me) return err(401, 'UNAUTHORIZED', 'Join the invite first.')
      if (s.status !== 'OPEN') return err(409, 'CONFLICT', 'Plans are already generated.')
      me.inputs = inputs
      return HttpResponse.json(view(s, me))
    })
  }),

  http.post(url('/sessions/:code/generate'), ({ params, request }) =>
    withSession(String(params.code), request, async (s, me) => {
      if (!me?.isOrganizer) return err(403, 'FORBIDDEN', 'Only the organizer can generate plans.')
      if (s.status !== 'OPEN') return err(409, 'CONFLICT', 'Plans are already generated.')
      await delay(1400)
      const answered = s.members.filter((m) => m.inputs)
      const minBudget = Math.min(...answered.map((m) => m.inputs!.budgetCents))
      const moods = blendedMoods(answered)
      const res = demoSearch(null)
      s.plans = res.plans.map((p) => ({
        ...p,
        reasons: [`Fits everyone's budget: under $${Math.round(minBudget / 100)} each`, `Shared mood: ${moods.map(title).join(' and ')}`, ...p.reasons.slice(1, 2)],
      }))
      s.start = res.start
      s.status = 'GENERATED'
      s.generatedAt = Date.now()
      return HttpResponse.json(view(s, me))
    }),
  ),

  http.put(url('/sessions/:code/votes'), async ({ params, request }) => {
    const { votes } = (await request.json()) as { votes: { planId: string; liked: boolean }[] }
    return withSession(String(params.code), request, (s, me) => {
      if (!me) return err(401, 'UNAUTHORIZED', 'Join the invite first.')
      if (s.status !== 'GENERATED') return err(409, 'CONFLICT', 'Voting is not open.')
      me.votes = Object.fromEntries(votes.map((v) => [v.planId, v.liked]))
      return HttpResponse.json(view(s, me))
    })
  }),

  http.post(url('/sessions/:code/close'), ({ params, request }) =>
    withSession(String(params.code), request, (s, me) => {
      if (!me?.isOrganizer) return err(403, 'FORBIDDEN', 'Only the organizer can close voting.')
      if (s.status !== 'GENERATED' || !s.plans) return err(409, 'CONFLICT', 'Nothing to close yet.')
      // Most likes wins; a tie goes to the organizer's pick, then to plan rank (FR-INVITE-7).
      const likes = (id: string) => s.members.filter((m) => m.votes[id]).length
      const best = Math.max(...s.plans.map((p) => likes(p.id)))
      const tied = s.plans.filter((p) => likes(p.id) === best)
      const winner = tied.find((p) => me.votes[p.id]) ?? tied[0]
      s.winningPlanId = winner.id
      s.status = 'CLOSED'
      return HttpResponse.json(view(s, me))
    }),
  ),

  http.get(url('/sessions/:code/calendar.ics'), ({ params, request }) =>
    withSession(String(params.code), request, (s) => {
      const plan = s.plans?.find((p) => p.id === s.winningPlanId)
      if (!plan) return err(409, 'CONFLICT', 'No final plan yet.')
      const stops = plan.timeline.filter((t) => t.type === 'STOP')
      const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      const first = stops[0]
      const last = stops.at(-1)!
      if (first?.type !== 'STOP' || last.type !== 'STOP') return err(409, 'CONFLICT', 'No stops.')
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hangout//MVP//EN', 'BEGIN:VEVENT',
        `UID:${s.code}@hangout.test`, `DTSTAMP:${fmt(new Date().toISOString())}`,
        `DTSTART:${fmt(first.arriveAt)}`, `DTEND:${fmt(last.departAt)}`,
        `SUMMARY:Hangout: ${stops.map((t) => (t.type === 'STOP' ? t.place.name : '')).join(' + ')}`,
        `LOCATION:${first.place.name}`, 'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n')
      return new HttpResponse(ics, { headers: { 'Content-Type': 'text/calendar' } })
    }),
  ),
]
