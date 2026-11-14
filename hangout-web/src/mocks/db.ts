/*
  Mock database for MSW, saved in localStorage so a reload (or the Plus checkout redirect)
  keeps state, like a real server would. Reset it with: localStorage.removeItem('hangout.mock.db.v2')
*/
import type { HideDate, Mood, SavedPlan, SpentBasis, User } from '@/api/types'
import { demoUser } from './fixtures'
import {
  placePhotos,
  ME_ID,
  opinionText,
  SEED_FRIENDS,
  SEED_INCOMING,
  SEED_MOMENTS,
  SEED_OUTGOING,
  SEED_USERS,
  type MockUser,
} from './socialFixtures'

const KEY = 'hangout.mock.db.v2'

export interface MockFriendship {
  id: string
  from: string
  to: string
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
}

export interface MockMoment {
  id: string
  authorId: string
  placeId: string
  planId: string | null
  visitDate: string
  hideDate: HideDate
  rating: number
  opinion: string
  wouldGoAgain: boolean
  spentCents: number
  spentBasis: SpentBasis
  moods: Mood[]
  shareToPlace: boolean
  photos: string[]
  tags: { userId: string; status: 'PENDING' | 'APPROVED' | 'DECLINED' }[]
  reports: string[]
  createdAt: string
}

export interface Db {
  user: User
  users: MockUser[]
  friendships: MockFriendship[]
  moments: MockMoment[]
  saved: SavedPlan[]
}

export const rid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

const dayIso = (daysAgo: number) => {
  const d = new Date(Date.now() - daysAgo * 86_400_000)
  return d.toISOString().slice(0, 10)
}

function seed(): Db {
  const friendships: MockFriendship[] = [
    ...SEED_FRIENDS.map((id) => ({ id: rid('f'), from: ME_ID, to: id, status: 'ACCEPTED' as const })),
    ...SEED_INCOMING.map((id) => ({ id: rid('f'), from: id, to: ME_ID, status: 'PENDING' as const })),
    ...SEED_OUTGOING.map((id) => ({ id: rid('f'), from: ME_ID, to: id, status: 'PENDING' as const })),
    // Friends among themselves, so mutual stuff looks real.
    { id: rid('f'), from: 'u-madina', to: 'u-daiyrbek', status: 'ACCEPTED' },
  ]
  const moments: MockMoment[] = SEED_MOMENTS.map((m, i) => {
    const id = m.id ?? `m-s${i}`
    const created = new Date(Date.now() - m.daysAgo * 86_400_000 + 19 * 3_600_000).toISOString()
    return {
      id,
      authorId: m.author,
      placeId: m.place,
      planId: i % 3 === 0 ? `plan-seed-${i}` : null,
      visitDate: dayIso(m.daysAgo),
      hideDate: m.hideDate ?? 'NONE',
      rating: m.rating,
      opinion: opinionText(m.opinion),
      wouldGoAgain: m.again,
      spentCents: m.spent,
      spentBasis: m.basis,
      moods: m.moods,
      shareToPlace: m.share,
      photos: Array.from({ length: Math.min(m.photos, 2) }, (_, k) => placePhotos(m.place)[(i + k) % 2]),
      // Madina tagged you on one Moment and is waiting for your answer (FR-MOMENT-7).
      tags: id === 'm-1' ? [{ userId: ME_ID, status: 'PENDING' }] : i === 2 ? [{ userId: 'u-madina', status: 'APPROVED' }] : [],
      // Two people already reported this one; a third report hides it (FR-MOMENT-10).
      reports: m.author === 'u-timur' && m.place === 'pl-arcade' ? ['u-x1', 'u-x2'] : [],
      createdAt: created,
    }
  })
  return {
    user: { ...demoUser, visibility: 'FRIENDS' },
    users: SEED_USERS,
    friendships,
    moments,
    saved: [],
  }
}

let cache: Db | null = null

export function db(): Db {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? (JSON.parse(raw) as Db) : seed()
  } catch {
    cache = seed()
  }
  return cache
}

export function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* quota full (big photos): keep the in-memory copy */
  }
}

export function resetDb() {
  cache = seed()
  commit()
}
