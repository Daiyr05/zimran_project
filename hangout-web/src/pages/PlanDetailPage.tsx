import { ArrowLeft, Bookmark, Check, Send } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useSavedPlans, useSwapSaved } from '@/api/social'
import { Button, Card, EmptyState, Skeleton } from '@/design'
import { MomentDialog } from '@/features/moments/MomentDialog'
import { CostBreakdown } from '@/features/plans/CostBreakdown'
import { shapeLabel } from '@/features/plans/labels'
import { Timeline } from '@/features/plans/Timeline'
import { duration, money } from '@/lib/format'

const PlanMap = lazy(() => import('@/features/plans/PlanMap'))

/** A saved plan on its own page: timeline, cost, map, swap, invite, links out (FR-RESULT-2 to 14). */
export default function PlanDetailPage() {
  const { planId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useSavedPlans()
  const swap = useSwapSaved()
  const saved = data?.find((s) => s.plan.id === planId)

  if (isLoading) return <Skeleton className="mx-auto h-[36rem] max-w-5xl" />
  if (error)
    return <EmptyState icon={<Bookmark className="size-6" aria-hidden />} title="Couldn't load this plan" action={<Button onClick={() => refetch()}>Try again</Button>} />
  if (!saved)
    return (
      <EmptyState
        icon={<Bookmark className="size-6" aria-hidden />}
        title="This plan isn't saved"
        action={
          <Link to="/me">
            <Button variant="secondary">See saved plans</Button>
          </Link>
        }
      >
        Only saved plans have their own page. Plans from a search live on the results screen.
      </EmptyState>
    )

  const { plan, start, partySize } = saved
  const onSwap = async (position: number) => {
    try {
      await swap.mutateAsync({ planId: plan.id, position })
      toast.success(`Stop ${position} swapped`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not swap this stop.')
    }
  }
  const invite = () => navigate(`/s/new/host?plan=${plan.id}`)

  return (
    <div className="flex flex-col gap-8 pb-32 md:pb-10">
      <header className="flex flex-col gap-3">
        <Link to="/me" className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Saved plans
        </Link>
        <h1 className="text-4xl font-extrabold md:text-5xl">{shapeLabel(plan)}</h1>
        <p className="text-muted">
          From {start.label} · {duration(plan.totalMinutes)} ·{' '}
          {partySize > 1 ? `${money(plan.perPersonCents)} each` : `${money(plan.totalCents)} all-in`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          {plan.reasons.length > 0 && (
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="text-xl font-bold">Why this plan</h2>
              <ul className="flex flex-col gap-2">
                {plan.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Your night, step by step</h2>
            <Timeline plan={plan} startLabel={start.label} onSwap={onSwap} swappingPosition={swap.isPending ? (swap.variables?.position ?? null) : null} />
          </div>
        </div>
        <aside className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
          <div className="h-64 overflow-hidden rounded-card border border-line md:h-72">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <PlanMap plan={plan} start={start} />
            </Suspense>
          </div>
          <CostBreakdown plan={plan} partySize={partySize} />
          <Button size="lg" variant="accent" className="hidden md:inline-flex" icon={<Send className="size-5" aria-hidden />} onClick={invite}>
            Invite to vote
          </Button>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <Button size="lg" variant="accent" className="w-full" icon={<Send className="size-5" aria-hidden />} onClick={invite}>
          Invite to vote
        </Button>
      </div>
      <MomentDialog />
    </div>
  )
}
