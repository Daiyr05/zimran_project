import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import { AppShell } from './AppShell'
import { RequireAuth } from './RequireAuth'

/** Each page is its own chunk, so a phone downloads only the page it opens. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

/** Routes from SRS 8.2. */
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', lazy: page(() => import('@/pages/LoginRoute')) },
  { path: '/signup', lazy: page(() => import('@/pages/SignupRoute')) },
  // Invitees join without an account (FR-INVITE-2).
  { path: '/s/:code', lazy: page(() => import('@/pages/SessionGuestPage')) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/plan', lazy: page(() => import('@/pages/SearchPage')) },
          { path: '/plan/results/:searchId', lazy: page(() => import('@/pages/ResultsPage')) },
          { path: '/plan/:planId', lazy: page(() => import('@/pages/PlanDetailPage')) },
          { path: '/s/:code/host', lazy: page(() => import('@/pages/SessionHostPage')) },
          { path: '/feed', lazy: page(() => import('@/pages/FeedPage')) },
          { path: '/moments/new', lazy: page(() => import('@/pages/NewMomentPage')) },
          { path: '/moments/:id/edit', lazy: page(() => import('@/pages/EditMomentPage')) },
          { path: '/me', lazy: page(() => import('@/pages/ProfilePage')) },
          { path: '/u/:username', lazy: page(() => import('@/pages/ProfilePage')) },
          { path: '/friends', lazy: page(() => import('@/pages/FriendsPage')) },
          { path: '/map', lazy: page(() => import('@/pages/MapPage')) },
          { path: '/places/:id', lazy: page(() => import('@/pages/PlacePage')) },
          { path: '/plus', lazy: page(() => import('@/pages/PlusPage')) },
          { path: '/settings', lazy: page(() => import('@/pages/SettingsPage')) },
        ],
      },
    ],
  },
  { path: '*', lazy: page(() => import('@/pages/NotFoundPage')) },
])
