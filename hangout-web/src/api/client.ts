import { config } from '@/lib/config'
import type { ApiErrorBody } from './types'

const TOKEN_KEY = 'hangout.token'

/** JWT kept in memory, mirrored to localStorage when available (SRS 8.5). */
let token: string | null = readStored()

function readStored() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getToken() {
  return token
}

export function setToken(next: string | null) {
  token = next
  try {
    if (next) localStorage.setItem(TOKEN_KEY, next)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage blocked: keep the in-memory token only */
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields: Record<string, string>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.status = status
    this.code = body.code
    this.fields = body.fields ?? {}
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  memberToken?: string
  /** Don't send the user's JWT (guest invite pages identify by member token only). */
  anonymous?: boolean
}

/** One fetch wrapper for the whole app: base URL, JSON, auth headers, typed errors. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token && !opts.anonymous) headers.Authorization = `Bearer ${token}`
  if (opts.memberToken) headers['X-Member-Token'] = opts.memberToken

  let res: Response
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    })
  } catch {
    throw new ApiError(0, { code: 'NETWORK', message: "Can't reach the server. Check your connection." })
  }

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data ?? { code: 'UNKNOWN', message: 'Something went wrong. Please try again.' },
    )
  }
  return data as T
}
