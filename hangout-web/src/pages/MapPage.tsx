import { ArrowRight, MapPinOff, Star } from 'lucide-react'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMapPins } from '@/api/social'
import { Button, Card, Chip, Skeleton } from '@/design'
import type { PlacePins } from '@/features/map/MomentsMap'
import { MomentDialog, useMomentParam } from '@/features/moments/MomentDialog'
import { KIND } from '@/features/plans/labels'

const MomentsMap = lazy(() => import('@/features/map/MomentsMap'))

/** Demo city center (East Village, New York). */
const CENTER: [number, number] = [40.7255, -73.9875]

type Filter = 'ALL' | 'FRIENDS' | 'SHARED'

/** Pins for friends' Moments and Moments shared to place pages; tap → place card (FR-MAP-2). */
export default function MapPage() {
  const [bbox, setBbox] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selected, setSelected] = useState<string | null>(null)
  const { data: pins = [], isFetching, isError } = useMapPins(bbox)
  const { open } = useMomentParam()
  const onBounds = useCallback((b: string) => setBbox(b), [])

  const groups = useMemo<PlacePins[]>(() => {
    const byPlace = new Map<string, PlacePins>()
    for (const p of pins) {
      if (filter === 'FRIENDS' && !p.fromFriend) continue
      if (filter === 'SHARED' && p.fromFriend) continue
      const g = byPlace.get(p.place.id) ?? { placeId: p.place.id, pins: [] }
      g.pins.push(p)
      byPlace.set(p.place.id, g)
    }
    return [...byPlace.values()]
  }, [pins, filter])

  const current = groups.find((g) => g.placeId === selected)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold md:text-5xl">Map</h1>
          <p className="text-muted">Where friends went, and Moments people shared to place pages.</p>
        </div>
        <div role="radiogroup" aria-label="Show" className="flex gap-2">
          {(
            [
              ['ALL', 'All'],
              ['FRIENDS', 'Friends'],
              ['SHARED', 'Shared'],
            ] as [Filter, string][]
          ).map(([v, label]) => (
            <Chip key={v} role="radio" aria-checked={filter === v} selected={filter === v} onClick={() => setFilter(v)} className="h-9">
              {label}
            </Chip>
          ))}
        </div>
      </header>

      <div className="relative h-[calc(100dvh-16rem)] min-h-[420px] overflow-hidden rounded-card border border-line md:h-[calc(100dvh-14rem)]">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <MomentsMap groups={groups} selected={selected} onSelect={setSelected} onBounds={onBounds} center={CENTER} />
        </Suspense>

        <div className="pointer-events-none absolute top-3 left-1/2 z-[500] -translate-x-1/2">
          {isError ? (
            <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-bad shadow-card">Couldn't load pins</span>
          ) : isFetching ? (
            <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold shadow-card">Loading…</span>
          ) : groups.length === 0 && bbox ? (
            <span className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold shadow-card">
              <MapPinOff className="size-3.5" aria-hidden /> No Moments here. Zoom out or move the map.
            </span>
          ) : null}
        </div>

        {current && <PlaceCard group={current} onOpen={open} />}
      </div>
      <MomentDialog />
    </div>
  )
}

function PlaceCard({ group, onOpen }: { group: PlacePins; onOpen: (id: string) => void }) {
  const { place } = group.pins[0]
  const avg = group.pins.reduce((s, p) => s + p.rating, 0) / group.pins.length
  const { icon: Icon, label } = KIND[place.kind]

  return (
    <Card className="absolute inset-x-3 bottom-3 z-[500] flex flex-col gap-3 p-4 sm:right-auto sm:w-96">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{place.name}</p>
          <p className="flex items-center gap-1 text-sm text-muted">
            {label} · <Star className="size-3.5 fill-warn text-warn" aria-hidden /> {avg.toFixed(1)} from {group.pins.length} Moment
            {group.pins.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {group.pins.map((p) => (
          <li key={p.momentId} className="shrink-0">
            <button type="button" onClick={() => onOpen(p.momentId)} className="flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 text-sm font-medium hover:bg-surface-2">
              {p.photo ? <img src={p.photo} alt="" className="size-7 rounded-full object-cover" /> : <span className="size-7 rounded-full bg-surface-2" />}
              {p.authorName} · {p.rating}/5
            </button>
          </li>
        ))}
      </ul>
      <Link to={`/places/${place.id}`}>
        <Button size="sm" variant="secondary" className="w-full" icon={<ArrowRight className="size-4" aria-hidden />}>
          Open place
        </Button>
      </Link>
    </Card>
  )
}
