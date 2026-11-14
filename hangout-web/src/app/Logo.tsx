import { Link } from 'react-router-dom'
import { config } from '@/lib/config'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-ink">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--ink)" />
        <circle cx="16" cy="13" r="5" fill="var(--accent)" />
        <path
          d="M7 24c3-3 6-4.5 9-4.5s6 1.5 9 4.5"
          stroke="var(--brand)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {config.appName}
    </Link>
  )
}
