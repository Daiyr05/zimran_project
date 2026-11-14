import { delay, http, HttpResponse } from 'msw'
import type { Place, Plan, SearchRequest, SearchResponse, StopItem } from '@/api/types'
import { config } from '@/lib/config'
import { commit, db } from './db'
import { demoSearch, demoShuffle, PLACES } from './fixtures'
import { PLACE_INFO } from './socialFixtures'

const url = (path: string) => `${config.apiUrl}${path}`

// Plans served this page load, so swap and save can find them (and the search they came from).
const servedPlans = new Map<string, Plan>()
const servedFrom = new Map<string, { start: SearchResponse['start']; partySize: number; inputs: SearchRequest }>()
const searchInputs = new Map<string, SearchRequest>()

function remember(res: SearchResponse, inputs?: SearchRequest) {
  if (inputs) searchInputs.set(res.searchId, inputs)
  const from = searchInputs.get(res.searchId)
  res.plans.forEach((p) => {
    servedPlans.set(p.id, p)
    if (from) servedFrom.set(p.id, { start: res.start, partySize: res.partySize, inputs: from })
  })
  return res
}

/** Puts `next` at stop `position` and renames the legs around it. Same times and cost (mock). */
function replaceStop(plan: Plan, position: number, next: Place): Plan {
  const current = plan.timeline.find((t): t is StopItem => t.type === 'STOP' && t.position === position)
  if (!current) return plan
  const old = current.place.name
  return {
    ...plan,
    timeline: plan.timeline.map((t) => {
      // Mock weather: outdoor places get a 60% rain chance so the warning can be seen (FR-RESULT-13).
      if (t.type === 'STOP') return t.position === position ? { ...t, place: next, friendSignal: null, rainChancePct: next.outdoor ? 60 : null } : t
      return { ...t, from: t.from === old ? next.name : t.from, to: t.to === old ? next.name : t.to }
    }),
  }
}

/** "Plan with this place": put it in every plan, at the stop of the same kind (or the first). */
function includePlace(res: SearchResponse, placeId: string | null | undefined): SearchResponse {
  const place = placeId ? PLACE_INFO[placeId]?.place : undefined
  if (!place) return res
  return {
    ...res,
    plans: res.plans.map((p) => {
      const stops = p.timeline.filter((t): t is StopItem => t.type === 'STOP')
      if (stops.some((s) => s.place.id === place.id)) return p
      const target = stops.find((s) => s.place.kind === place.kind) ?? stops[0]
      return target ? { ...replaceStop(p, target.position, place), reasons: [`Includes ${place.name}, as you asked`, ...p.reasons.slice(0, 2)] } : p
    }),
  }
}

const setUser = (patch: Partial<ReturnType<typeof db>['user']>) => {
  const d = db()
  d.user = { ...d.user, ...patch }
  commit()
  return d.user
}

/** Alternatives used by "swap a stop" (FR-RESULT-10), by kind. */
const ALTERNATIVES: Record<Place['kind'], Place[]> = {
  ACTIVITY: [PLACE_INFO['pl-rooftop'].place, PLACES.vinyl, PLACES.arcade, PLACES.lanes],
  DINNER: [PLACES.lume, PLACES.saffron],
  TREAT: [PLACES.lantern, PLACES.moonbean],
}

export const handlers = [
  http.post(url('/auth/login'), async () => {
    await delay(400)
    return HttpResponse.json({ token: 'mock-token', user: db().user })
  }),

  http.post(url('/auth/register'), async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; homeCity: string }
    await delay(500)
    const user = setUser({ name: body.name, email: body.email, homeCity: body.homeCity })
    return HttpResponse.json({ token: 'mock-token', user }, { status: 201 })
  }),

  http.post(url('/searches'), async ({ request }) => {
    const inputs = (await request.json()) as SearchRequest
    await delay(1600) // feel the loading state, like the real engine
    let user = db().user
    if (user.tier === 'FREE' && (user.searchesLeft ?? 0) <= 0) {
      return HttpResponse.json(
        { code: 'QUOTA_EXCEEDED', message: "You've used your 3 free plans this month." },
        { status: 402 },
      )
    }
    if (user.tier === 'FREE') user = setUser({ searchesLeft: (user.searchesLeft ?? 0) - 1 })
    return HttpResponse.json(remember(includePlace(demoSearch(user.searchesLeft), inputs.includePlaceId), inputs), { status: 201 })
  }),

  http.post(url('/searches/:id/shuffle'), async ({ params }) => {
    await delay(900)
    const res = includePlace(demoShuffle(String(params.id)), searchInputs.get(String(params.id))?.includePlaceId)
    return HttpResponse.json(remember({ ...res, searchesLeft: db().user.searchesLeft }))
  }),

  http.post(url('/plans/:id/swap'), async ({ params, request }) => {
    await delay(500)
    const plan = servedPlans.get(String(params.id)) ?? db().saved.find((x) => x.plan.id === params.id)?.plan
    if (!plan) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Plan not found.' }, { status: 404 })
    const { position } = (await request.json()) as { position: number }
    const current = plan.timeline.find((t): t is StopItem => t.type === 'STOP' && t.position === position)
    if (!current) return HttpResponse.json({ code: 'VALIDATION_FAILED', message: 'No such stop.' }, { status: 400 })

    const used = new Set(plan.timeline.flatMap((t) => (t.type === 'STOP' ? [t.place.id] : [])))
    const next = ALTERNATIVES[current.place.kind].find((p) => !used.has(p.id))
    if (!next) {
      return HttpResponse.json(
        { code: 'NOTHING_FITS', message: 'No other place of this kind fits your time and budget.' },
        { status: 422 },
      )
    }
    // Mock keeps the same estimated cost and times so totals stay consistent.
    const updated = replaceStop(plan, position, next)
    servedPlans.set(updated.id, updated)
    const saved = db().saved.find((x) => x.plan.id === updated.id)
    if (saved) {
      saved.plan = updated
      commit()
    }
    return HttpResponse.json(updated)
  }),

  http.post(url('/plans/:id/save'), async ({ params }) => {
    await delay(300)
    const id = String(params.id)
    // Saved plans are a Plus feature (SRS 2.2).
    if (db().user.tier !== 'PLUS')
      return HttpResponse.json({ code: 'PLUS_REQUIRED', message: 'Saving plans is a Plus feature.' }, { status: 402 })
    const plan = servedPlans.get(id)
    const from = servedFrom.get(id)
    if (!plan || !from) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Plan not found. Search again.' }, { status: 404 })
    const d = db()
    if (!d.saved.some((x) => x.plan.id === id)) d.saved.push({ plan, ...from, savedAt: new Date().toISOString() })
    commit()
    return new HttpResponse(null, { status: 204 })
  }),
]
