import { Hourglass } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useJoinSession, usePutInputs, usePutVotes, useSession } from '@/api/sessions'
import { Logo } from '@/app/Logo'
import { Button, Card, Field, Input, Skeleton } from '@/design'
import { FinalPlan } from '@/features/session/FinalPlan'
import { MemberList } from '@/features/session/MemberList'
import { PrivateInputsForm } from '@/features/session/PrivateInputsForm'
import { SessionProblem } from '@/features/session/SessionProblem'
import { Steps } from '@/features/session/Steps'
import { VotePanel } from '@/features/session/VotePanel'

/** Invitee flow, no account needed: join → private inputs → wait → vote → final plan (FR-INVITE-2 to 8). */
export default function SessionGuestPage() {
  const { code = '' } = useParams()
  const { data: session, error, isLoading, refetch } = useSession(code, { asGuest: true })
  const join = useJoinSession(code)
  const inputs = usePutInputs(code, true)
  const vote = usePutVotes(code, true)

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    try {
      await fn()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : fallback)
    }
  }

  let body
  if (isLoading) body = <Skeleton className="h-80" />
  else if (error || !session) body = <SessionProblem error={error} onRetry={() => refetch()} />
  else if (session.status === 'CLOSED') body = <FinalPlan session={session} asGuest />
  else if (!session.me)
    body = (
      <JoinCard
        organizer={session.organizerName}
        loading={join.isPending}
        onJoin={(name) => run(() => join.mutateAsync(name), 'Could not join.')}
      />
    )
  else if (session.status === 'OPEN' && !session.me.hasAnswered)
    body = (
      <PrivateInputsForm
        organizerName={session.organizerName}
        loading={inputs.isPending}
        onSubmit={(v) => run(() => inputs.mutateAsync(v), 'Could not send your answers.')}
      />
    )
  else if (session.status === 'OPEN')
    body = (
      <div className="flex flex-col gap-4">
        <Card className="flex items-center gap-4 p-5">
          <Hourglass className="size-8 shrink-0 animate-pulse text-accent" aria-hidden />
          <div>
            <p className="font-display text-xl font-bold">You're in. Hang tight.</p>
            <p className="text-sm text-muted">
              {session.organizerName} will build 3 plans once everyone is ready. This page updates by itself.
            </p>
          </div>
        </Card>
        <MemberList session={session} />
      </div>
    )
  else
    body = (
      <div className="flex flex-col gap-6">
        <VotePanel
          session={session}
          saving={vote.isPending}
          onVote={(votes) => run(() => vote.mutateAsync({ votes }).then(() => toast.success('Votes sent')), 'Could not send votes.')}
        />
        <MemberList session={session} />
      </div>
    )

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-2xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pt-4 pb-16">
        {session && (
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl leading-tight font-extrabold md:text-4xl">
              {session.status === 'CLOSED'
                ? 'The plan is set'
                : session.status === 'GENERATED'
                  ? 'Vote for your favorite'
                  : `${session.organizerName} invited you to plan a night out`}
            </h1>
            <Steps status={session.status} />
          </div>
        )}
        {body}
      </main>
    </div>
  )
}

function JoinCard({ organizer, onJoin, loading }: { organizer: string; onJoin: (name: string) => void; loading: boolean }) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string>()

  return (
    <Card className="flex flex-col gap-5 p-6">
      <p className="text-muted">
        Add your mood, time and budget. {organizer} sees only that you're ready, never your budget. Then vote on 3
        plans. No account needed.
      </p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return setError('Enter a name so others know who voted')
          onJoin(name.trim())
        }}
      >
        <Field label="Your name" htmlFor="guest-name" error={error}>
          <Input
            id="guest-name"
            value={name}
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) => {
              setName(e.target.value)
              setError(undefined)
            }}
          />
        </Field>
        <Button type="submit" size="lg" variant="accent" loading={loading}>
          Join
        </Button>
      </form>
    </Card>
  )
}
