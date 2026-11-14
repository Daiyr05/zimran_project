import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, getToken, setToken } from './client'
import type { AuthResponse, Plan, SearchRequest, SearchResponse, User } from './types'

export const keys = {
  me: ['me'] as const,
  search: (id: string) => ['search', id] as const,
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<User>('/me'),
    enabled: Boolean(getToken()),
    retry: false,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body }),
    onSuccess: ({ token, user }) => {
      setToken(token)
      qc.setQueryData(keys.me, user)
    },
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string; homeCity: string }) =>
      api<AuthResponse>('/auth/register', { method: 'POST', body }),
    onSuccess: ({ token, user }) => {
      setToken(token)
      qc.setQueryData(keys.me, user)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return () => {
    setToken(null)
    qc.clear()
  }
}

/*
  The SRS has no "GET /searches/{id}", so a search result lives in the query cache and in
  sessionStorage. A refresh keeps it; a new tab or an old link asks the user to search again.
*/
const SEARCH_KEY = (id: string) => `hangout.search.${id}`

function storeSearch(data: SearchResponse) {
  try {
    sessionStorage.setItem(SEARCH_KEY(data.searchId), JSON.stringify(data))
  } catch {
    /* storage blocked: cache only */
  }
}

function readSearch(id: string): SearchResponse | null {
  try {
    const raw = sessionStorage.getItem(SEARCH_KEY(id))
    return raw ? (JSON.parse(raw) as SearchResponse) : null
  } catch {
    return null
  }
}

export function useRunSearch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SearchRequest) =>
      api<SearchResponse>('/searches', { method: 'POST', body }),
    onSuccess: (res, request) => {
      const data = { ...res, request }
      storeSearch(data)
      qc.setQueryData(keys.search(data.searchId), data)
      qc.setQueryData<User | undefined>(keys.me, (u) =>
        u ? { ...u, searchesLeft: data.searchesLeft } : u,
      )
    },
  })
}

export function useSearchResult(searchId: string) {
  return useQuery({
    queryKey: keys.search(searchId),
    queryFn: () => readSearch(searchId),
    staleTime: Infinity,
  })
}

/** Writes an updated search (after shuffle or swap) to the cache and storage. */
function useUpdateSearch() {
  const qc = useQueryClient()
  return (data: SearchResponse) => {
    storeSearch(data)
    qc.setQueryData(keys.search(data.searchId), data)
  }
}

export function useShuffle(search: SearchResponse | null | undefined) {
  const update = useUpdateSearch()
  return useMutation({
    mutationFn: () =>
      api<SearchResponse>(`/searches/${search!.searchId}/shuffle`, { method: 'POST' }),
    onSuccess: (data) => update({ ...search!, plans: data.plans }),
  })
}

export function useSwapStop(search: SearchResponse | null | undefined) {
  const update = useUpdateSearch()
  return useMutation({
    mutationFn: ({ planId, position }: { planId: string; position: number }) =>
      api<Plan>(`/plans/${planId}/swap`, { method: 'POST', body: { position } }),
    onSuccess: (plan) =>
      update({ ...search!, plans: search!.plans.map((p) => (p.id === plan.id ? plan : p)) }),
  })
}

export function useSavePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) => api<void>(`/plans/${planId}/save`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', 'saved'] }),
  })
}

export function useGoogleLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idToken: string) => api<AuthResponse>('/auth/google', { method: 'POST', body: { idToken } }),
    onSuccess: ({ token, user }) => {
      setToken(token)
      qc.setQueryData(keys.me, user)
    },
  })
}
