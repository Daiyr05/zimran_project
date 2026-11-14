import { Check, Copy, Loader2, Search, Share2, Tag, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useMe } from '@/api/hooks'
import { useAnswerRequest, useAnswerTag, useFriends, useSendRequest, useUserSearch } from '@/api/social'
import type { UserSummary } from '@/api/types'
import { Avatar, Button, Card, EmptyState, Input, Skeleton } from '@/design'
import { FriendButton } from '@/features/social/FriendButton'

function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const fail = (e: unknown, fallback: string) => toast.error(e instanceof ApiError ? e.message : fallback)

/** Search by username, requests, list, personal invite link (FR-SOCIAL-1, 2, 5; FR-MOMENT-7 tags). */
export default function FriendsPage() {
  const { data: me } = useMe()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const term = useDebounced(q)
  const results = useUserSearch(term)
  const { data, isLoading, error, refetch } = useFriends()
  const answer = useAnswerRequest()
  const tag = useAnswerTag()
  const add = params.get('add')

  const inviteLink = me ? `${location.origin}/friends?add=${me.username}` : ''

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Add me on Hangout', text: 'Plan nights out with me on Hangout', url: inviteLink })
      else {
        await navigator.clipboard.writeText(inviteLink)
        toast.success('Invite link copied')
      }
    } catch {
      /* share sheet closed */
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold md:text-5xl">Friends</h1>
        <p className="text-muted">Friends see your Moments, and their visits show up in your plans.</p>
      </header>

      {add && me && add !== me.username && <AddFromLink username={add} onDone={() => setParams({}, { replace: true })} />}

      <Card className="flex flex-col gap-3 p-5">
        <p className="font-display text-lg font-bold">Your invite link</p>
        <p className="text-sm text-muted">Anyone who opens it can add you in one tap.</p>
        <div className="flex gap-2">
          <Input readOnly value={inviteLink} aria-label="Your invite link" onFocus={(e) => e.target.select()} className="text-sm" />
          <Button variant="accent" icon={typeof navigator.share === 'function' ? <Share2 className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} onClick={share} className="shrink-0">
            {typeof navigator.share === 'function' ? 'Share' : 'Copy'}
          </Button>
        </div>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="find-h">
        <h2 id="find-h" className="font-display text-xl font-bold">
          Find people
        </h2>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or name" aria-label="Search people" className="pl-10" />
          {results.isFetching && <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />}
        </div>
        {term.trim().length >= 2 && results.data && (
          <ul className="flex flex-col gap-2">
            {results.data.length === 0 && <li className="text-sm text-muted">No one matches "{term}".</li>}
            {results.data
              .filter((u) => u.id !== me?.id)
              .map((u) => (
                <PersonRow key={u.id} user={u}>
                  <FriendButton user={u} friendship={u.friendship} requestId={data?.incoming.find((r) => r.user.id === u.id)?.id ?? data?.outgoing.find((r) => r.user.id === u.id)?.id} size="sm" />
                </PersonRow>
              ))}
          </ul>
        )}
      </section>

      {isLoading ? (
        <Skeleton className="h-48" />
      ) : error || !data ? (
        <EmptyState icon={<Users className="size-6" aria-hidden />} title="Couldn't load friends" action={<Button onClick={() => refetch()}>Try again</Button>} />
      ) : (
        <>
          {data.incoming.length > 0 && (
            <Group title="Requests" count={data.incoming.length}>
              {data.incoming.map((r) => (
                <PersonRow key={r.id} user={r.user}>
                  <div className="flex gap-2">
                    <Button size="sm" icon={<Check className="size-4" aria-hidden />} loading={answer.isPending && answer.variables?.id === r.id && answer.variables.accept} onClick={() => answer.mutateAsync({ id: r.id, accept: true }).then(() => toast.success(`You and ${r.user.name} are friends`), (e) => fail(e, 'Could not accept.'))}>
                      Accept
                    </Button>
                    <Button size="sm" variant="secondary" aria-label={`Decline ${r.user.name}`} loading={answer.isPending && answer.variables?.id === r.id && !answer.variables.accept} onClick={() => answer.mutateAsync({ id: r.id, accept: false }).catch((e) => fail(e, 'Could not decline.'))}>
                      <X className="size-4" aria-hidden />
                    </Button>
                  </div>
                </PersonRow>
              ))}
            </Group>
          )}

          {data.tagRequests.length > 0 && (
            <Group title="Tagged you" count={data.tagRequests.length}>
              {data.tagRequests.map((t) => (
                <li key={t.momentId}>
                  <Card className="flex items-center gap-3 p-3">
                    <Tag className="size-5 shrink-0 text-accent" aria-hidden />
                    <p className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{t.by.name}</span> says you were with them at <span className="font-semibold">{t.placeName}</span>
                    </p>
                    <Button size="sm" onClick={() => tag.mutateAsync({ momentId: t.momentId, approve: true }).then(() => toast.success('Your name now shows on that Moment'), (e) => fail(e, 'Could not approve.'))}>
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" aria-label="Decline tag" onClick={() => tag.mutateAsync({ momentId: t.momentId, approve: false }).catch((e) => fail(e, 'Could not decline.'))}>
                      <X className="size-4" aria-hidden />
                    </Button>
                  </Card>
                </li>
              ))}
            </Group>
          )}

          <Group title="Your friends" count={data.friends.length}>
            {data.friends.length === 0 ? (
              <EmptyState icon={<UserPlus className="size-6" aria-hidden />} title="No friends yet">
                Share your invite link above, or search for people you go out with.
              </EmptyState>
            ) : (
              data.friends.map((f) => (
                <PersonRow key={f.id} user={f}>
                  <FriendButton user={f} friendship="FRIENDS" size="sm" />
                </PersonRow>
              ))
            )}
          </Group>

          {data.outgoing.length > 0 && (
            <Group title="Sent" count={data.outgoing.length}>
              {data.outgoing.map((r) => (
                <PersonRow key={r.id} user={r.user}>
                  <FriendButton user={r.user} friendship="REQUEST_SENT" requestId={r.id} size="sm" />
                </PersonRow>
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  )
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold">
        {title} <span className="text-base font-semibold text-muted">{count}</span>
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

function PersonRow({ user, children }: { user: UserSummary; children: React.ReactNode }) {
  return (
    <li>
      <Card className="flex items-center gap-3 p-3">
        <Link to={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={user.name} src={user.photoUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted">@{user.username}</p>
          </div>
        </Link>
        {children}
      </Card>
    </li>
  )
}

/** Opened from someone's personal invite link: /friends?add=<username>. */
function AddFromLink({ username, onDone }: { username: string; onDone: () => void }) {
  const send = useSendRequest()
  return (
    <Card className="flex flex-col gap-3 border-accent/40 p-5 sm:flex-row sm:items-center">
      <UserPlus className="size-8 shrink-0 text-accent" aria-hidden />
      <p className="flex-1">
        Add <span className="font-semibold">@{username}</span> as a friend?
      </p>
      <div className="flex gap-2">
        <Button
          loading={send.isPending}
          onClick={() =>
            send.mutateAsync(username).then(
              () => {
                toast.success(`Request sent to @${username}`)
                onDone()
              },
              (e) => fail(e, 'Could not send the request.'),
            )
          }
        >
          Send request
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Not now
        </Button>
      </div>
    </Card>
  )
}
