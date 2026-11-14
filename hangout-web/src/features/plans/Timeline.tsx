import { CalendarCheck, CloudRain, ExternalLink, Gem, Home, Navigation, Repeat2, Star, UsersRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import type { LegItem, Plan, StopItem } from '@/api/types'
import { Badge, Button } from '@/design'
import { clockTime, duration, money } from '@/lib/format'
import { KIND, MODE, priceSigns } from './labels'

interface Props {
  plan: Plan
  startLabel: string
  onSwap?: (position: number) => void
  swappingPosition?: number | null
  /** Link places and friends' Moments. Off for guests without an account. */
  linked?: boolean
}

/** Door-to-door timeline: leave home → leg → stop → … → back home (FR-RESULT-2, 3). */
export function Timeline({ plan, startLabel, onSwap, swappingPosition, linked = true }: Props) {
  const first = plan.timeline[0]
  const last = plan.timeline.at(-1)
  const firstStop = plan.timeline.find((t): t is StopItem => t.type === 'STOP')
  const lastStop = [...plan.timeline].reverse().find((t): t is StopItem => t.type === 'STOP')
  const leaveAt =
    firstStop && first?.type === 'LEG' ? minus(firstStop.arriveAt, first.minutes) : firstStop?.arriveAt
  const homeAt = lastStop && last?.type === 'LEG' ? plus(lastStop.departAt, last.minutes) : lastStop?.departAt

  return (
    <ol className="relative flex flex-col">
      <Endpoint label={`Leave ${startLabel}`} time={leaveAt} />
      {plan.timeline.map((item, i) =>
        item.type === 'LEG' ? (
          <LegRow key={`leg-${i}`} leg={item} />
        ) : (
          <StopRow
            key={`stop-${item.position}-${item.place.id}`}
            stop={item}
            onSwap={onSwap}
            swapping={swappingPosition === item.position}
            linked={linked}
          />
        ),
      )}
      <Endpoint label={`Back at ${startLabel}`} time={homeAt} end />
    </ol>
  )
}

function Endpoint({ label, time, end }: { label: string; time?: string; end?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-ink text-bg ring-4 ring-bg">
        <Home className="size-4" aria-hidden />
      </span>
      <p className="text-sm">
        {time && <span className="font-semibold">{clockTime(time)} · </span>}
        <span className={end ? 'text-muted' : ''}>{label}</span>
      </p>
    </li>
  )
}

function LegRow({ leg }: { leg: LegItem }) {
  const { icon: Icon, verb } = MODE[leg.mode]
  return (
    <li className="flex items-stretch gap-3">
      <span className="flex w-9 shrink-0 justify-center">
        <span className="w-0.5 border-l-2 border-dashed border-muted/40" />
      </span>
      <p className="flex items-center gap-2 py-3 text-sm text-muted">
        <Icon className="size-4" aria-hidden />
        {duration(leg.minutes)} {verb}
        <span aria-hidden>·</span>
        <span className={leg.costCents ? 'font-medium text-ink' : ''}>
          {leg.costCents ? `est. ${money(leg.costCents)}` : 'free'}
        </span>
      </p>
    </li>
  )
}

function StopRow({
  stop,
  onSwap,
  swapping,
  linked,
}: {
  stop: StopItem
  onSwap?: (position: number) => void
  swapping?: boolean
  linked: boolean
}) {
  const { place, friendSignal } = stop
  const { icon: KindIcon, label: kindLabel } = KIND[place.kind]
  const price = priceSigns(place.priceLevel)
  const [, setParams] = useSearchParams()
  // FR-RESULT-13: warn for outdoor stops when rain is likely.
  const rainy = Boolean(place.outdoor) && (stop.rainChancePct ?? 0) >= 50
  const openMoment = (id: string) =>
    setParams((p) => {
      p.set('m', id)
      return p
    })

  return (
    <li className="flex gap-3">
      <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display font-bold text-accent-ink shadow-[0_6px_16px_-6px_var(--accent)] ring-4 ring-bg">
        {stop.position}
      </span>
      <div className="mb-1 flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
        <div className="flex gap-3">
          {place.photoUrl ? (
            <img src={place.photoUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover sm:size-24" />
          ) : (
            <span className="grid size-20 shrink-0 place-items-center rounded-xl sm:size-24 bg-gradient-to-br from-brand-soft to-accent-soft text-brand dark:text-ink">
              <KindIcon className="size-6" aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted">
              {clockTime(stop.arriveAt)} – {clockTime(stop.departAt)} · {kindLabel}
            </p>
            {linked ? (
              <Link to={`/places/${place.id}`} className="block truncate font-display text-lg font-bold hover:underline">
                {place.name}
              </Link>
            ) : (
              <p className="truncate font-display text-lg font-bold">{place.name}</p>
            )}
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              {place.rating !== null && (
                <span className="flex items-center gap-0.5">
                  <Star className="size-3.5 fill-warn text-warn" aria-hidden />
                  {place.rating.toFixed(1)} ({place.reviewCount})
                </span>
              )}
              {price && <span>{price}</span>}
              <span className="font-medium text-ink">est. {money(stop.estCostCents)}</span>
            </p>
          </div>
        </div>

        {(friendSignal || place.hiddenGem || place.reservable || rainy) && (
          <div className="flex flex-wrap gap-1.5">
            {friendSignal && linked && (
              <button type="button" onClick={() => openMoment(friendSignal.momentId)} className="rounded-full" aria-label={`Open ${friendSignal.name}'s Moment`}>
                <Badge tone="brand" className="hover:underline">
                  <UsersRound className="size-3" aria-hidden />
                  Visited by {friendSignal.name} · {friendSignal.rating}/5 · spent {money(friendSignal.spentCents, { whole: true })}
                </Badge>
              </button>
            )}
            {rainy && (
              <Badge tone="warn">
                <CloudRain className="size-3" aria-hidden />
                Rain likely ({stop.rainChancePct}%)
              </Badge>
            )}
            {place.hiddenGem && (
              <Badge tone="good">
                <Gem className="size-3" aria-hidden />
                Hidden gem
              </Badge>
            )}
            {place.reservable && (
              <Badge tone="warn">
                <CalendarCheck className="size-3" aria-hidden />
                Reservation recommended
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <a href={place.mapsUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="secondary" icon={<Navigation className="size-4" aria-hidden />}>
              Directions
            </Button>
          </a>
          {place.website && (
            <a href={place.website} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary" icon={<ExternalLink className="size-4" aria-hidden />}>
                Website
              </Button>
            </a>
          )}
          {onSwap && (
            <Button
              size="sm"
              variant="ghost"
              loading={swapping}
              onClick={() => onSwap(stop.position)}
              icon={<Repeat2 className="size-4" aria-hidden />}
            >
              Swap
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

function minus(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() - minutes * 60_000).toISOString()
}

function plus(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}
