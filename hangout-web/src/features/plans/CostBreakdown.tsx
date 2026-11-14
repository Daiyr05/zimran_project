import { Info } from 'lucide-react'
import type { Plan } from '@/api/types'
import { Card } from '@/design'
import { money } from '@/lib/format'

/** All-in cost, line by line, so nothing is a surprise (FR-RESULT-4). */
export function CostBreakdown({ plan, partySize }: { plan: Plan; partySize: number }) {
  const { placesCents, taxCents, tipCents, travelCents } = plan.costBreakdown
  const rows = [
    ['Places', placesCents],
    ['Sales tax', taxCents],
    ['Tip (food and drinks)', tipCents],
    ['Travel', travelCents],
  ] as const

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">All-in cost</h2>
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">Estimate</span>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map(([label, cents]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="font-medium tabular-nums">{money(cents)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-4 border-t border-line pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-display text-xl font-extrabold tabular-nums">{money(plan.totalCents)}</dd>
        </div>
        {partySize > 1 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Per person ({partySize} people)</dt>
            <dd className="font-semibold tabular-nums">{money(plan.perPersonCents)}</dd>
          </div>
        )}
      </dl>
      <p className="flex gap-2 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Prices come from place price levels and friends' Moments. Rideshare and parking are estimated from
        distance.
      </p>
    </Card>
  )
}
