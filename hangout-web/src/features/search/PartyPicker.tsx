import { Baby, Heart, Lock, Minus, Plus, User, Users, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chip, Toggle } from '@/design'
import type { SearchForm } from './model'

interface Props {
  form: SearchForm
  set: (patch: Partial<SearchForm>) => void
  error?: string
  /** Free: groups up to 2. Plus: group plans for 3–8 people (SRS 2.2). */
  isPlus?: boolean
}

export const FREE_MAX_GROUP = 2

const options = [
  { value: 'PARTNER', label: 'Partner', icon: Heart },
  { value: 'FRIENDS', label: 'Friends', icon: Users },
  { value: 'SOLO', label: 'Just me', icon: User },
] as const

/** Who's coming, group size and children (FR-SEARCH-1, FR-SEARCH-2). */
export function PartyPicker({ form, set, error, isPlus = false }: Props) {
  const maxGroup = isPlus ? 8 : FREE_MAX_GROUP
  const addKid = () => set({ kidAges: [...form.kidAges, 6] })
  const setKid = (i: number, age: number) =>
    set({ kidAges: form.kidAges.map((a, j) => (j === i ? age : a)) })
  const removeKid = (i: number) => set({ kidAges: form.kidAges.filter((_, j) => j !== i) })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <Chip key={value} selected={form.partyType === value} onClick={() => set({ partyType: value })}>
            <Icon className="size-4" aria-hidden />
            {label}
          </Chip>
        ))}
      </div>

      {form.partyType === 'FRIENDS' && (
        <div className="flex flex-col gap-2">
          <Stepper
            label="People, including you"
            value={Math.min(form.groupSize, maxGroup)}
            min={2}
            max={maxGroup}
            onChange={(groupSize) => set({ groupSize })}
          />
          {!isPlus && (
            <Link to="/plus" className="flex items-center gap-1.5 text-sm font-semibold text-brand dark:text-ink">
              <Lock className="size-3.5" aria-hidden />
              Group plans for 3–8 people come with Plus
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Baby className="size-4 text-brand" aria-hidden />
            Bringing children
          </span>
          <Toggle
            checked={form.withKids}
            onChange={(withKids) =>
              set({ withKids, kidAges: withKids && form.kidAges.length === 0 ? [6] : form.kidAges })
            }
          />
        </label>

        {form.withKids && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">
              Plans will use kid-friendly places and end earlier. Kids' prices are estimates.
            </p>
            <div className="flex flex-wrap gap-2">
              {form.kidAges.map((age, i) => (
                <span
                  key={i}
                  className="flex h-11 items-center gap-1 rounded-full border border-line bg-bg pr-1 pl-3"
                >
                  <label className="sr-only" htmlFor={`kid-${i}`}>
                    Child {i + 1} age
                  </label>
                  <select
                    id={`kid-${i}`}
                    value={age}
                    onChange={(e) => setKid(i, Number(e.target.value))}
                    className="bg-transparent text-sm font-medium text-ink focus:outline-none"
                  >
                    {Array.from({ length: 18 }, (_, a) => (
                      <option key={a} value={a}>
                        {a === 0 ? 'Under 1' : `${a} yr`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeKid(i)}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2"
                    aria-label={`Remove child ${i + 1}`}
                  >
                    <X className="size-4" />
                  </button>
                </span>
              ))}
              {form.kidAges.length < 6 && (
                <Chip onClick={addKid}>
                  <Plus className="size-4" aria-hidden />
                  Add child
                </Chip>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm font-medium text-bad">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-2 pl-4">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="grid size-11 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30"
          aria-label="Fewer people"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-display text-xl font-bold" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="grid size-11 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30"
          aria-label="More people"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}
