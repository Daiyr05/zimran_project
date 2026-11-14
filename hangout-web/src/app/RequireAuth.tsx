import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getToken } from '@/api/client'

/** Sends signed-out users to /login and brings them back afterwards (SRS 8.4). */
export function RequireAuth() {
  const location = useLocation()
  if (!getToken()) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}
