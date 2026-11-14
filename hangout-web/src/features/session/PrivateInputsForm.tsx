import { Lock } from 'lucide-react'
import { useState } from 'react'
import type { MemberInputs, Mood } from '@/api/types'
import { Button, Chip } from '@/design'
import { MoodPicker } from '@/features/search/MoodPicker'
import { Section } from '@/features/search/Section'
import { StartPointInput } from '@/features/search/StartPointInput'
import { cn } from '@/lib/cn'

const HOURS = [2, 3, 4, 5, 6]

/** An invitee's private mood, time, budget and start (FR-INVITE-2, FR-INVITE-3). */
export function PrivateInputsForm({
  onSubmit,
  loading,
  organizerName,
}: {
  onSubmit: (inputs: MemberInputs) => void
  loading: boolean
  organizerName: string
}) {
  const [moods, setMoods] = useState<Mood[]>([])
  const [hours, setHours] = useState(4)
  const [budget, setBudget] = useState(60)
  const [start, setStart] = useState({ startLabel: '', startLat: null as number | null, startLng: null as number | null })
  const [errors, setErrors] = useState<{ moods?: string; start?: string }>({})

  const submit = () => {
    const e = {
      moods: moods.length ? undefined : 'Pick at least one mood',
      start: start.startLabel.trim() ? undefined : 'Add where you start from',
    }
    setErrors(e)
    if (e.moods || e.start) return
    onSubmit({
      moods,
      totalMinutes: hours * 60,
      budgetCents: budget * 100,
      start: { lat: start.startLat, lng: start.startLng, label: start.startLabel.trim() },
    })
  }

  const pct = (budget / 300) * 100

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3 rounded-2xl bg-brand-soft p-4 text-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand dark:text-ink" aria-hidden />
        <p>
          Only the app sees your budget and address. {organizerName} and the others see just that you're ready.
        </p>
      </div>

      <Section title="Your mood" hint="Pick up to 2" error={errors.moods}>
        <MoodPicker value={moods} onChange={setMoods} invalid={Boolean(errors.moods)} />
      </Section>

      <Section title="How long can you stay?">
        <div className="flex flex-wrap gap-2">
          {HOURS.map((h) => (
            <Chip key={h} selected={hours === h} onClick={() => setHours(h)}>
              {h} h
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Your budget, just for you">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <p className="font-display text-4xl font-extrabold" aria-live="polite">
            ${budget}
            {budget >= 300 && '+'}
            <span className="ml-2 font-sans text-sm font-medium text-muted">all-in, per person</span>
          </p>
          <input
            type="range"
            min={10}
            max={300}
            step={5}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            aria-label="Your budget per person in dollars"
            className={cn(
              'h-11 w-full cursor-pointer appearance-none bg-transparent',
              '[&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-runnable-track]:h-2',
              '[&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-accent',
            )}
            style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, var(--line) ${pct}%) center / 100% 8px no-repeat` }}
          />
          <p className="text-sm text-muted">The plan will fit the lowest budget in the group, without saying whose.</p>
        </div>
      </Section>

      <Section title="Where are you coming from?" error={errors.start}>
        <StartPointInput form={start} set={(p) => setStart((s) => ({ ...s, ...p }))} error={errors.start} />
      </Section>

      <Button size="lg" variant="accent" loading={loading} onClick={submit}>
        I'm ready
      </Button>
    </div>
  )
}
