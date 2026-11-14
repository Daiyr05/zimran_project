import { Camera, Loader2, Plus, RefreshCw, UserPlus, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useFeed, useFriends } from '@/api/social'
import { Avatar, Button, EmptyState, Skeleton } from '@/design'
import { MomentCard } from '@/features/moments/MomentCard'

/** Friends' Moments, newest first, 20 per page (FR-SOCIAL-6). */
export default function FeedPage() {
  const feed = useFeed()
  const { data: friends } = useFriends()
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed

  // Load the next page when the end of the list scrolls into view.
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !isFetchingNextPage && fetchNextPage(), { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const moments = feed.data?.pages.flatMap((p) => p.items) ?? []
  const pending = (friends?.incoming.length ?? 0) + (friends?.tagRequests.length ?? 0)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">Feed</p>
          <h1 className="text-4xl font-extrabold md:text-5xl">Friends' Moments</h1>
          <p className="text-muted">Where your friends went, what they paid, and if it was worth it.</p>
        </div>
        <Link to="/moments/new" className="hidden md:block">
          <Button variant="accent" icon={<Camera className="size-4" aria-hidden />}>
            Post a Moment
          </Button>
        </Link>
      </header>

      {/* Your people at a glance: tap a face to see where they've been. */}
      {friends && friends.friends.length > 0 && (
        <nav aria-label="Your friends" className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <Link to="/moments/new" className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs font-semibold">
            <span className="grid size-14 place-items-center rounded-full border-2 border-dashed border-accent text-accent">
              <Plus className="size-6" aria-hidden />
            </span>
            Post
          </Link>
          {friends.friends.map((f) => (
            <Link key={f.id} to={`/u/${f.username}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs font-medium">
              <span className="rounded-full bg-gradient-to-tr from-accent to-brand p-[2px]">
                <span className="block rounded-full bg-bg p-[2px]">
                  <Avatar name={f.name} src={f.photoUrl} className="size-12" />
                </span>
              </span>
              <span className="w-full truncate text-center">{f.name}</span>
            </Link>
          ))}
          <Link to="/friends" className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs font-medium text-muted">
            <span className="grid size-14 place-items-center rounded-full bg-surface-2">
              <UserPlus className="size-5" aria-hidden />
            </span>
            Add
          </Link>
        </nav>
      )}

      {pending > 0 && (
        <Link to="/friends" className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm font-semibold">
          <Users className="size-5 shrink-0" aria-hidden />
          {pending} {pending === 1 ? 'request needs' : 'requests need'} your answer
        </Link>
      )}

      {feed.isLoading ? (
        <div className="flex flex-col gap-6" aria-busy>
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-[30rem]" />
          ))}
        </div>
      ) : feed.isError ? (
        <EmptyState
          icon={<RefreshCw className="size-6" aria-hidden />}
          title="Couldn't load the feed"
          action={<Button onClick={() => feed.refetch()}>Try again</Button>}
        >
          {feed.error.message}
        </EmptyState>
      ) : moments.length === 0 ? (
        friends && friends.friends.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="size-6" aria-hidden />}
            title="Add friends to fill your feed"
            action={
              <Link to="/friends">
                <Button>Find friends</Button>
              </Link>
            }
          >
            Moments from friends show up here, newest first. Send your invite link to the people you go out with.
          </EmptyState>
        ) : (
          <EmptyState
            icon={<Camera className="size-6" aria-hidden />}
            title="No Moments yet"
            action={
              <Link to="/moments/new">
                <Button variant="accent">Post your first Moment</Button>
              </Link>
            }
          >
            Your friends haven't posted yet. Start them off with yours.
          </EmptyState>
        )
      ) : (
        <ul className="flex flex-col gap-6">
          {moments.map((m) => (
            <li key={m.id}>
              <MomentCard moment={m} />
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinel} />
      {isFetchingNextPage && <Loader2 className="mx-auto size-6 animate-spin text-muted" aria-label="Loading more" />}
      {hasNextPage && !isFetchingNextPage && (
        <Button variant="secondary" className="self-center" onClick={() => fetchNextPage()}>
          Load more
        </Button>
      )}
      {!hasNextPage && moments.length > 0 && <p className="pb-4 text-center text-sm text-muted">You're all caught up.</p>}
    </div>
  )
}
