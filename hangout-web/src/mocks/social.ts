/* Mock API for friends, Moments, places, map, saved plans and billing (SRS 7.1). Demo data only. */
import { delay, http, HttpResponse } from 'msw'
import type {
  FriendsResponse,
  Friendship,
  MapPin,
  Moment,
  MomentInput,
  PlaceDetail,
  PlaceSummary,
  Profile,
  User,
  UserSearchResult,
  UserSummary,
} from '@/api/types'
import { config } from '@/lib/config'
import { commit, db, resetDb, rid, type MockMoment } from './db'
import { ME_ID, PLACE_INFO, placePhotos, type MockUser } from './socialFixtures'

const url = (path: string) => `${config.apiUrl}${path}`
const err = (status: number, code: string, message: string, fields?: Record<string, string>) =>
  HttpResponse.json({ code, message, fields }, { status })

/* ---------- helpers ---------- */

const meSummary = (): UserSummary => {
  const u = db().user
  return { id: ME_ID, name: u.name, username: u.username, photoUrl: u.photoUrl, homeCity: u.homeCity }
}

function userById(id: string): UserSummary | null {
  if (id === ME_ID) return meSummary()
  const u = db().users.find((x) => x.id === id)
  return u ? { id: u.id, name: u.name, username: u.username, photoUrl: u.photoUrl, homeCity: u.homeCity } : null
}

const isBlocked = (id: string) =>
  db().friendships.some((f) => f.status === 'BLOCKED' && ((f.from === ME_ID && f.to === id) || (f.from === id && f.to === ME_ID)))

const friendIds = () =>
  db().friendships.flatMap((f) =>
    f.status !== 'ACCEPTED' ? [] : f.from === ME_ID ? [f.to] : f.to === ME_ID ? [f.from] : [],
  )

function friendship(id: string): { state: Friendship; requestId: string | null } {
  if (id === ME_ID) return { state: 'SELF', requestId: null }
  const f = db().friendships.find((x) => (x.from === ME_ID && x.to === id) || (x.from === id && x.to === ME_ID))
  if (!f || f.status === 'BLOCKED') return { state: 'NONE', requestId: null }
  if (f.status === 'ACCEPTED') return { state: 'FRIENDS', requestId: null }
  return f.from === ME_ID ? { state: 'REQUEST_SENT', requestId: f.id } : { state: 'REQUEST_RECEIVED', requestId: f.id }
}

function placeSummary(id: string): PlaceSummary | null {
  const info = PLACE_INFO[id]
  if (!info) return null
  const { place } = info
  return { id: place.id, name: place.name, kind: place.kind, lat: place.lat, lng: place.lng, address: info.address }
}

const isHidden = (m: MockMoment) => m.reports.length >= 3

/** What the API returns for a Moment (date hidden per FR-MOMENT-8, only approved tags). */
function toMoment(m: MockMoment): Moment {
  return {
    id: m.id,
    author: userById(m.authorId)!,
    place: placeSummary(m.placeId)!,
    planId: m.planId,
    // The author always gets the real date back (to edit it); others see what the author allows.
    visitDate:
      m.authorId === ME_ID || m.hideDate === 'NONE'
        ? m.visitDate
        : m.hideDate === 'DAY'
          ? `${m.visitDate.slice(0, 7)}-01`
          : null,
    hideDate: m.hideDate,
    rating: m.rating,
    opinion: m.opinion,
    wouldGoAgain: m.wouldGoAgain,
    spentCents: m.spentCents,
    spentBasis: m.spentBasis,
    moods: m.moods,
    shareToPlace: m.shareToPlace,
    // FR-MOMENT-5: verified when posted after a planned outing that included the place.
    verifiedVisit: m.planId !== null,
    photos: m.photos,
    taggedFriends: m.tags.filter((t) => t.status === 'APPROVED').flatMap((t) => userById(t.userId) ?? []),
    createdAt: m.createdAt,
    isMine: m.authorId === ME_ID,
  }
}

/** Can I see this author's Moments? (FR-SOCIAL-4) */
function canSee(authorId: string) {
  if (authorId === ME_ID) return true
  if (isBlocked(authorId)) return false
  const u = db().users.find((x) => x.id === authorId)
  return friendIds().includes(authorId) || u?.visibility === 'PUBLIC'
}

const visibleMoments = () =>
  db()
    .moments.filter((m) => !isHidden(m))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

function validateMoment(b: MomentInput): Record<string, string> {
  const f: Record<string, string> = {}
  if (!PLACE_INFO[b.placeId]) f.placeId = 'Pick a place from the list'
  if (!b.photoUrls.length || b.photoUrls.length > 10) f.photos = 'Add 1 to 10 photos'
  if (!(b.rating >= 1 && b.rating <= 5)) f.rating = 'Rate it from 1 to 5'
  if (b.opinion.length > 1000) f.opinion = 'Keep it under 1,000 characters'
  if (b.moods.length > 3) f.moods = 'Pick up to 3 moods'
  if (b.spentCents < 0) f.spentCents = 'Enter 0 or more'
  if (b.visitDate > new Date().toISOString().slice(0, 10)) f.visitDate = "The visit can't be in the future"
  return f
}

/* ---------- handlers ---------- */

export const socialHandlers = [
  /* Account (FR-AUTH-5, 7) */
  http.get(url('/me'), () => HttpResponse.json(db().user)),

  http.patch(url('/me'), async ({ request }) => {
    await delay(350)
    const body = (await request.json()) as Partial<User>
    const d = db()
    if (body.username !== undefined) {
      const username = body.username.trim().toLowerCase()
      if (!/^[a-z0-9._]{3,20}$/.test(username))
        return err(400, 'VALIDATION_FAILED', 'Check the highlighted fields.', { username: '3–20 letters, numbers, dots or underscores' })
      if (d.users.some((u) => u.username === username))
        return err(409, 'CONFLICT', 'That username is taken.', { username: 'That username is taken' })
      body.username = username
    }
    d.user = { ...d.user, ...body, id: d.user.id, email: d.user.email, tier: d.user.tier, searchesLeft: d.user.searchesLeft }
    commit()
    return HttpResponse.json(d.user)
  }),

  http.delete(url('/me'), async () => {
    await delay(500)
    resetDb()
    return new HttpResponse(null, { status: 204 })
  }),

  /* Friends (FR-SOCIAL-1, 2, 5) */
  http.get(url('/users/search'), async ({ request }) => {
    await delay(200)
    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase().replace(/^@/, '')
    const list: UserSearchResult[] = db()
      .users.filter((u) => !isBlocked(u.id) && (u.username.includes(q) || u.name.toLowerCase().includes(q)))
      .slice(0, 10)
      .map((u) => ({ ...userById(u.id)!, friendship: friendship(u.id).state }))
    return HttpResponse.json(list)
  }),

  http.get(url('/friends'), async () => {
    await delay(250)
    const d = db()
    const res: FriendsResponse = {
      friends: friendIds().flatMap((id) => userById(id) ?? []),
      incoming: d.friendships
        .filter((f) => f.status === 'PENDING' && f.to === ME_ID)
        .map((f) => ({ id: f.id, user: userById(f.from)!, createdAt: new Date().toISOString() })),
      outgoing: d.friendships
        .filter((f) => f.status === 'PENDING' && f.from === ME_ID)
        .map((f) => ({ id: f.id, user: userById(f.to)!, createdAt: new Date().toISOString() })),
      tagRequests: d.moments
        .filter((m) => m.tags.some((t) => t.userId === ME_ID && t.status === 'PENDING'))
        .map((m) => ({ momentId: m.id, by: userById(m.authorId)!, placeName: placeSummary(m.placeId)!.name })),
    }
    return HttpResponse.json(res)
  }),

  http.post(url('/friends/requests'), async ({ request }) => {
    await delay(300)
    const { username } = (await request.json()) as { username: string }
    const d = db()
    const target = d.users.find((u) => u.username === username.replace(/^@/, '').toLowerCase())
    if (!target || isBlocked(target.id)) return err(404, 'NOT_FOUND', `No one goes by @${username}.`)
    const existing = friendship(target.id)
    if (existing.state === 'FRIENDS') return err(409, 'CONFLICT', `You and ${target.name} are already friends.`)
    if (existing.state === 'REQUEST_SENT') return err(409, 'CONFLICT', 'Request already sent.')
    if (existing.state === 'REQUEST_RECEIVED') {
      // They already asked you: accepting is what the user meant.
      d.friendships.find((f) => f.id === existing.requestId)!.status = 'ACCEPTED'
    } else {
      d.friendships.push({ id: rid('f'), from: ME_ID, to: target.id, status: 'PENDING' })
    }
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url('/friends/requests/:id/:answer'), async ({ params }) => {
    await delay(250)
    const d = db()
    const f = d.friendships.find((x) => x.id === params.id && x.status === 'PENDING')
    if (!f) return err(404, 'NOT_FOUND', 'That request is gone.')
    if (params.answer === 'accept') {
      if (f.to !== ME_ID) return err(403, 'FORBIDDEN', 'Only the person asked can accept.')
      f.status = 'ACCEPTED'
    } else {
      // Decline (them → you) or cancel (you → them).
      d.friendships = d.friendships.filter((x) => x !== f)
    }
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(url('/friends/:userId'), async ({ params }) => {
    await delay(250)
    const d = db()
    d.friendships = d.friendships.filter(
      (f) => !(f.status === 'ACCEPTED' && ((f.from === ME_ID && f.to === params.userId) || (f.to === ME_ID && f.from === params.userId))),
    )
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url('/users/:id/block'), async ({ params }) => {
    await delay(250)
    const d = db()
    const id = String(params.id)
    d.friendships = d.friendships.filter((f) => !((f.from === ME_ID && f.to === id) || (f.to === ME_ID && f.from === id)))
    d.friendships.push({ id: rid('f'), from: ME_ID, to: id, status: 'BLOCKED' })
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  /* Profiles (FR-SOCIAL-3, 4) */
  http.get(url('/users/:username'), async ({ params }) => {
    await delay(300)
    const d = db()
    const name = String(params.username).toLowerCase()
    const isMe = name === d.user.username
    const u: MockUser | undefined = isMe
      ? { ...meSummary(), visibility: d.user.visibility }
      : d.users.find((x) => x.username === name)
    if (!u || isBlocked(u.id)) return err(404, 'NOT_FOUND', "We couldn't find that person.")
    const { state, requestId } = friendship(u.id)
    const mine = d.moments.filter((m) => m.authorId === u.id && !isHidden(m))
    const profile: Profile = {
      user: userById(u.id)!,
      visibility: u.visibility,
      friendship: state,
      requestId,
      placesVisited: new Set(mine.map((m) => m.placeId)).size,
      friendsCount: d.friendships.filter((f) => f.status === 'ACCEPTED' && (f.from === u.id || f.to === u.id)).length,
      moments: canSee(u.id) ? mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toMoment) : null,
    }
    return HttpResponse.json(profile)
  }),

  /* Feed (FR-SOCIAL-6): friends' Moments, newest first, 20 per page */
  http.get(url('/feed'), async ({ request }) => {
    await delay(450)
    const page = Number(new URL(request.url).searchParams.get('page') ?? 0)
    const friends = new Set(friendIds())
    const all = visibleMoments().filter((m) => friends.has(m.authorId))
    const items = all.slice(page * 20, page * 20 + 20).map(toMoment)
    return HttpResponse.json({ items, nextPage: (page + 1) * 20 < all.length ? page + 1 : null })
  }),

  /* Moments (FR-MOMENT-1 to 10) */
  http.post(url('/uploads'), async ({ request }) => {
    await delay(300)
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof Blob)) return err(400, 'VALIDATION_FAILED', 'No file.')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return err(400, 'VALIDATION_FAILED', 'Use JPEG, PNG or WebP.')
    if (file.size > 5 * 1024 * 1024) return err(400, 'VALIDATION_FAILED', 'Each photo must be 5 MB or less.')
    // A real server stores the file and returns its URL; the mock inlines it.
    const bytes = new Uint8Array(await file.arrayBuffer())
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return HttpResponse.json({ url: `data:${file.type};base64,${btoa(bin)}` }, { status: 201 })
  }),

  http.get(url('/moments/:id'), async ({ params }) => {
    await delay(200)
    const m = db().moments.find((x) => x.id === params.id)
    if (!m || isHidden(m) || !canSee(m.authorId)) return err(404, 'NOT_FOUND', 'This Moment is not available.')
    return HttpResponse.json(toMoment(m))
  }),

  http.post(url('/moments'), async ({ request }) => {
    await delay(500)
    const b = (await request.json()) as MomentInput
    const fields = validateMoment(b)
    if (Object.keys(fields).length) return err(400, 'VALIDATION_FAILED', 'Check the highlighted fields.', fields)
    const m: MockMoment = {
      id: rid('m'),
      authorId: ME_ID,
      placeId: b.placeId,
      planId: b.planId,
      visitDate: b.visitDate,
      hideDate: b.hideDate,
      rating: b.rating,
      opinion: b.opinion.trim(),
      wouldGoAgain: b.wouldGoAgain,
      spentCents: b.spentCents,
      spentBasis: b.spentBasis,
      moods: b.moods,
      shareToPlace: b.shareToPlace,
      photos: b.photoUrls,
      tags: b.taggedUserIds.map((userId) => ({ userId, status: 'PENDING' as const })),
      reports: [],
      createdAt: new Date().toISOString(),
    }
    db().moments.push(m)
    commit()
    return HttpResponse.json(toMoment(m), { status: 201 })
  }),

  http.patch(url('/moments/:id'), async ({ params, request }) => {
    await delay(400)
    const m = db().moments.find((x) => x.id === params.id)
    if (!m) return err(404, 'NOT_FOUND', 'This Moment is gone.')
    if (m.authorId !== ME_ID) return err(403, 'FORBIDDEN', "You can only edit your own Moments.")
    const b = (await request.json()) as MomentInput
    const fields = validateMoment(b)
    if (Object.keys(fields).length) return err(400, 'VALIDATION_FAILED', 'Check the highlighted fields.', fields)
    const keep = new Map(m.tags.map((t) => [t.userId, t.status]))
    Object.assign(m, {
      placeId: b.placeId, visitDate: b.visitDate, hideDate: b.hideDate, rating: b.rating, opinion: b.opinion.trim(),
      wouldGoAgain: b.wouldGoAgain, spentCents: b.spentCents, spentBasis: b.spentBasis, moods: b.moods,
      shareToPlace: b.shareToPlace, photos: b.photoUrls,
      tags: b.taggedUserIds.map((userId) => ({ userId, status: keep.get(userId) ?? 'PENDING' })),
    })
    commit()
    return HttpResponse.json(toMoment(m))
  }),

  http.delete(url('/moments/:id'), async ({ params }) => {
    await delay(300)
    const d = db()
    const m = d.moments.find((x) => x.id === params.id)
    if (!m) return err(404, 'NOT_FOUND', 'This Moment is gone.')
    if (m.authorId !== ME_ID) return err(403, 'FORBIDDEN', 'You can only delete your own Moments.')
    d.moments = d.moments.filter((x) => x !== m)
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url('/moments/:id/report'), async ({ params }) => {
    await delay(300)
    const m = db().moments.find((x) => x.id === params.id)
    if (!m) return err(404, 'NOT_FOUND', 'This Moment is gone.')
    if (m.authorId === ME_ID) return err(400, 'VALIDATION_FAILED', "You can't report your own Moment.")
    if (!m.reports.includes(ME_ID)) m.reports.push(ME_ID)
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url('/moments/:id/tag/:answer'), async ({ params }) => {
    await delay(250)
    const m = db().moments.find((x) => x.id === params.id)
    const tag = m?.tags.find((t) => t.userId === ME_ID)
    if (!tag) return err(404, 'NOT_FOUND', 'That tag is gone.')
    tag.status = params.answer === 'approve' ? 'APPROVED' : 'DECLINED'
    commit()
    return new HttpResponse(null, { status: 204 })
  }),

  /* Places and map (FR-MAP-2 to 4) */
  http.get(url('/places/autocomplete'), async ({ request }) => {
    await delay(200)
    const q = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase()
    const list = Object.values(PLACE_INFO)
      .filter((i) => i.place.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((i) => placeSummary(i.place.id)!)
    return HttpResponse.json(list)
  }),

  http.get(url('/places/:id'), async ({ params }) => {
    await delay(350)
    const info = PLACE_INFO[String(params.id)]
    if (!info) return err(404, 'NOT_FOUND', "We couldn't find this place.")
    const friends = new Set(friendIds())
    const here = visibleMoments().filter((m) => m.placeId === info.place.id)
    const friendsMoments = here.filter((m) => friends.has(m.authorId) || m.authorId === ME_ID)
    const sharedMoments = here.filter((m) => m.shareToPlace && !friends.has(m.authorId) && m.authorId !== ME_ID && canSee(m.authorId))
    const detail: PlaceDetail = {
      ...info.place,
      address: info.address,
      phone: info.phone,
      hours: info.hours,
      photos: [...new Set([...placePhotos(info.place.id), ...[...friendsMoments, ...sharedMoments].flatMap((m) => m.photos)])].slice(0, 6),
      friendsMoments: friendsMoments.map(toMoment),
      sharedMoments: sharedMoments.filter((m) => m.shareToPlace || friends.has(m.authorId)).map(toMoment),
    }
    return HttpResponse.json(detail)
  }),

  http.get(url('/map/moments'), async ({ request }) => {
    await delay(250)
    const bbox = (new URL(request.url).searchParams.get('bbox') ?? '').split(',').map(Number)
    const [minLng, minLat, maxLng, maxLat] = bbox.length === 4 && bbox.every(Number.isFinite) ? bbox : [-180, -90, 180, 90]
    const friends = new Set(friendIds())
    const pins: MapPin[] = visibleMoments()
      .filter((m) => (friends.has(m.authorId) || m.authorId === ME_ID || (m.shareToPlace && canSee(m.authorId))))
      .flatMap((m) => {
        const place = placeSummary(m.placeId)
        if (!place || place.lng < minLng || place.lng > maxLng || place.lat < minLat || place.lat > maxLat) return []
        return [{
          momentId: m.id,
          place,
          authorName: m.authorId === ME_ID ? 'You' : userById(m.authorId)!.name,
          rating: m.rating,
          photo: m.photos[0] ?? null,
          fromFriend: friends.has(m.authorId) || m.authorId === ME_ID,
        }]
      })
    return HttpResponse.json(pins)
  }),

  /* Saved plans (FR-RESULT-12) */
  http.get(url('/plans/saved'), async () => {
    await delay(250)
    return HttpResponse.json([...db().saved].sort((a, b) => b.savedAt.localeCompare(a.savedAt)))
  }),

  /* Plus (FR-PAY-2, 3) */
  http.post(url('/billing/checkout'), async () => {
    await delay(700)
    // Real flow: Stripe Checkout, then the webhook marks the user PLUS. The mock skips Stripe.
    const d = db()
    d.user = { ...d.user, tier: 'PLUS', searchesLeft: null }
    commit()
    return HttpResponse.json({ url: `${location.origin}/plus?checkout=success` })
  }),

  http.post(url('/billing/demo-upgrade'), async () => {
    await delay(400)
    const d = db()
    d.user = { ...d.user, tier: 'PLUS', searchesLeft: null }
    commit()
    return HttpResponse.json(d.user)
  }),

  /* Sign in with Google (FR-AUTH-6) */
  http.post(url('/auth/google'), async () => {
    await delay(400)
    return HttpResponse.json({ token: 'mock-token', user: db().user })
  }),
]
