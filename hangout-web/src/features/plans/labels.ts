import { Bus, Car, CarTaxiFront, Coffee, Footprints, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { Plan, PlaceKind, StopItem, TravelMode } from '@/api/types'

export const MODE: Record<TravelMode, { label: string; verb: string; icon: LucideIcon }> = {
  WALK: { label: 'Walk', verb: 'walk', icon: Footprints },
  TRANSIT: { label: 'Transit', verb: 'by transit', icon: Bus },
  RIDESHARE: { label: 'Rideshare', verb: 'by rideshare', icon: CarTaxiFront },
  CAR: { label: 'Drive', verb: 'drive', icon: Car },
}

export const KIND: Record<PlaceKind, { label: string; icon: LucideIcon }> = {
  ACTIVITY: { label: 'Activity', icon: Sparkles },
  DINNER: { label: 'Dinner', icon: UtensilsCrossed },
  TREAT: { label: 'Treat', icon: Coffee },
}

export function stopsOf(plan: Plan): StopItem[] {
  return plan.timeline.filter((t): t is StopItem => t.type === 'STOP')
}

/** "Activity, then dinner" from the stop kinds. */
export function shapeLabel(plan: Plan) {
  const kinds = stopsOf(plan).map((s) => KIND[s.place.kind].label.toLowerCase())
  if (kinds.length === 0) return 'Plan'
  const [first, ...rest] = kinds
  const head = first.charAt(0).toUpperCase() + first.slice(1)
  return rest.length ? `${head}, then ${rest.join(', then ')}` : head
}

/** "$" to "$$$$" from Google's 0–4 price level. */
export function priceSigns(level: number | null) {
  if (level === null) return null
  return level === 0 ? 'Free' : '$'.repeat(level)
}
