import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { config } from '@/lib/config'
import { api, ApiError, getToken } from './client'
import type { CreateSessionResponse, JoinResponse, MemberInputs, SearchRequest, Session } from './types'

/* Guests act with a member token per session, kept in this browser (SRS 8.5). */
const MEMBER_KEY = (code: string) => `hangout.member.${code}`

export function getMemberToken(code: string): string | null {
  try {
    return localStorage.getItem(MEMBER_KEY(code))
  } catch {
    return null
  }
}

function setMemberToken(code: string, token: string) {
  try {
    localStorage.setItem(MEMBER_KEY(code), token)
  } catch {
    /* storage blocked: the guest can still act in this tab via the query cache */
  }
}

export const sessionKey = (code: string) => ['session', code] as const

/**
 * Session status, polled every 3 s while it is open (FR-INVITE-6).
 * TanStack Query pauses polling when the tab is hidden.
 */
export function useSession(code: string, opts: { asGuest?: boolean } = {}) {
  const memberToken = opts.asGuest ? getMemberToken(code) : null
  return useQuery({
    queryKey: [...sessionKey(code), memberToken ?? (getToken() ? 'user' : 'anon')],
    queryFn: () =>
      api<Session>(`/sessions/${code}`, { memberToken: memberToken ?? undefined, anonymous: opts.asGuest }),
    refetchInterval: (q) => (q.state.data?.status === 'CLOSED' || q.state.error ? false : 3000),
    retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
  })
}

export function useCreateSession() {
  return useMutation({
    mutationFn: (inputs: SearchRequest) =>
      api<CreateSessionResponse>('/sessions', { method: 'POST', body: { inputs } }),
  })
}

export function useJoinSession(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (displayName: string) =>
      api<JoinResponse>(`/sessions/${code}/join`, { method: 'POST', body: { displayName }, anonymous: true }),
    onSuccess: ({ memberToken }) => {
      setMemberToken(code, memberToken)
      qc.invalidateQueries({ queryKey: sessionKey(code) })
    },
  })
}

function useSessionMutation<V>(code: string, path: string, method: 'POST' | 'PUT', asGuest: boolean) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: V) =>
      api<Session>(`/sessions/${code}${path}`, {
        method,
        body,
        memberToken: asGuest ? (getMemberToken(code) ?? undefined) : undefined,
        anonymous: asGuest,
      }),
    onSuccess: (session) => {
      qc.setQueriesData({ queryKey: sessionKey(code) }, session)
    },
  })
}

export const usePutInputs = (code: string, asGuest: boolean) =>
  useSessionMutation<MemberInputs>(code, '/inputs', 'PUT', asGuest)

export const usePutVotes = (code: string, asGuest: boolean) =>
  useSessionMutation<{ votes: { planId: string; liked: boolean }[] }>(code, '/votes', 'PUT', asGuest)

export const useGenerate = (code: string) => useSessionMutation<undefined>(code, '/generate', 'POST', false)

export const useCloseVoting = (code: string) => useSessionMutation<undefined>(code, '/close', 'POST', false)

/** Downloads the final plan as an .ics calendar file (FR-INVITE-8). */
export async function downloadCalendar(code: string, asGuest: boolean) {
  const headers: Record<string, string> = {}
  const token = asGuest ? getMemberToken(code) : null
  if (token) headers['X-Member-Token'] = token
  else if (!asGuest && getToken()) headers.Authorization = `Bearer ${getToken()}`
  const res = await fetch(`${config.apiUrl}/sessions/${code}/calendar.ics`, { headers })
  if (!res.ok) throw new Error('Could not create the calendar file.')
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = `hangout-${code}.ics`
  a.click()
  URL.revokeObjectURL(href)
}
