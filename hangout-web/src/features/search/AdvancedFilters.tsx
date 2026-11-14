import { AnimatePresence, motion } from 'framer-motion'
import { Bus, Car, CarTaxiFront, ChevronDown, Footprints, Lock, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { TravelMode } from '@/api/types'
import { Badge, Chip } from '@/design'
import { cn } from '@/lib/cn'
import type { SearchForm } from './model'
import { Toggle } from '@/design'

interface Props {
  form: SearchForm
  set: (patch: Partial<SearchForm>) => void
  isPlus: boolean
}

const travel: { value: TravelMode; label: string; icon: LucideIcon }[] = [
  { value: 'WALK', label: 'Walk', icon: Footprints },
  { value: 'TRANSIT', label: 'Transit', icon: Bus },
  { value: 'RIDESHARE', label: 'Rideshare', icon: CarTaxiFront },
  { value: 'CAR', label: 'My car', icon: Car },
]

/**
 * Advanced inputs, collapsed by default (FR-SEARCH-4).
 * Free: plan type, energy, setting, quiet, no alcohol, travel mode.
 * Plus: max travel per leg, diet, discovery level, avoid places I've been (SRS 2.2, 8.3).
 */
export function AdvancedFilters({ form, set, isPlus }: Props) {
  const [open, setOpen] = useState(false)
  const changed = countChanged(form)

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="advanced-panel"
        className="flex h-14 w-full items-center justify-between px-4 text-left"
      >
        <span className="flex items-center gap-2 font-display text-lg font-bold">
          Advanced
          {changed > 0 && <Badge tone="brand">{changed} set</Badge>}
        </span>
        <ChevronDown className={cn('size-5 text-muted transition', open && 'rotate-180')} aria-hidden />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="advanced-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-6 border-t border-line p-4">
              <Row label="Type of plan">
                <Segment
                  value={form.setting}
                  options={[
                    ['OUT', 'Go out'],
                    ['IN', 'Stay in'],
                    ['ANY', 'Either'],
                  ]}
                  onChange={(setting) => set({ setting })}
                />
              </Row>

              <Row label="Energy">
                <Segment
                  value={form.energy}
                  options={[
                    ['LOW', 'Low'],
                    ['MEDIUM', 'Medium'],
                    ['HIGH', 'High'],
                  ]}
                  onChange={(energy) => set({ energy })}
                />
              </Row>

              <Row label="Setting">
                <Segment
                  value={form.indoorOutdoor}
                  options={[
                    ['INDOOR', 'Indoor'],
                    ['OUTDOOR', 'Outdoor'],
                    ['ANY', 'Any'],
                  ]}
                  onChange={(indoorOutdoor) => set({ indoorOutdoor })}
                />
              </Row>

              <div className="flex flex-col gap-3">
                <SwitchRow label="Quiet places only" checked={form.quietOnly} onChange={(quietOnly) => set({ quietOnly })} />
                <SwitchRow label="No bars or alcohol" checked={form.noAlcohol} onChange={(noAlcohol) => set({ noAlcohol })} />
              </div>

              <Row label="Getting around">
                <div className="flex flex-wrap gap-2">
                  {travel.map(({ value, label, icon: Icon }) => (
                    <Chip key={value} selected={form.travelMode === value} onClick={() => set({ travelMode: value })}>
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </Chip>
                  ))}
                </div>
              </Row>

              <div className="flex flex-col gap-6 rounded-2xl bg-surface-2/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Plus filters</span>
                  {!isPlus && (
                    <Link to="/plus">
                      <Badge tone="accent">
                        <Lock className="size-3" aria-hidden />
                        Unlock with Plus
                      </Badge>
                    </Link>
                  )}
                </div>

                <Row label={`Max travel per leg: ${form.maxLegMinutes} min`} locked={!isPlus}>
                  <input
                    type="range"
                    min={5}
                    max={45}
                    step={5}
                    value={form.maxLegMinutes}
                    disabled={!isPlus}
                    onChange={(e) => set({ maxLegMinutes: Number(e.target.value) })}
                    aria-label="Max travel minutes per leg"
                    className="w-full accent-[var(--brand)]"
                  />
                </Row>

                <Row label="Food needs" locked={!isPlus}>
                  <select
                    value={form.diet}
                    disabled={!isPlus}
                    onChange={(e) => set({ diet: e.target.value as SearchForm['diet'] })}
                    aria-label="Food needs"
                    className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink disabled:opacity-50"
                  >
                    <option value="">No preference</option>
                    <option value="VEGETARIAN">Vegetarian</option>
                    <option value="VEGAN">Vegan</option>
                    <option value="HALAL">Halal</option>
                    <option value="GLUTEN_FREE">Gluten-free</option>
                  </select>
                </Row>

                <Row label="Popular favorites ↔ hidden gems" locked={!isPlus}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.25}
                    value={form.discovery}
                    disabled={!isPlus}
                    onChange={(e) => set({ discovery: Number(e.target.value) })}
                    aria-label="Discovery level"
                    className="w-full accent-[var(--brand)]"
                  />
                </Row>

                <SwitchRow
                  label="Skip places I've been"
                  checked={form.avoidVisited}
                  onChange={(avoidVisited) => set({ avoidVisited })}
                  disabled={!isPlus}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function countChanged(f: SearchForm) {
  return [
    f.setting !== 'OUT',
    f.energy !== 'MEDIUM',
    f.indoorOutdoor !== 'ANY',
    f.quietOnly,
    f.noAlcohol,
    f.travelMode !== 'TRANSIT',
  ].filter(Boolean).length
}

function Row({ label, locked, children }: { label: string; locked?: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-2', locked && 'opacity-60')}>
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {locked && <Lock className="size-3.5 text-muted" aria-label="Plus only" />}
        {label}
      </span>
      {children}
    </div>
  )
}

function SwitchRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4', disabled && 'opacity-60')}>
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {disabled && <Lock className="size-3.5 text-muted" aria-label="Plus only" />}
        {label}
      </span>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  )
}

function Segment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid grid-flow-col gap-1 rounded-full bg-surface-2 p-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'h-10 rounded-full px-3 text-sm font-semibold transition',
            value === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
