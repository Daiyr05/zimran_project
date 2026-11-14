import { motion } from 'framer-motion'
import { Clock, Heart, X } from 'lucide-react'
import { useState } from 'react'
import type { Session } from '@/api/types'
import { Badge, Button, Card } from '@/design'
import { shapeLabel, stopsOf } from '@/features/plans/labels'
import { cn } from '@/lib/cn'
import { duration, money } from '@/lib/format'

interface Props {
  session: Session
  onVote: (votes: { planId: string; liked: boolean }[]) => void
  saving: boolean
  onOpenPlan?: (planId: string) => void
}

/** Like or skip each of the 3 plans; likes update live for everyone (FR-INVITE-5). */
export function VotePanel({ session, onVote, saving, onOpenPlan }: Props) {
  const plans = session.plans ?? []
  // Starts from the votes the server already has (e.g. after a reload).
  const [votes, setVotes] = useState<Record<string, boolean>>(session.me?.votes ?? {})
  const voted = Object.keys(session.me?.votes ?? {}).length > 0

  const complete = plans.every((p) => p.id in votes)
  const changed = JSON.stringify(votes) !== JSON.stringify(session.me?.votes ?? {})
  const maxLikes = Math.max(0, ...Object.values(session.likes))

  return (
    <div className="flex flex-col gap-4">
      {plans.map((plan, i) => {
        const stops = stopsOf(plan)
        const choice = votes[plan.id]
        const likes = session.likes[plan.id] ?? 0
        const leading = likes > 0 && likes === maxLikes
        return (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className={cn('flex flex-col gap-4 p-4', choice === true && 'border-accent ring-2 ring-accent/25')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge>Plan {plan.rank}</Badge>
                    {leading && <Badge tone="accent">Leading</Badge>}
                  </div>
                  <p className="text-sm text-muted">{shapeLabel(plan)}</p>
                  <p className="font-display text-lg leading-tight font-bold">{stops.map((s) => s.place.name).join(' + ')}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl font-extrabold">{money(plan.perPersonCents, { whole: true })}</p>
                  <p className="text-xs text-muted">each, all-in</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  {duration(plan.totalMinutes)}
                </span>
                <span>{plan.reasons[0]}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={choice === false ? 'primary' : 'secondary'}
                  aria-pressed={choice === false}
                  onClick={() => setVotes((v) => ({ ...v, [plan.id]: false }))}
                  icon={<X className="size-4" aria-hidden />}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  variant={choice === true ? 'accent' : 'secondary'}
                  aria-pressed={choice === true}
                  onClick={() => setVotes((v) => ({ ...v, [plan.id]: true }))}
                  icon={<Heart className={cn('size-4', choice === true && 'fill-current')} aria-hidden />}
                >
                  Like
                </Button>
                {onOpenPlan && (
                  <Button size="sm" variant="ghost" onClick={() => onOpenPlan(plan.id)}>
                    Details
                  </Button>
                )}
                <span className="ml-auto flex items-center gap-1 text-sm font-semibold tabular-nums" aria-label={`${likes} likes`}>
                  <Heart className="size-4 fill-accent text-accent" aria-hidden />
                  {likes}
                </span>
              </div>
            </Card>
          </motion.div>
        )
      })}

      <Button
        size="lg"
        variant="accent"
        loading={saving}
        disabled={!complete || (voted && !changed)}
        onClick={() => onVote(plans.map((p) => ({ planId: p.id, liked: votes[p.id] })))}
      >
        {!complete ? 'Like or skip each plan' : voted && !changed ? 'Votes sent' : voted ? 'Update my votes' : 'Send my votes'}
      </Button>
    </div>
  )
}
