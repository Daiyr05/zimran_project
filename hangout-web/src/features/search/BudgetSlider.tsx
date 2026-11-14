import { cn } from '@/lib/cn'
import { adultsOf, type SearchForm } from './model'

interface Props {
  form: SearchForm
  set: (patch: Partial<SearchForm>) => void
  error?: string
}

const MAX = 500

/** All-in budget: places + tax + tip + travel (FR-SEARCH-1). */
export function BudgetSlider({ form, set, error }: Props) {
  const people = adultsOf(form)
  const showBasis = people > 1
  const pct = (form.budget / MAX) * 100
  const other =
    form.budgetBasis === 'TOTAL'
      ? `about $${Math.round(form.budget / people)} each`
      : `about $${form.budget * people} for the group`

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-4xl font-extrabold" aria-live="polite">
            ${form.budget}
            {form.budget >= MAX && '+'}
          </p>
          <p className="text-sm text-muted">
            {showBasis ? `${form.budgetBasis === 'TOTAL' ? 'total' : 'per person'} · ${other}` : 'all-in'}
          </p>
        </div>
        {showBasis && (
          <div className="flex rounded-full bg-surface-2 p-1" role="group" aria-label="Budget is">
            {(['TOTAL', 'PER_PERSON'] as const).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={form.budgetBasis === b}
                onClick={() => set({ budgetBasis: b })}
                className={cn(
                  'h-9 rounded-full px-3 text-sm font-semibold transition',
                  form.budgetBasis === b ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                )}
              >
                {b === 'TOTAL' ? 'Total' : 'Per person'}
              </button>
            ))}
          </div>
        )}
      </div>

      <label htmlFor="budget" className="sr-only">
        Budget in dollars
      </label>
      <input
        id="budget"
        type="range"
        min={0}
        max={MAX}
        step={5}
        value={form.budget}
        onChange={(e) => set({ budget: Number(e.target.value) })}
        aria-invalid={Boolean(error)}
        className="h-11 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-accent [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full"
        style={{
          // filled part of the track
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--line) ${pct}%) center / 100% 8px no-repeat`,
        }}
      />
      <p className="text-sm text-muted">Includes tax, tip and travel. We plan to stay under it.</p>
    </div>
  )
}
