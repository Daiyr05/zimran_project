import { Bookmark, Camera, Lock, MapPin, Settings, Share2, Star, UserRoundX, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useMe } from '@/api/hooks'
import { useProfile, useSavedPlans } from '@/api/social'
import type { Moment } from '@/api/types'
import { Avatar, Badge, Button, Card, EmptyState, Skeleton } from '@/design'
import { MomentDialog, useMomentParam } from '@/features/moments/MomentDialog'
import { shapeLabel, stopsOf } from '@/features/plans/labels'
import { FriendButton } from '@/features/social/FriendButton'
import { cn } from '@/lib/cn'
import { duration, money } from '@/lib/format'

/** /me and /u/:username: header + Moments only (FR-SOCIAL-3); saved plans on your own (FR-RESULT-12). */
export default function ProfilePage() {
  const params = useParams()
  const { data: me } = useMe()
  const username = params.username ?? me?.username
  const isMe = Boolean(me && username === me.username)
  const { data: profile, isLoading, error, refetch } = useProfile(username)
  const [tab, setTab] = useState<'moments' | 'saved'>('moments')

  if (isLoading || !username) return <ProfileSkeleton />
  if (error || !profile) {
    const missing = error instanceof ApiError && error.status === 404
    return (
      <EmptyState
        icon={<UserRoundX className="size-6" aria-hidden />}
        title={missing ? "We couldn't find that person" : "Couldn't load this profile"}
        action={missing ? <Link to="/friends"><Button variant="secondary">Find friends</Button></Link> : <Button onClick={() => refetch()}>Try again</Button>}
      >
        {missing ? 'Check the username and try again.' : error?.message}
      </EmptyState>
    )
  }

  const { user } = profile
  const shareProfile = async () => {
    const link = `${location.origin}/friends?add=${user.username}`
    try {
      if (navigator.share) await navigator.share({ title: 'Add me on Hangout', url: link })
      else {
        await navigator.clipboard.writeText(link)
        toast.success('Invite link copied')
      }
    } catch {
      /* share sheet closed */
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={user.name} src={user.photoUrl} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-3xl font-extrabold">{user.name}</h1>
          <p className="text-muted">
            @{user.username} · <MapPin className="inline size-3.5" aria-hidden /> {user.homeCity}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 text-sm">
            <Stat label="places visited" value={profile.placesVisited} />
            <Stat label={profile.friendsCount === 1 ? 'friend' : 'friends'} value={profile.friendsCount} />
            {profile.moments && <Stat label={profile.moments.length === 1 ? 'Moment' : 'Moments'} value={profile.moments.length} />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          {isMe ? (
            <>
              <Link to="/settings">
                <Button size="sm" variant="secondary" icon={<Settings className="size-4" aria-hidden />}>
                  Edit profile
                </Button>
              </Link>
              <div className="flex gap-2">
                <Link to="/friends">
                  <Button size="sm" variant="ghost" icon={<Users className="size-4" aria-hidden />}>
                    Friends
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" icon={<Share2 className="size-4" aria-hidden />} onClick={shareProfile}>
                  Invite
                </Button>
              </div>
            </>
          ) : (
            <FriendButton user={user} friendship={profile.friendship} requestId={profile.requestId} size="sm" />
          )}
        </div>
      </Card>

      {isMe && (
        <div role="tablist" aria-label="Profile sections" className="flex gap-2">
          <TabButton active={tab === 'moments'} onClick={() => setTab('moments')} icon={<Camera className="size-4" aria-hidden />}>
            Moments
          </TabButton>
          <TabButton active={tab === 'saved'} onClick={() => setTab('saved')} icon={<Bookmark className="size-4" aria-hidden />}>
            Saved plans
          </TabButton>
        </div>
      )}

      {tab === 'saved' && isMe ? (
        <SavedPlans />
      ) : profile.moments === null ? (
        <EmptyState icon={<Lock className="size-6" aria-hidden />} title={`${user.name}'s Moments are for friends`}>
          Add {user.name} as a friend to see where they go.
        </EmptyState>
      ) : profile.moments.length === 0 ? (
        <EmptyState
          icon={<Camera className="size-6" aria-hidden />}
          title={isMe ? 'Post your first Moment' : 'No Moments yet'}
          action={
            isMe && (
              <Link to="/moments/new">
                <Button variant="accent">New Moment</Button>
              </Link>
            )
          }
        >
          {isMe ? 'Share where you went, what it cost and whether you would go again.' : `${user.name} hasn't posted yet.`}
        </EmptyState>
      ) : (
        <MomentGrid moments={profile.moments} />
      )}

      <MomentDialog />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <p className="flex items-baseline gap-1">
      <span className="font-display text-xl font-bold">{value}</span>
      <span className="text-muted">{label}</span>
    </p>
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition',
        active ? 'bg-ink text-bg' : 'bg-surface text-muted hover:text-ink',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/** Square tiles; tap one to open the full Moment. */
function MomentGrid({ moments }: { moments: Moment[] }) {
  const { open } = useMomentParam()
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {moments.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => open(m.id)}
            className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-surface-2 text-left"
          >
            {m.photos[0] && <img src={m.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />}
            <span className="absolute inset-x-0 bottom-0 flex flex-col bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white">
              <span className="truncate text-sm font-semibold">{m.place.name}</span>
              <span className="flex items-center gap-1 text-xs opacity-90">
                <Star className="size-3 fill-current" aria-hidden />
                {m.rating}/5
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function SavedPlans() {
  const { data, isLoading, error, refetch } = useSavedPlans()
  const { data: me } = useMe()
  if (isLoading) return <Skeleton className="h-40" />
  if (error)
    return (
      <EmptyState icon={<Bookmark className="size-6" aria-hidden />} title="Couldn't load saved plans" action={<Button onClick={() => refetch()}>Try again</Button>} />
    )
  if (!data?.length && me?.tier !== 'PLUS')
    return (
      <EmptyState
        icon={<Bookmark className="size-6" aria-hidden />}
        title="Saved plans come with Plus"
        action={
          <Link to="/plus">
            <Button variant="accent">See Plus</Button>
          </Link>
        }
      >
        Keep the plans you like on your profile and invite friends to them later.
      </EmptyState>
    )
  if (!data?.length)
    return (
      <EmptyState
        icon={<Bookmark className="size-6" aria-hidden />}
        title="No saved plans"
        action={
          <Link to="/plan">
            <Button>Plan an outing</Button>
          </Link>
        }
      >
        Tap Save on a plan you like to keep it here.
      </EmptyState>
    )

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {data.map(({ plan, partySize, savedAt }) => (
        <li key={plan.id}>
          <Link to={`/plan/${plan.id}`}>
            <Card className="flex flex-col gap-2 p-5 transition hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold">{shapeLabel(plan)}</h3>
                <Badge>{new Date(savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Badge>
              </div>
              <p className="truncate text-sm text-muted">{stopsOf(plan).map((s) => s.place.name).join(' → ')}</p>
              <p className="text-sm">
                <span className="font-semibold">{money(partySize > 1 ? plan.perPersonCents : plan.totalCents, { whole: true })}</span>
                <span className="text-muted">
                  {partySize > 1 ? ' each' : ' all-in'} · {duration(plan.totalMinutes)}
                </span>
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8" aria-busy>
      <Skeleton className="h-36" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  )
}
