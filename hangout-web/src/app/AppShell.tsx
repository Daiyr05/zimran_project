import { CalendarHeart, Map, Newspaper, Plus, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useMe } from '@/api/hooks'
import { Badge } from '@/design'
import { HowWasItPrompt } from '@/features/moments/HowWasItPrompt'
import { cn } from '@/lib/cn'
import { Logo } from './Logo'

const nav = [
  { to: '/plan', label: 'Plan', icon: CalendarHeart },
  { to: '/feed', label: 'Feed', icon: Newspaper },
  { to: '/moments/new', label: 'Moment', icon: Plus, primary: true },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/me', label: 'Profile', icon: UserRound },
]

/** Signed-in layout: top bar on desktop, bottom nav on phones (SRS 8.2). */
export function AppShell() {
  const { data: me } = useMe()

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive ? 'bg-brand-soft text-brand dark:text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {me && me.tier === 'FREE' ? (
            <NavLink to="/plus">
              <Badge tone="accent">{me.searchesLeft ?? 0} free plans left</Badge>
            </NavLink>
          ) : me ? (
            <Badge tone="brand">Plus</Badge>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <HowWasItPrompt />
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {nav.map(({ to, label, icon: Icon, primary }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
                    isActive ? 'text-brand dark:text-ink' : 'text-muted',
                  )
                }
              >
                {primary ? (
                  <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-ink">
                    <Icon className="size-5" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-5" aria-hidden />
                )}
                {!primary && label}
                {primary && <span className="sr-only">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
