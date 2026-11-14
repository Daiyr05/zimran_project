import { Bike, Coffee, Gem, Heart, Landmark, Mountain, PartyPopper, Waves, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Mood } from '@/api/types'
import { cn } from '@/lib/cn'

export const MOOD_META: Record<Mood, { label: string; icon: LucideIcon }> = {
  COZY: { label: 'Cozy', icon: Coffee },
  ROMANTIC: { label: 'Romantic', icon: Heart },
  PLAYFUL: { label: 'Playful', icon: PartyPopper },
  ADVENTUROUS: { label: 'Adventurous', icon: Mountain },
  CHILL: { label: 'Chill', icon: Waves },
  FANCY: { label: 'Fancy', icon: Gem },
  CULTURAL: { label: 'Cultural', icon: Landmark },
  ACTIVE: { label: 'Active', icon: Bike },
}

interface Props {
  value: Mood[]
  onChange: (moods: Mood[]) => void
  max?: number
  invalid?: boolean
}

/** 8 mood tiles; up to 2 in search, 3 in Moments (SRS 8.3). */
export function MoodPicker({ value, onChange, max = 2, invalid }: Props) {
  const toggle = (m: Mood) => {
    if (value.includes(m)) return onChange(value.filter((v) => v !== m))
    if (value.length >= max) {
      toast(`Pick up to ${max}. Tap one to remove it first.`)
      return
    }
    onChange([...value, m])
  }

  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Mood">
      {(Object.keys(MOOD_META) as Mood[]).map((m) => {
        const { label, icon: Icon } = MOOD_META[m]
        const on = value.includes(m)
        return (
          <button
            key={m}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(m)}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border text-xs font-semibold transition sm:aspect-auto sm:h-20 sm:text-sm',
              on
                ? 'border-accent bg-accent-soft text-ink'
                : cn('bg-surface text-muted hover:text-ink', invalid ? 'border-bad/50' : 'border-line'),
            )}
          >
            <Icon className={cn('size-6', on ? 'text-accent' : '')} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
