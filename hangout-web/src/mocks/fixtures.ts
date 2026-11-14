/*
  Mock data for building screens before the Java API is live.
  Places here are FICTIONAL demo data, not real venues. Never show them in the pitch as real.
  Shapes follow SRS 7.2. Every plan's total = places + tax + tip + travel, to the cent (AT-3),
  using tax 8.875% and a 20% tip on food and drink stops.
*/
import type { LegItem, Place, Plan, SearchResponse, StopItem, User } from '@/api/types'

export const demoUser: User = {
  id: 'u-demo',
  name: 'Zhandaulet',
  username: 'zhandaulet',
  email: 'demo@hangout.test',
  photoUrl: null,
  homeCity: 'New York',
  tier: 'FREE',
  searchesLeft: 3,
  visibility: 'FRIENDS',
}

const START = { lat: 40.7265, lng: -73.9815, label: 'East Village' }
const DAY = '2026-11-20'
const at = (hm: string) => `${DAY}T${hm}:00-05:00`
const maps = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

/** AI-generated demo photo of a fictional venue (public/demo, made with Higgsfield). */
export const demoPhoto = (placeId: string, n = 1) => `${import.meta.env.BASE_URL}demo/${placeId.replace(/^pl-/, '')}-${n}.jpg`

function place(p: Omit<Place, 'mapsUrl' | 'photoUrl' | 'website'> & { website?: string }): Place {
  return { photoUrl: demoPhoto(p.id), website: p.website ?? null, mapsUrl: maps(p.lat, p.lng), ...p }
}

export const PLACES = {
  lanes: place({ id: 'pl-lanes', name: 'Pin & Pint Lanes', kind: 'ACTIVITY', lat: 40.7223, lng: -73.9873, rating: 4.6, reviewCount: 140, priceLevel: 2, hiddenGem: true, reservable: false }),
  saffron: place({ id: 'pl-saffron', name: 'Little Saffron', kind: 'DINNER', lat: 40.7262, lng: -73.9845, rating: 4.5, reviewCount: 410, priceLevel: 2, hiddenGem: false, reservable: true }),
  lume: place({ id: 'pl-lume', name: 'Osteria Lume', kind: 'DINNER', lat: 40.7291, lng: -73.9866, rating: 4.7, reviewCount: 620, priceLevel: 2, hiddenGem: false, reservable: true }),
  moonbean: place({ id: 'pl-moonbean', name: 'Moonbean Dessert Bar', kind: 'TREAT', lat: 40.7279, lng: -73.9902, rating: 4.6, reviewCount: 180, priceLevel: 1, hiddenGem: true, reservable: false }),
  arcade: place({ id: 'pl-arcade', name: 'Night Owl Arcade', kind: 'ACTIVITY', lat: 40.7208, lng: -73.9927, rating: 4.5, reviewCount: 95, priceLevel: 1, hiddenGem: true, reservable: false }),
  lantern: place({ id: 'pl-lantern', name: 'Paper Lantern Tea House', kind: 'TREAT', lat: 40.7236, lng: -73.9888, rating: 4.8, reviewCount: 230, priceLevel: 1, hiddenGem: false, reservable: false }),
  vinyl: place({ id: 'pl-vinyl', name: 'Groove Room Listening Bar', kind: 'ACTIVITY', lat: 40.7247, lng: -73.9842, rating: 4.4, reviewCount: 160, priceLevel: 2, hiddenGem: true, reservable: true }),
}

const leg = (mode: LegItem['mode'], minutes: number, costCents: number, from: string, to: string): LegItem => ({
  type: 'LEG', mode, minutes, costCents, from, to,
})

const stop = (
  position: number,
  p: Place,
  arrive: string,
  depart: string,
  estCostCents: number,
  friendSignal: StopItem['friendSignal'] = null,
): StopItem => ({ type: 'STOP', position, arriveAt: at(arrive), departAt: at(depart), estCostCents, place: p, friendSignal })

function plans(searchId: string): Plan[] {
  return [
    {
      id: `${searchId}-p1`,
      rank: 1,
      shape: 'ACTIVITY_DINNER',
      totalMinutes: 176,
      totalCents: 11088,
      perPersonCents: 5544,
      costBreakdown: { placesCents: 8200, taxCents: 728, tipCents: 1000, travelCents: 1160 },
      reasons: ['Matches Playful and Cozy', 'Madina rated the lanes 4/5', '$9.12 under budget'],
      timeline: [
        leg('TRANSIT', 14, 580, 'Home', PLACES.lanes.name),
        stop(1, PLACES.lanes, '18:44', '19:44', 3200, { name: 'Madina', rating: 4, spentCents: 3800, momentId: 'm-1' }),
        leg('WALK', 9, 0, PLACES.lanes.name, PLACES.saffron.name),
        stop(2, PLACES.saffron, '19:53', '21:08', 5000),
        leg('TRANSIT', 18, 580, PLACES.saffron.name, 'Home'),
      ],
    },
    {
      id: `${searchId}-p2`,
      rank: 2,
      shape: 'DINNER_TREAT',
      totalMinutes: 137,
      totalCents: 10568,
      perPersonCents: 5284,
      costBreakdown: { placesCents: 8200, taxCents: 728, tipCents: 1640, travelCents: 0 },
      reasons: ['Cozy dinner, all on foot', 'Dessert is a hidden gem', '$14.32 under budget'],
      timeline: [
        leg('WALK', 12, 0, 'Home', PLACES.lume.name),
        stop(1, PLACES.lume, '18:42', '19:57', 6400),
        leg('WALK', 6, 0, PLACES.lume.name, PLACES.moonbean.name),
        stop(2, PLACES.moonbean, '20:03', '20:33', 1800),
        leg('WALK', 14, 0, PLACES.moonbean.name, 'Home'),
      ],
    },
    {
      id: `${searchId}-p3`,
      rank: 3,
      shape: 'ACTIVITY_TREAT',
      totalMinutes: 145,
      totalCents: 6488,
      perPersonCents: 3244,
      costBreakdown: { placesCents: 4600, taxCents: 408, tipCents: 320, travelCents: 1160 },
      reasons: ['Most playful of the three', 'Daiyrbek loved the tea house', 'Cheapest: $55.12 under budget'],
      timeline: [
        leg('TRANSIT', 18, 580, 'Home', PLACES.arcade.name),
        stop(1, PLACES.arcade, '18:48', '19:48', 3000),
        leg('WALK', 7, 0, PLACES.arcade.name, PLACES.lantern.name),
        stop(2, PLACES.lantern, '19:55', '20:35', 1600, { name: 'Daiyrbek', rating: 5, spentCents: 1400, momentId: 'm-2' }),
        leg('TRANSIT', 20, 580, PLACES.lantern.name, 'Home'),
      ],
    },
  ]
}

export function demoSearch(searchesLeft: number | null): SearchResponse {
  const searchId = `s-${Date.now().toString(36)}`
  return { searchId, searchesLeft, start: START, partySize: 2, plans: plans(searchId) }
}

/** Shuffle: same inputs, plans in a new order with new ids (FR-RESULT-11). */
export function demoShuffle(searchId: string): SearchResponse {
  const tag = `${searchId}-x${Date.now().toString(36)}`
  const list = plans(tag).reverse().map((p, i) => ({ ...p, rank: i + 1 }))
  return { searchId, searchesLeft: null, start: START, partySize: 2, plans: list }
}
