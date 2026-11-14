import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Check, MapPinned, Pencil, Send, Shuffle, Sparkles } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useSavePlan, useSearchResult, useShuffle, useSwapStop } from '@/api/hooks'
import { Button, Card, Skeleton } from '@/design'
import { CostBreakdown } from '@/features/plans/CostBreakdown'
import { PlanCard } from '@/features/plans/PlanCard'
import { Timeline } from '@/features/plans/Timeline'
import { MomentDialog } from '@/features/moments/MomentDialog'

// Leaflet is heavy; load it only when the map is shown.
const PlanMap = lazy(() => import('@/features/plans/PlanMap'))

/** 3 complete plans; pick one to see its timeline, cost and map (SRS FR-RESULT-1 to 14). */
export default function ResultsPage() {
  const { searchId = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: search, isLoading } = useSearchResult(searchId)
  const shuffle = useShuffle(search)
  const swap = useSwapStop(search)
  const save = useSavePlan()
  const [saved, setSaved] = useState<Set<string>>(new Set())

  if (isLoading) return <ResultsSkeleton />

  if (!search) {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
        <MapPinned className="size-10 text-muted" aria-hidden />
        <h1 className="text-2xl font-bold">These plans are no longer here</h1>
        <p className="text-muted">Plans are kept for this browser tab only. Run the search again to get fresh ones.</p>
        <Link to="/plan">
          <Button>Plan again</Button>
        </Link>
      </Card>
    )
  }

  const index = Math.min(Math.max(Number(params.get('p') ?? 1) - 1, 0), search.plans.length - 1)
  const plan = search.plans[index]
  const select = (i: number) => setParams({ p: String(i + 1) }, { replace: true })

  const onShuffle = async () => {
    try {
      await shuffle.mutateAsync()
      select(0)
      toast.success('3 new plans, same inputs')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not shuffle. Try again.')
    }
  }

  const onSwap = async (position: number) => {
    try {
      await swap.mutateAsync({ planId: plan.id, position })
      toast.success(`Stop ${position} swapped`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not swap this stop.')
    }
  }

  const onSave = async () => {
    try {
      await save.mutateAsync(plan.id)
      setSaved((s) => new Set(s).add(plan.id))
      toast.success('Saved to your profile')
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        toast(err.message, { description: 'Saved plans come with Plus.' })
        navigate('/plus')
        return
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not save. Try again.')
    }
  }

  const isSaved = saved.has(plan.id)

  return (
    <div className="flex flex-col gap-8 pb-32 md:pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold tracking-wide text-accent uppercase">Ready for tonight</p>
          <h1 className="text-4xl font-extrabold md:text-5xl">Your 3 plans</h1>
          <p className="text-muted">
            From {search.start.label} · {search.partySize} {search.partySize === 1 ? 'person' : 'people'} · door to door
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<Pencil className="size-4" aria-hidden />} onClick={() => navigate(-1)}>
            Edit search
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={shuffle.isPending}
            icon={<Shuffle className="size-4" aria-hidden />}
            onClick={onShuffle}
          >
            Shuffle
          </Button>
        </div>
      </header>

      {/* Phones: swipe between cards. Desktop: 3 columns. */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0"
        role="group"
        aria-label="Plans"
      >
        {search.plans.map((p, i) => (
          <PlanCard
            key={p.id}
            plan={p}
            index={i}
            selected={i === index}
            partySize={search.partySize}
            onSelect={() => select(i)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={plan.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px]"
          aria-label={`Plan ${plan.rank} details`}
        >
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-3 border-brand/20 bg-gradient-to-br from-brand-soft to-surface p-5">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="size-5 text-brand dark:text-ink" aria-hidden />
                Why plan {plan.rank}
              </h2>
              <ul className="flex flex-col gap-2">
                {plan.reasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex flex-col gap-3">
              <h2 className="text-xl font-bold">Your night, step by step</h2>
              <Timeline
                plan={plan}
                startLabel={search.start.label}
                onSwap={onSwap}
                swappingPosition={swap.isPending ? (swap.variables?.position ?? null) : null}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
            <div className="h-64 overflow-hidden rounded-card border border-line md:h-72">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
                <PlanMap plan={plan} start={search.start} />
              </Suspense>
            </div>
            <CostBreakdown plan={plan} partySize={search.partySize} />
            <div className="hidden flex-col gap-2 md:flex">
              <Button size="lg" variant="accent" icon={<Send className="size-5" aria-hidden />} onClick={() => navigate(`/s/new/host?search=${search.searchId}`)}>
                Invite to vote
              </Button>
              <Button
                variant="secondary"
                loading={save.isPending}
                disabled={isSaved}
                icon={isSaved ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
                onClick={onSave}
              >
                {isSaved ? 'Saved' : 'Save plan'}
              </Button>
            </div>
          </aside>
        </motion.section>
      </AnimatePresence>

      <MomentDialog />

      {/* Phone action bar, above the bottom nav. */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Button
            variant="secondary"
            size="lg"
            loading={save.isPending}
            disabled={isSaved}
            onClick={onSave}
            aria-label={isSaved ? 'Saved' : 'Save plan'}
            icon={isSaved ? <BookmarkCheck className="size-5" aria-hidden /> : <Bookmark className="size-5" aria-hidden />}
          />
          <Button
            size="lg"
            variant="accent"
            className="flex-1"
            icon={<Send className="size-5" aria-hidden />}
            onClick={() => navigate(`/s/new/host?search=${search.searchId}`)}
          >
            Invite to vote on plan {plan.rank}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}
