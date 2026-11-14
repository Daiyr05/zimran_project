/*
  Friends, Moments, places, map, saved plans and billing (SRS 7.1).
  One hook per endpoint; components never call fetch directly.
*/
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError, getToken } from './client'
import { keys as baseKeys } from './hooks'
import type {
  FriendsResponse,
  MapPin,
  Moment,
  MomentInput,
  Page,
  PlaceDetail,
  PlaceSummary,
  Plan,
  Profile,
  SavedPlan,
  User,
  UserSearchResult,
} from './types'
import { config } from '@/lib/config'

export const socialKeys = {
  friends: ['friends'] as const,
  feed: ['feed'] as const,
  profile: (username: string) => ['profile', username] as const,
  place: (id: string) => ['place', id] as const,
  moment: (id: string) => ['moment', id] as const,
  saved: ['plans', 'saved'] as const,
  map: ['map'] as const,
}

/** After any Moment change, refresh every list that may show it. */
function useRefreshMoments() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: socialKeys.feed })
    qc.invalidateQueries({ queryKey: ['profile'] })
    qc.invalidateQueries({ queryKey: ['place'] })
    qc.invalidateQueries({ queryKey: socialKeys.map })
    qc.invalidateQueries({ queryKey: ['moment'] })
  }
}

/* ---------- Profile and account ---------- */

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Pick<User, 'name' | 'username' | 'photoUrl' | 'homeCity' | 'visibility'>>) =>
      api<User>('/me', { method: 'PATCH', body }),
    onSuccess: (user) => {
      qc.setQueryData(baseKeys.me, user)
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api<void>('/me', { method: 'DELETE' }) })
}

export function useProfile(username: string | undefined) {
  return useQuery({
    queryKey: socialKeys.profile(username ?? ''),
    queryFn: () => api<Profile>(`/users/${encodeURIComponent(username!)}`),
    enabled: Boolean(username),
  })
}

/* ---------- Friends (FR-SOCIAL-1, 2, 5) ---------- */

export function useFriends() {
  return useQuery({ queryKey: socialKeys.friends, queryFn: () => api<FriendsResponse>('/friends') })
}

export function useUserSearch(q: string) {
  const term = q.trim().replace(/^@/, '')
  return useQuery({
    queryKey: ['users', 'search', term],
    queryFn: () => api<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(term)}`),
    enabled: term.length >= 2,
    staleTime: 10_000,
  })
}

function useFriendMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.friends })
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['users', 'search'] })
      qc.invalidateQueries({ queryKey: socialKeys.feed })
    },
  })
}

export const useSendRequest = () =>
  useFriendMutation((username: string) => api('/friends/requests', { method: 'POST', body: { username } }))

export const useAnswerRequest = () =>
  useFriendMutation(({ id, accept }: { id: string; accept: boolean }) =>
    api(`/friends/requests/${id}/${accept ? 'accept' : 'decline'}`, { method: 'POST' }),
  )

export const useRemoveFriend = () =>
  useFriendMutation((userId: string) => api(`/friends/${userId}`, { method: 'DELETE' }))

/** Not in SRS 7.1 yet (FR-SOCIAL-5 needs it): POST /users/{id}/block. */
export const useBlockUser = () =>
  useFriendMutation((userId: string) => api(`/users/${userId}/block`, { method: 'POST' }))

/** Not in SRS 7.1 yet (FR-MOMENT-7): POST /moments/{id}/tag/approve | /decline. */
export function useAnswerTag() {
  const refresh = useRefreshMoments()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ momentId, approve }: { momentId: string; approve: boolean }) =>
      api(`/moments/${momentId}/tag/${approve ? 'approve' : 'decline'}`, { method: 'POST' }),
    onSuccess: () => {
      refresh()
      qc.invalidateQueries({ queryKey: socialKeys.friends })
    },
  })
}

/* ---------- Moments (FR-MOMENT-1 to 10, FR-SOCIAL-6) ---------- */

export function useFeed() {
  return useInfiniteQuery({
    queryKey: socialKeys.feed,
    queryFn: ({ pageParam }) => api<Page<Moment>>(`/feed?page=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  })
}

/** Not in SRS 7.1 yet: GET /moments/{id}, for the edit page and shared links. */
export function useMoment(id: string | undefined) {
  return useQuery({
    queryKey: socialKeys.moment(id ?? ''),
    queryFn: () => api<Moment>(`/moments/${id}`),
    enabled: Boolean(id),
  })
}

export function useSaveMoment(id?: string) {
  const refresh = useRefreshMoments()
  return useMutation({
    mutationFn: (body: MomentInput) =>
      id
        ? api<Moment>(`/moments/${id}`, { method: 'PATCH', body })
        : api<Moment>('/moments', { method: 'POST', body }),
    onSuccess: refresh,
  })
}

export function useDeleteMoment() {
  const refresh = useRefreshMoments()
  return useMutation({
    mutationFn: (id: string) => api<void>(`/moments/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
}

export function useReportMoment() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api<void>(`/moments/${id}/report`, { method: 'POST', body: { reason } }),
  })
}

/** POST /uploads, multipart (FR-MOMENT-1). Returns the stored photo URL. */
export async function uploadPhoto(file: Blob, name: string): Promise<string> {
  const body = new FormData()
  body.append('file', file, name)
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${config.apiUrl}/uploads`, { method: 'POST', headers, body })
  } catch {
    throw new ApiError(0, { code: 'NETWORK', message: "Can't reach the server. Check your connection." })
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data ?? { code: 'UNKNOWN', message: 'Upload failed.' })
  return (data as { url: string }).url
}

/* ---------- Places and map (FR-MAP-2 to 4) ---------- */

export function usePlaceAutocomplete(q: string) {
  const term = q.trim()
  return useQuery({
    queryKey: ['places', 'autocomplete', term],
    queryFn: () => api<PlaceSummary[]>(`/places/autocomplete?q=${encodeURIComponent(term)}`),
    enabled: term.length >= 2,
    staleTime: 60_000,
  })
}

export function usePlace(id: string | undefined) {
  return useQuery({
    queryKey: socialKeys.place(id ?? ''),
    queryFn: () => api<PlaceDetail>(`/places/${id}`),
    enabled: Boolean(id),
  })
}

/** bbox = "minLng,minLat,maxLng,maxLat". */
export function useMapPins(bbox: string | null) {
  return useQuery({
    queryKey: [...socialKeys.map, bbox],
    queryFn: () => api<MapPin[]>(`/map/moments?bbox=${bbox}`),
    enabled: Boolean(bbox),
    placeholderData: (prev) => prev,
  })
}

/* ---------- Saved plans (FR-RESULT-12) ---------- */

export function useSavedPlans() {
  return useQuery({ queryKey: socialKeys.saved, queryFn: () => api<SavedPlan[]>('/plans/saved') })
}

/** Swap a stop on a saved plan and keep the saved list in sync. */
export function useSwapSaved() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, position }: { planId: string; position: number }) =>
      api<Plan>(`/plans/${planId}/swap`, { method: 'POST', body: { position } }),
    onSuccess: (plan) =>
      qc.setQueryData<SavedPlan[]>(socialKeys.saved, (list) =>
        list?.map((s) => (s.plan.id === plan.id ? { ...s, plan } : s)),
      ),
  })
}

/* ---------- Plus (FR-PAY-1 to 3) ---------- */

export function useCheckout() {
  return useMutation({
    mutationFn: () => api<{ url: string }>('/billing/checkout', { method: 'POST' }),
  })
}

export function useDemoUpgrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<User>('/billing/demo-upgrade', { method: 'POST' }),
    onSuccess: (user) => qc.setQueryData(baseKeys.me, user),
  })
}
