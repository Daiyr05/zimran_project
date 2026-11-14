/*
  Seed data for the social mock (friends, Moments, places).
  EVERYTHING HERE IS FICTIONAL DEMO DATA: made-up people, made-up venues, AI-generated photos
  (public/demo, made with Higgsfield). Each venue photo says "AI demo image" so it is never
  mistaken for a real venue.
*/
import type { Mood, Place, PlaceKind, UserSummary } from '@/api/types'
import { demoPhoto, PLACES } from './fixtures'

/* ---------- Generated demo art (not photos) ---------- */

const PALETTES = [
  ['#3b2f8f', '#ff6b5a'],
  ['#1f8a5b', '#f6c453'],
  ['#ff6b5a', '#ffd3c4'],
  ['#1c1638', '#8e82f0'],
  ['#b7791f', '#ffe9e5'],
  ['#2a6f97', '#a9def9'],
]

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export interface PlaceInfo {
  place: Place
  address: string
  phone: string | null
  hours: string[]
}

const EVENING = ['Closed', '5:00 PM – 11:00 PM', '5:00 PM – 11:00 PM', '5:00 PM – 11:00 PM', '5:00 PM – 1:00 AM', '12:00 PM – 1:00 AM', '12:00 PM – 10:00 PM']
const LATE = ['4:00 PM – 12:00 AM', '4:00 PM – 12:00 AM', '4:00 PM – 12:00 AM', '4:00 PM – 12:00 AM', '4:00 PM – 2:00 AM', '12:00 PM – 2:00 AM', '12:00 PM – 12:00 AM']
const DAYTIME = ['11:00 AM – 10:00 PM', '11:00 AM – 10:00 PM', '11:00 AM – 10:00 PM', '11:00 AM – 10:00 PM', '11:00 AM – 11:30 PM', '10:00 AM – 11:30 PM', '10:00 AM – 9:00 PM']

const maps = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

function extra(id: string, name: string, kind: PlaceKind, lat: number, lng: number, rating: number, reviewCount: number, priceLevel: number, more: Partial<Place> = {}): Place {
  return { id, name, kind, lat, lng, rating, reviewCount, priceLevel, photoUrl: demoPhoto(id), mapsUrl: maps(lat, lng), website: null, hiddenGem: false, reservable: false, ...more }
}

const EXTRA = {
  ember: extra('pl-ember', 'Ember Street Tacos', 'DINNER', 40.7255, -73.9838, 4.4, 520, 1),
  kiln: extra('pl-kiln', 'Kiln & Clay Studio', 'ACTIVITY', 40.7231, -73.9851, 4.8, 75, 2, { hiddenGem: true, reservable: true }),
  sugar: extra('pl-sugar', 'Sugar Hour Bakery', 'TREAT', 40.7284, -73.9837, 4.6, 310, 1),
  rooftop: extra('pl-rooftop', 'Skyline Rooftop Cinema', 'ACTIVITY', 40.7299, -73.9911, 4.3, 260, 2, { outdoor: true, reservable: true }),
  noodle: extra('pl-noodle', 'Noodle Lab', 'DINNER', 40.7216, -73.9886, 4.5, 690, 2),
}

export const PLACE_INFO: Record<string, PlaceInfo> = Object.fromEntries(
  (
    [
      [PLACES.lanes, '112 Avenue A (demo address)', '(212) 555-0141', LATE],
      [PLACES.saffron, '34 E 7th St (demo address)', '(212) 555-0172', EVENING],
      [PLACES.lume, '201 E 10th St (demo address)', '(212) 555-0119', EVENING],
      [PLACES.moonbean, '58 St Marks Pl (demo address)', null, LATE],
      [PLACES.arcade, '9 Avenue B (demo address)', '(212) 555-0188', LATE],
      [PLACES.lantern, '77 E 4th St (demo address)', null, DAYTIME],
      [PLACES.vinyl, '140 1st Ave (demo address)', '(212) 555-0153', LATE],
      [EXTRA.ember, '25 E 6th St (demo address)', null, DAYTIME],
      [EXTRA.kiln, '48 E 3rd St (demo address)', '(212) 555-0107', DAYTIME],
      [EXTRA.sugar, '190 2nd Ave (demo address)', null, DAYTIME],
      [EXTRA.rooftop, '12 Cooper Sq (demo address)', '(212) 555-0164', EVENING],
      [EXTRA.noodle, '83 Avenue A (demo address)', '(212) 555-0130', EVENING],
    ] as [Place, string, string | null, string[]][]
  ).map(([place, address, phone, hours]) => [place.id, { place, address, phone, hours }]),
)

export const ME_ID = 'u-demo'

export interface MockUser extends UserSummary {
  visibility: 'FRIENDS' | 'PUBLIC'
}

/** AI-generated faces for the fictional people only; teammates' names keep an initial. */
const FACES: Record<string, string> = { 'u-dana': 'dana', 'u-timur': 'timur', 'u-aigerim': 'aigerim', 'u-sam': 'sam' }

const person = (id: string, name: string, username: string, visibility: MockUser['visibility'] = 'FRIENDS'): MockUser => ({
  id, name, username, photoUrl: FACES[id] ? `${import.meta.env.BASE_URL}demo/avatar-${FACES[id]}.jpg` : avatar(name), homeCity: 'New York', visibility,
})

/** Fictional demo people. Names match the team so the demo reads naturally. */
export const SEED_USERS: MockUser[] = [
  person('u-madina', 'Madina', 'madina'),
  person('u-daiyrbek', 'Daiyrbek', 'daiyrbek'),
  person('u-alikhan', 'Alikhan', 'alikhan'),
  person('u-dana', 'Dana', 'dana.k'),
  person('u-timur', 'Timur', 'timur', 'PUBLIC'),
  person('u-aigerim', 'Aigerim', 'aigerim'),
  person('u-sam', 'Sam', 'samwalks', 'PUBLIC'),
]

export const SEED_FRIENDS = ['u-madina', 'u-daiyrbek', 'u-alikhan']
/** Dana has sent you a request; you sent one to Aigerim. */
export const SEED_INCOMING = ['u-dana']
export const SEED_OUTGOING = ['u-aigerim']

const OPINIONS = [
  'Lanes were sticky but the staff were great. Go before 8 or you wait.',
  'Best chai in the neighborhood. Quiet enough to actually talk.',
  'Pasta was perfect, the tiramisu even better. Book ahead on Fridays.',
  'Small place, big flavor. We shared four tacos and a horchata each.',
  'The pottery class was the most fun date in months. Bring old clothes.',
  'Movie was fine, the view was the real show. Bring a jacket, it gets cold.',
  'Cozy corner tables, great playlist, a little pricey for what you get.',
  'Croissants sell out by 7, so come early.',
  'Noodles were good, service was slow. Would still come back.',
  'Played air hockey for an hour straight. Cheap and loud in a good way.',
  'Listening bar was magic. Phones away, records on, everyone whispering.',
  'Dessert flight for two was plenty for three of us.',
]

interface SeedMoment {
  author: string
  place: string
  daysAgo: number
  rating: number
  spent: number
  basis: 'TOTAL' | 'PER_PERSON'
  moods: Mood[]
  again: boolean
  share: boolean
  photos: number
  opinion: number
  hideDate?: 'NONE' | 'DAY' | 'FULL'
  id?: string
}

/** 26 Moments: more than one feed page (20), so "Load more" can be tested. */
export const SEED_MOMENTS: SeedMoment[] = [
  { id: 'm-1', author: 'u-madina', place: 'pl-lanes', daysAgo: 2, rating: 4, spent: 3800, basis: 'PER_PERSON', moods: ['PLAYFUL', 'ACTIVE'], again: true, share: true, photos: 3, opinion: 0 },
  { id: 'm-2', author: 'u-daiyrbek', place: 'pl-lantern', daysAgo: 3, rating: 5, spent: 1400, basis: 'PER_PERSON', moods: ['COZY', 'CHILL'], again: true, share: true, photos: 2, opinion: 1 },
  { author: 'u-alikhan', place: 'pl-lume', daysAgo: 4, rating: 5, spent: 9200, basis: 'TOTAL', moods: ['ROMANTIC', 'FANCY'], again: true, share: false, photos: 4, opinion: 2 },
  { author: 'u-madina', place: 'pl-ember', daysAgo: 5, rating: 4, spent: 2600, basis: 'TOTAL', moods: ['CHILL'], again: true, share: true, photos: 1, opinion: 3 },
  { author: 'u-daiyrbek', place: 'pl-kiln', daysAgo: 6, rating: 5, spent: 6500, basis: 'PER_PERSON', moods: ['CULTURAL', 'PLAYFUL'], again: true, share: false, photos: 3, opinion: 4, hideDate: 'DAY' },
  { author: 'u-timur', place: 'pl-rooftop', daysAgo: 6, rating: 3, spent: 2400, basis: 'PER_PERSON', moods: ['ROMANTIC', 'ADVENTUROUS'], again: false, share: true, photos: 2, opinion: 5 },
  { author: 'u-alikhan', place: 'pl-vinyl', daysAgo: 7, rating: 4, spent: 5400, basis: 'TOTAL', moods: ['COZY', 'CULTURAL'], again: true, share: true, photos: 2, opinion: 6 },
  { author: 'u-madina', place: 'pl-sugar', daysAgo: 8, rating: 5, spent: 1100, basis: 'TOTAL', moods: ['COZY'], again: true, share: true, photos: 1, opinion: 7 },
  { author: 'u-daiyrbek', place: 'pl-noodle', daysAgo: 9, rating: 3, spent: 3300, basis: 'TOTAL', moods: ['CHILL'], again: true, share: false, photos: 2, opinion: 8, hideDate: 'FULL' },
  { author: 'u-alikhan', place: 'pl-arcade', daysAgo: 10, rating: 4, spent: 2000, basis: 'PER_PERSON', moods: ['PLAYFUL', 'ACTIVE'], again: true, share: true, photos: 3, opinion: 9 },
  { author: 'u-sam', place: 'pl-vinyl', daysAgo: 11, rating: 5, spent: 3600, basis: 'PER_PERSON', moods: ['CHILL', 'CULTURAL'], again: true, share: true, photos: 1, opinion: 10 },
  { author: 'u-madina', place: 'pl-moonbean', daysAgo: 12, rating: 4, spent: 2700, basis: 'TOTAL', moods: ['ROMANTIC', 'COZY'], again: true, share: false, photos: 2, opinion: 11 },
  { author: 'u-daiyrbek', place: 'pl-saffron', daysAgo: 13, rating: 4, spent: 4800, basis: 'TOTAL', moods: ['COZY'], again: true, share: true, photos: 2, opinion: 2 },
  { author: 'u-alikhan', place: 'pl-lanes', daysAgo: 15, rating: 3, spent: 4200, basis: 'PER_PERSON', moods: ['PLAYFUL'], again: false, share: false, photos: 1, opinion: 0 },
  { author: 'u-madina', place: 'pl-kiln', daysAgo: 17, rating: 5, spent: 7000, basis: 'PER_PERSON', moods: ['CULTURAL'], again: true, share: true, photos: 3, opinion: 4 },
  { author: 'u-daiyrbek', place: 'pl-arcade', daysAgo: 18, rating: 4, spent: 1800, basis: 'TOTAL', moods: ['PLAYFUL'], again: true, share: false, photos: 1, opinion: 9 },
  { author: 'u-alikhan', place: 'pl-ember', daysAgo: 20, rating: 4, spent: 3100, basis: 'TOTAL', moods: ['CHILL'], again: true, share: true, photos: 2, opinion: 3 },
  { author: 'u-madina', place: 'pl-rooftop', daysAgo: 22, rating: 4, spent: 5000, basis: 'TOTAL', moods: ['ROMANTIC', 'ADVENTUROUS'], again: true, share: false, photos: 2, opinion: 5 },
  { author: 'u-daiyrbek', place: 'pl-moonbean', daysAgo: 24, rating: 5, spent: 1600, basis: 'PER_PERSON', moods: ['COZY'], again: true, share: true, photos: 1, opinion: 11 },
  { author: 'u-alikhan', place: 'pl-noodle', daysAgo: 26, rating: 4, spent: 2900, basis: 'TOTAL', moods: ['CHILL'], again: true, share: false, photos: 2, opinion: 8 },
  { author: 'u-madina', place: 'pl-saffron', daysAgo: 28, rating: 3, spent: 6100, basis: 'TOTAL', moods: ['FANCY'], again: false, share: false, photos: 1, opinion: 6 },
  { author: 'u-daiyrbek', place: 'pl-lume', daysAgo: 31, rating: 5, spent: 8800, basis: 'TOTAL', moods: ['ROMANTIC'], again: true, share: true, photos: 3, opinion: 2 },
  { author: 'u-alikhan', place: 'pl-sugar', daysAgo: 33, rating: 4, spent: 900, basis: 'TOTAL', moods: ['COZY'], again: true, share: true, photos: 1, opinion: 7 },
  { author: 'u-madina', place: 'pl-lantern', daysAgo: 36, rating: 5, spent: 1300, basis: 'PER_PERSON', moods: ['CHILL', 'COZY'], again: true, share: true, photos: 2, opinion: 1 },
  { author: 'u-timur', place: 'pl-arcade', daysAgo: 38, rating: 4, spent: 2200, basis: 'PER_PERSON', moods: ['PLAYFUL'], again: true, share: true, photos: 1, opinion: 9 },
  { author: 'u-aigerim', place: 'pl-lume', daysAgo: 40, rating: 5, spent: 9900, basis: 'TOTAL', moods: ['FANCY'], again: true, share: false, photos: 2, opinion: 2 },
]

export const opinionText = (i: number) => OPINIONS[i % OPINIONS.length]

/** Two venue photos per place. */
export const placePhotos = (placeId: string) => [demoPhoto(placeId, 1), demoPhoto(placeId, 2)]

function avatar(name: string) {
  const h = hash(name)
  const [a, b] = PALETTES[h % PALETTES.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="40" height="40" fill="url(#g)"/><text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="17" fill="#fff">${name.charAt(0)}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
