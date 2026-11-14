import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ApiError, getToken, setToken } from '@/api/client'

/** 401 on a signed-in call = the token expired: sign out and come back after login (SRS 8.4). */
function onAuthError(err: unknown) {
  if (!(err instanceof ApiError) || err.status !== 401 || !getToken()) return
  // Guest invite pages identify by member token; a 401 there is not about the account.
  if (/^\/s\/[^/]+$/.test(location.pathname)) return
  setToken(null)
  const next = encodeURIComponent(location.pathname + location.search)
  location.assign(`/login?next=${next}`)
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onAuthError }),
  mutationCache: new MutationCache({ onError: onAuthError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry client errors (401, 402, 404...); retry network and 5xx once.
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  )
}
