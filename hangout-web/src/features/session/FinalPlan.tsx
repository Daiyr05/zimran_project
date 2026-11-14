import { motion } from 'framer-motion'
import { CalendarPlus, PartyPopper } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { downloadCalendar } from '@/api/sessions'
import type { Session } from '@/api/types'
import { Button, Card, Skeleton } from '@/design'
import { MomentDialog } from '@/features/moments/MomentDialog'
import { recordOuting } from '@/features/moments/outings'
import { CostBreakdown } from '@/features/plans/CostBreakdown'
import { shapeLabel } from '@/features/plans/labels'
import { Timeline } from '@/features/plans/Timeline'

const PlanMap = lazy(() => import('@/features/plans/PlanMap'))

/** The winning plan, shared to everyone, with a calendar file (FR-INVITE-7, FR-INVITE-8). */
export function FinalPlan({ session, asGuest }: { session: Session; asGuest: boolean }) {
  const plan = session.plans?.find((p) => p.id === session.winningPlanId)
  const [downloading, setDownloading] = useState(false)
  // Remember the outing so the app can ask "How was it?" once it ends (FR-MOMENT-6).
  useEffect(() => {
    if (plan) recordOuting(session.code, plan)
  }, [plan, session.code])
  if (!plan || !session.start) return null
  const likes = session.likes[plan.id] ?? 0

  const addToCalendar = async () => {
    setDownloading(true)
    try {
      await downloadCalendar(session.code, asGuest)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the calendar file.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="flex flex-col gap-3 bg-ink p-6 text-bg">
          <PartyPopper className="size-8 text-accent" aria-hidden />
          <p className="text-sm font-semibold opacity-80">
            It's decided · {likes} of {session.members.length} liked it
          </p>
          <h2 className="font-display text-3xl font-extrabold">{shapeLabel(plan)}</h2>
          <Button
            variant="accent"
            className="self-start"
            loading={downloading}
            onClick={addToCalendar}
            icon={<CalendarPlus className="size-4" aria-hidden />}
          >
            Add to calendar
          </Button>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
        <Timeline plan={plan} startLabel={session.start.label} linked={!asGuest} />
        <div className="flex flex-col gap-6">
          <div className="h-60 overflow-hidden rounded-card border border-line">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <PlanMap plan={plan} start={session.start} />
            </Suspense>
          </div>
          <CostBreakdown plan={plan} partySize={session.partySize} />
        </div>
      </div>
      {!asGuest && <MomentDialog />}
    </div>
  )
}
