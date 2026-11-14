/*
  API types, written from SRS section 7.
  When Daiyrbek's Swagger is live, regenerate these with:
    npx openapi-typescript <API_URL>/v3/api-docs -o src/api/schema.ts
  and keep these names as aliases so components don't change.
*/

export const MOODS = [
  'COZY',
  'ROMANTIC',
  'PLAYFUL',
  'ADVENTUROUS',
  'CHILL',
  'FANCY',
  'CULTURAL',
  'ACTIVE',
] as const
export type Mood = (typeof MOODS)[number]

export type Tier = 'FREE' | 'PLUS'
export type TravelMode = 'WALK' | 'TRANSIT' | 'RIDESHARE' | 'CAR'
export type PlaceKind = 'ACTIVITY' | 'DINNER' | 'TREAT'

export interface User {
  id: string
  name: string
  username: string
  email: string
  photoUrl: string | null
  homeCity: string
  tier: Tier
  searchesLeft: number | null // null = unlimited (Plus)
  visibility: Visibility
}

export type Visibility = 'FRIENDS' | 'PUBLIC'

export interface AuthResponse {
  token: string
  user: User
}

export interface SearchRequest {
  party: { type: 'PARTNER' | 'FRIENDS' | 'SOLO'; adults: number; children: number[] }
  /** lat/lng from "Use my location"; null when the user typed an address (the API geocodes `label`). */
  start: { lat: number | null; lng: number | null; label: string }
  startTime: string
  totalMinutes: number
  budgetCents: number
  budgetBasis: 'TOTAL' | 'PER_PERSON'
  moods: Mood[]
  /** "Plan with this place" from a place page (FR-MAP-3): the engine must include it. */
  includePlaceId?: string | null
  advanced?: {
    setting?: 'OUT' | 'IN' | 'ANY'
    energy?: 'LOW' | 'MEDIUM' | 'HIGH'
    indoorOutdoor?: 'INDOOR' | 'OUTDOOR' | 'ANY'
    quietOnly?: boolean
    noAlcohol?: boolean
    travelMode?: TravelMode
    maxLegMinutes?: number
    diet?: string | null
    discovery?: number
    avoidVisited?: boolean
  }
}

export interface Place {
  id: string
  name: string
  kind: PlaceKind
  lat: number
  lng: number
  rating: number | null
  reviewCount: number
  priceLevel: number | null
  photoUrl: string | null
  mapsUrl: string
  website: string | null
  hiddenGem: boolean
  reservable: boolean
  /** Outdoor venue, used for the rain warning (FR-RESULT-13). */
  outdoor?: boolean
}

export interface FriendSignal {
  name: string
  rating: number
  spentCents: number
  momentId: string
}

export interface LegItem {
  type: 'LEG'
  mode: TravelMode
  minutes: number
  costCents: number
  from: string
  to: string
}

export interface StopItem {
  type: 'STOP'
  position: number
  arriveAt: string
  departAt: string
  estCostCents: number
  place: Place
  friendSignal: FriendSignal | null
  /** Chance of rain during the visit, 0–100; null when unknown (FR-RESULT-13). */
  rainChancePct?: number | null
}

export type TimelineItem = LegItem | StopItem

export interface Plan {
  id: string
  rank: number
  shape: string
  totalMinutes: number
  totalCents: number
  perPersonCents: number
  costBreakdown: { placesCents: number; taxCents: number; tipCents: number; travelCents: number }
  reasons: string[]
  timeline: TimelineItem[]
}

export interface SearchResponse {
  searchId: string
  searchesLeft: number | null
  /**
   * Resolved starting point (geocoded if the user typed an address), needed to draw the
   * route on the map. Not in SRS 7.2 yet: ask Daiyrbek to add it.
   */
  start: { lat: number; lng: number; label: string }
  /** People in the party, for per-person labels. */
  partySize: number
  plans: Plan[]
  /** Client-only: the request that produced this result, reused to start an invite. */
  request?: SearchRequest
}

/** GET /plans/saved item: the plan plus what is needed to show and re-use it. */
export interface SavedPlan {
  plan: Plan
  start: SearchResponse['start']
  partySize: number
  savedAt: string
  /** The search inputs, so a saved plan can start an invite. */
  inputs: SearchRequest
}

/* ---------- Invite and vote (SRS 4.4, 7.1) ---------- */

export type SessionStatus = 'OPEN' | 'GENERATED' | 'CLOSED'

export interface SessionMember {
  id: string
  displayName: string
  isOrganizer: boolean
  hasAnswered: boolean
  hasVoted: boolean
}

/** Private inputs an invitee sends. Never returned to other members (FR-INVITE-3). */
export interface MemberInputs {
  moods: Mood[]
  totalMinutes: number
  budgetCents: number // per person
  start: { lat: number | null; lng: number | null; label: string }
}

export interface Session {
  code: string
  status: SessionStatus
  organizerName: string
  expiresAt: string
  members: SessionMember[]
  /** Set once generated. */
  plans: Plan[] | null
  start: SearchResponse['start'] | null
  partySize: number
  /** Likes per plan id, visible to everyone. */
  likes: Record<string, number>
  winningPlanId: string | null
  /** The caller's own member record and votes. */
  me: { memberId: string; isOrganizer: boolean; hasAnswered: boolean; votes: Record<string, boolean> } | null
}

export interface CreateSessionResponse {
  code: string
  link: string
}

export interface JoinResponse {
  memberToken: string
  memberId: string
}

/** Error body for every non-2xx response (SRS 7.3). */
export interface ApiErrorBody {
  code: string
  message: string
  fields?: Record<string, string>
}

/* ---------- Friends, Moments, places, map (SRS 4.5–4.7, 7.1) ---------- */

/** What other users may see about a person. Never email or home address. */
export interface UserSummary {
  id: string
  name: string
  username: string
  photoUrl: string | null
  homeCity: string
}

export type Friendship = 'SELF' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'

export interface FriendRequest {
  id: string
  user: UserSummary
  createdAt: string
}

export interface FriendsResponse {
  friends: UserSummary[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  /** Moments where a friend tagged you and you haven't answered yet (FR-MOMENT-7). */
  tagRequests: { momentId: string; by: UserSummary; placeName: string }[]
}

export interface UserSearchResult extends UserSummary {
  friendship: Friendship
}

export type HideDate = 'NONE' | 'DAY' | 'FULL'
export type SpentBasis = 'TOTAL' | 'PER_PERSON'

export interface PlaceSummary {
  id: string
  name: string
  kind: PlaceKind
  lat: number
  lng: number
  address: string
}

export interface Moment {
  id: string
  author: UserSummary
  place: PlaceSummary
  planId: string | null
  /** YYYY-MM-DD; null when the author hid the date. */
  visitDate: string | null
  hideDate: HideDate
  rating: number
  opinion: string
  wouldGoAgain: boolean
  spentCents: number
  spentBasis: SpentBasis
  moods: Mood[]
  shareToPlace: boolean
  verifiedVisit: boolean
  photos: string[]
  /** Only tags the friend approved (FR-MOMENT-7). */
  taggedFriends: UserSummary[]
  createdAt: string
  isMine: boolean
}

/** POST /moments and PATCH /moments/{id} body (FR-MOMENT-1 to 8). */
export interface MomentInput {
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
  photoUrls: string[]
  taggedUserIds: string[]
}

export interface Page<T> {
  items: T[]
  nextPage: number | null
}

export interface Profile {
  user: UserSummary
  visibility: Visibility
  friendship: Friendship
  /** Pending request id when friendship is REQUEST_RECEIVED, to accept from the profile. */
  requestId: string | null
  placesVisited: number
  friendsCount: number
  /** null when the profile is friends-only and you are not friends (FR-SOCIAL-4). */
  moments: Moment[] | null
}

export interface PlaceDetail extends Place {
  address: string
  phone: string | null
  /** Seven lines, Monday first, e.g. "5:00 PM – 1:00 AM" or "Closed". */
  hours: string[]
  photos: string[]
  friendsMoments: Moment[]
  sharedMoments: Moment[]
}

export interface MapPin {
  momentId: string
  place: PlaceSummary
  authorName: string
  rating: number
  photo: string | null
  /** true = a friend's Moment, false = a Moment shared to the place page. */
  fromFriend: boolean
}
