import { MessageCircleHeart, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Card } from '@/design'
import { dismissOuting, dueOuting, type Outing } from './outings'

/** After a planned outing ends: "How was it?" with place, date and spend prefilled (FR-MOMENT-6). */
export function HowWasItPrompt() {
  const { pathname } = useLocation()
  const [outing, setOuting] = useState<Outing | null>(() => dueOuting())
  if (!outing || pathname.startsWith('/moments/')) return null

  const close = () => {
    dismissOuting(outing.id)
    setOuting(null)
  }

  const link = (s: Outing['stops'][number]) => {
    const p = new URLSearchParams({
      place: s.placeId,
      placeName: s.name,
      date: s.date,
      spent: String(Math.round(outing.perPersonCents / outing.stops.length / 100)),
      plan: outing.planId,
      outing: outing.id,
    })
    return `/moments/new?${p}`
  }

  return (
    <Card className="mx-auto mb-6 flex max-w-2xl items-start gap-4 border-accent/40 p-4" role="status">
      <MessageCircleHeart className="mt-0.5 size-7 shrink-0 text-accent" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <p className="font-display text-lg font-bold">How was it?</p>
          <p className="text-sm text-muted">Post a Moment so friends know where to go, and what it really costs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {outing.stops.map((s) => (
            <Link key={s.placeId} to={link(s)}>
              <Button size="sm" variant="secondary">
                {s.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      <button type="button" onClick={close} aria-label="Not now" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-2">
        <X className="size-4" aria-hidden />
      </button>
    </Card>
  )
}
