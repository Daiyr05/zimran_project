import { motion } from 'framer-motion'
import { Check, Clock, Gem, UsersRound } from 'lucide-react'
import type { Plan } from '@/api/types'
import { Badge } from '@/design'
import { cn } from '@/lib/cn'
import { duration, money } from '@/lib/format'
import { KIND, shapeLabel, stopsOf } from './labels'

interface Props {
  plan: Plan
  selected: boolean
  partySize: number
  onSelect: () => void
  index: number
}

/** One of the 3 plans: photos of each stop, price and the reason to pick it (FR-RESULT-1, 4, 7, 8). */
export function PlanCard({ plan, selected, partySize, onSelect, index }: Props) {
  const stops = stopsOf(plan)
  const friend = stops.find((s) => s.friendSignal)?.friendSignal
  const gem = stops.some((s) => s.place.hiddenGem)

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        'group flex w-[82%] shrink-0 snap-center flex-col overflow-hidden rounded-card border bg-surface text-left shadow-card transition sm:w-auto',
        selected ? 'border-brand ring-2 ring-brand/40' : 'border-line hover:-translate-y-0.5 hover:border-muted',
      )}
    >
      {/* One photo per stop, side by side. */}
      <div className="relative flex h-28 gap-0.5 bg-surface-2">
        {stops.map((s) => {
          const Icon = KIND[s.place.kind].icon
          return s.place.photoUrl ? (
            <img key={s.position} src={s.place.photoUrl} alt="" className="h-full min-w-0 flex-1 object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <span key={s.position} className="grid flex-1 place-items-center bg-gradient-to-br from-brand-soft to-accent-soft text-brand dark:text-ink">
              <Icon className="size-6" aria-hidden />
            </span>
          )
        })}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold shadow', selected ? 'bg-brand text-brand-ink' : 'bg-white/90 text-[#1c1638]')}>
            Plan {plan.rank}
          </span>
          {selected && (
            <span className="grid size-7 place-items-center rounded-full bg-brand text-brand-ink shadow" aria-hidden>
              <Check className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            {shapeLabel(plan)}
            <span aria-hidden>·</span>
            <Clock className="size-3.5" aria-hidden />
            {duration(plan.totalMinutes)}
          </p>
          <p className="font-display text-lg leading-tight font-bold">{stops.map((s) => s.place.name).join(' + ')}</p>
        </div>

        <div>
          <p className="font-display text-3xl font-extrabold">{money(plan.totalCents, { whole: true })}</p>
          <p className="text-xs text-muted">
            all-in estimate{partySize > 1 && ` · ${money(plan.perPersonCents, { whole: true })} each`}
          </p>
        </div>

        {(friend || gem) && (
          <div className="flex flex-wrap gap-1.5">
            {friend && (
              <Badge tone="brand">
                <UsersRound className="size-3" aria-hidden />
                {friend.name} · {friend.rating}/5
              </Badge>
            )}
            {gem && (
              <Badge tone="good">
                <Gem className="size-3" aria-hidden />
                Hidden gem
              </Badge>
            )}
          </div>
        )}

        <p className="mt-auto text-sm text-muted">{plan.reasons[0]}</p>
      </div>
    </motion.button>
  )
}
