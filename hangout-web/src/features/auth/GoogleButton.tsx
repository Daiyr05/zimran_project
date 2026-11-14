import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useGoogleLogin } from '@/api/hooks'
import { config } from '@/lib/config'

interface GoogleId {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client'

function loadScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
    const s = existing ?? document.createElement('script')
    s.addEventListener('load', () => resolve())
    s.addEventListener('error', () => reject(new Error('Google sign-in did not load')))
    if (!existing) {
      s.src = SCRIPT
      s.async = true
      document.head.appendChild(s)
    }
  })
}

/**
 * "Sign in with Google" (FR-AUTH-6). Google returns an ID token; the API checks it and returns
 * our own JWT (POST /auth/google, not in SRS 7.1 yet). Hidden unless VITE_GOOGLE_CLIENT_ID is set.
 */
export function GoogleButton({ onSignedIn }: { onSignedIn: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const login = useGoogleLogin()
  const done = useRef(onSignedIn)
  done.current = onSignedIn

  useEffect(() => {
    if (!config.googleClientId) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: ({ credential }) =>
            login.mutateAsync(credential).then(
              () => done.current(),
              (e) => toast.error(e instanceof ApiError ? e.message : 'Google sign-in failed.'),
            ),
        })
        window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', width: 320, text: 'continue_with' })
      })
      .catch(() => {
        /* blocked by an extension or offline: the email form still works */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!config.googleClientId) return null
  return (
    <div className="flex flex-col gap-4">
      <div ref={ref} className="flex min-h-11 justify-center" />
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  )
}
