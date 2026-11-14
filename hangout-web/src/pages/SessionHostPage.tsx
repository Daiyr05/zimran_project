import { Sparkles, Trophy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useSearchResult } from '@/api/hooks'
import { useSavedPlans } from '@/api/social'
import { useCloseVoting, useCreateSession, useGenerate, usePutVotes, useSession } from '@/api/sessions'
import { Button, Card, Skeleton } from '@/design'
import { FinalPlan } from '@/features/session/FinalPlan'
import { MemberList } from '@/features/session/MemberList'
import { SessionProblem } from '@/features/session/SessionProblem'
import { ShareCard } from '@/features/session/ShareCard'
import { Steps } from '@/features/session/Steps'
import { VotePanel } from '@/features/session/VotePanel'

/** Route: /s/:code/host. "new" creates a session from a search, then redirects. */
export default function SessionHostPage() {
  const { code = '' } = useParams()
  return code === 'new' ? <CreateSession /> : <HostSession code={code} />
}

/** Creates the session from the organizer's search inputs (FR-INVITE-1). */
function CreateSession() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const planId = params.get('plan')
  const { data: search, isLoading: searchLoading } = useSearchResult(params.get('search') ?? '')
  // From a saved plan (/plan/:planId): reuse the inputs of the search it came from.
  const saved = useSavedPlans()
  const inputs = planId ? saved.data?.find((s) => s.plan.id === planId)?.inputs : search?.request
  const isLoading = planId ? saved.isLoading : searchLoading
  const create = useCreateSession()
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !inputs) return
    started.current = true
    create
      .mutateAsync(inputs)
      .then(({ code }) => navigate(`/s/${code}/host`, { replace: true }))
      .catch((e) => toast.error(e instanceof ApiError ? e.message : 'Could not create the invite.'))
  }, [inputs, create, navigate])

  if (!isLoading && !inputs) {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Start with a search</h1>
        <p className="text-muted">Pick your time, budget and mood first. Then invite others to add theirs and vote.</p>
        <Link to="/plan">
          <Button>Plan tonight</Button>
        </Link>
      </Card>
    )
  }
  return <HostSkeleton label="Creating your invite…" />
}

function HostSession({ code }: { code: string }) {
  const { data: session, error, refetch, isLoading } = useSession(code)
  const generate = useGenerate(code)
  const vote = usePutVotes(code, false)
  const close = useCloseVoting(code)

  if (isLoading) return <HostSkeleton />
  if (error || !session) return <SessionProblem error={error} onRetry={() => refetch()} />

  const link = `${window.location.origin}/s/${code}`
  const answered = session.members.filter((m) => m.hasAnswered).length
  const voted = session.members.filter((m) => m.hasVoted).length

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    try {
      await fn()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : fallback)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold md:text-5xl">
          {session.status === 'CLOSED' ? 'Your plan is set' : session.status === 'GENERATED' ? 'Time to vote' : 'Invite and decide'}
        </h1>
        <Steps status={session.status} />
      </header>

      {session.status === 'OPEN' && (
        <div className="grid gap-6 md:grid-cols-2">
          <ShareCard link={link} code={code} />
          <div className="flex flex-col gap-4">
            <MemberList session={session} />
            <Button
              size="lg"
              variant={answered === session.members.length ? 'accent' : 'primary'}
              loading={generate.isPending}
              icon={<Sparkles className="size-5" aria-hidden />}
              onClick={() => run(() => generate.mutateAsync(undefined), 'Could not generate plans.')}
            >
              {answered === session.members.length ? 'Build our 3 plans' : `Build plans now (${answered} of ${session.members.length} ready)`}
            </Button>
            <p className="text-center text-sm text-muted">Plans use everyone's shared mood, the shortest time and the lowest budget.</p>
          </div>
        </div>
      )}

      {session.status === 'GENERATED' && (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <VotePanel
            session={session}
            saving={vote.isPending}
            onVote={(votes) => run(() => vote.mutateAsync({ votes }).then(() => toast.success('Votes sent')), 'Could not send votes.')}
          />
          <div className="flex flex-col gap-4 md:sticky md:top-24 md:self-start">
            <MemberList session={session} />
            <Button
              size="lg"
              variant={voted === session.members.length ? 'accent' : 'secondary'}
              loading={close.isPending}
              disabled={voted === 0}
              icon={<Trophy className="size-5" aria-hidden />}
              onClick={() => run(() => close.mutateAsync(undefined), 'Could not close voting.')}
            >
              {voted === session.members.length ? 'Pick the winner' : 'Close voting early'}
            </Button>
            <p className="text-center text-sm text-muted">Most likes wins. A tie goes to your pick.</p>
          </div>
        </div>
      )}

      {session.status === 'CLOSED' && <FinalPlan session={session} asGuest={false} />}
    </div>
  )
}

function HostSkeleton({ label }: { label?: string }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6" aria-busy>
      {label && <p className="font-display text-2xl font-bold">{label}</p>}
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
      </div>
    </div>
  )
}
