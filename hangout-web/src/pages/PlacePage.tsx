import { CalendarHeart, Clock, ExternalLink, Gem, MapPin, MapPinOff, Navigation, Phone, Star, Users } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { usePlace } from '@/api/social'
import type { Moment } from '@/api/types'
import { Badge, Button, Card, EmptyState, Skeleton } from '@/design'
import { MomentCard } from '@/features/moments/MomentCard'
import { PhotoCarousel } from '@/features/moments/PhotoCarousel'
import { KIND, priceSigns } from '@/features/plans/labels'
import { cn } from '@/lib/cn'
import { config } from '@/lib/config'

const PlaceMiniMap = lazy(() => import('@/features/map/PlaceMiniMap'))

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Index 0–6 (Monday first) of today in the demo city. */
function todayIndex() {
  const wd = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: config.timeZone }).format(new Date())
  return DAYS.indexOf(wd)
}

/** Name, photos, hours, price, rating, friends' and shared Moments, "Plan with this place" (FR-MAP-3). */
export default function PlacePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: place, isLoading, error, refetch } = usePlace(id)

  if (isLoading) return <Skeleton className="mx-auto h-[36rem] max-w-4xl" />
  if (error || !place) {
    const missing = error instanceof ApiError && error.status === 404
    return (
      <EmptyState
        icon={<MapPinOff className="size-6" aria-hidden />}
        title={missing ? "We couldn't find this place" : "Couldn't load this place"}
        action={!missing && <Button onClick={() => refetch()}>Try again</Button>}
      />
    )
  }

  const { icon: KindIcon, label: kindLabel } = KIND[place.kind]
  const price = priceSigns(place.priceLevel)
  const today = todayIndex()
  const planWith = () => navigate(`/plan?${new URLSearchParams({ includePlaceId: place.id, includePlaceName: place.name })}`)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-28 md:pb-0">
      {place.photos.length > 0 ? (
        <PhotoCarousel photos={place.photos} alt={place.name} aspect="aspect-[4/3] md:aspect-[5/2]" />
      ) : (
        <div className="grid aspect-[3/1] place-items-center rounded-card bg-gradient-to-br from-brand-soft to-accent-soft text-brand dark:text-ink">
          <KindIcon className="size-12" aria-hidden />
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-muted">{kindLabel}</p>
            <h1 className="text-4xl leading-tight font-extrabold md:text-5xl">{place.name}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
              {place.rating !== null && (
                <span className="flex items-center gap-1 font-semibold text-ink">
                  <Star className="size-4 fill-warn text-warn" aria-hidden />
                  {place.rating.toFixed(1)} <span className="font-normal text-muted">({place.reviewCount.toLocaleString('en-US')})</span>
                </span>
              )}
              {price && <span>{price}</span>}
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {place.address}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {place.hiddenGem && (
                <Badge tone="good">
                  <Gem className="size-3" aria-hidden /> Hidden gem
                </Badge>
              )}
              {place.reservable && <Badge tone="warn">Takes reservations</Badge>}
              {place.outdoor && <Badge>Outdoor</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="accent" size="lg" icon={<CalendarHeart className="size-5" aria-hidden />} onClick={planWith} className="hidden md:inline-flex">
              Plan with this place
            </Button>
            <a href={place.mapsUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary" icon={<Navigation className="size-4" aria-hidden />}>
                Directions
              </Button>
            </a>
            {place.phone && (
              <a href={`tel:${place.phone.replace(/[^\d+]/g, '')}`}>
                <Button variant="secondary" icon={<Phone className="size-4" aria-hidden />}>
                  Call
                </Button>
              </a>
            )}
            {place.website && (
              <a href={place.website} target="_blank" rel="noreferrer">
                <Button variant="secondary" icon={<ExternalLink className="size-4" aria-hidden />}>
                  Website
                </Button>
              </a>
            )}
          </div>

          <MomentSection
            title="Friends who went"
            icon={<Users className="size-5" aria-hidden />}
            moments={place.friendsMoments}
            empty="None of your friends have posted about this place yet."
          />
          <MomentSection
            title="Shared by others"
            moments={place.sharedMoments}
            empty="No one has shared a Moment here yet."
          />
        </div>

        <aside className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
          <div className="h-48 overflow-hidden rounded-card border border-line">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <PlaceMiniMap lat={place.lat} lng={place.lng} name={place.name} />
            </Suspense>
          </div>
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Clock className="size-5" aria-hidden /> Hours
            </h2>
            <dl className="flex flex-col gap-1 text-sm">
              {place.hours.map((h, i) => (
                <div key={DAYS[i]} className={cn('flex justify-between gap-4', i === today ? 'font-semibold text-ink' : 'text-muted')}>
                  <dt>{DAYS[i]}{i === today && ' (today)'}</dt>
                  <dd>{h}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Button size="lg" variant="accent" className="w-full" icon={<CalendarHeart className="size-5" aria-hidden />} onClick={planWith}>
          Plan with this place
        </Button>
      </div>
    </div>
  )
}

function MomentSection({ title, icon, moments, empty }: { title: string; icon?: React.ReactNode; moments: Moment[]; empty: string }) {
  return (
    <section className="mt-4 flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        {icon}
        {title} <span className="text-base font-semibold text-muted">{moments.length}</span>
      </h2>
      {moments.length === 0 ? (
        <p className="text-sm text-muted">
          {empty}{' '}
          <Link to="/moments/new" className="font-semibold text-brand dark:text-ink">
            Post one
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {moments.map((m) => (
            <li key={m.id}>
              <MomentCard moment={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
