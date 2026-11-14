import { ArrowRight, MapPin, SearchX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useMe, useRunSearch } from '@/api/hooks'
import { Button, Card } from '@/design'
import { AdvancedFilters } from '@/features/search/AdvancedFilters'
import { BudgetSlider } from '@/features/search/BudgetSlider'
import {
  fromParams,
  toParams,
  toRequest,
  validate,
  type FormErrors,
  type SearchForm,
} from '@/features/search/model'
import { MoodPicker } from '@/features/search/MoodPicker'
import { FREE_MAX_GROUP, PartyPicker } from '@/features/search/PartyPicker'
import { SearchingOverlay } from '@/features/search/SearchingOverlay'
import { Section } from '@/features/search/Section'
import { StartPointInput } from '@/features/search/StartPointInput'
import { WhenPicker } from '@/features/search/WhenPicker'

/** Order of sections on the page, used to scroll to the first error. */
const FIELD_SECTION: Partial<Record<keyof SearchForm, string>> = {
  kidAges: 'sec-who',
  startLabel: 'sec-start',
  date: 'sec-when',
  time: 'sec-when',
  budget: 'sec-budget',
  moods: 'sec-mood',
}

/** The core screen: basic inputs + Advanced, then 3 plans (SRS FR-SEARCH-1 to 7). */
export default function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [form, setForm] = useState<SearchForm>(() => fromParams(params))
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [nothingFits, setNothingFits] = useState<string | null>(null)
  const { data: me } = useMe()
  const search = useRunSearch()
  const isPlus = me?.tier === 'PLUS'

  // Keep the URL in sync so refresh or a shared link keeps the inputs (SRS 8.5).
  useEffect(() => {
    setParams(toParams(form), { replace: true })
  }, [form, setParams])

  const set = (patch: Partial<SearchForm>) => {
    setNothingFits(null)
    const next = { ...form, ...patch }
    setForm(next)
    if (submitted) setErrors(validate(next))
  }

  const onSubmit = async () => {
    setSubmitted(true)
    const errs = validate(form)
    setErrors(errs)
    const first = (Object.keys(FIELD_SECTION) as (keyof SearchForm)[]).find((k) => errs[k])
    if (first) {
      document.getElementById(FIELD_SECTION[first]!)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      // Free accounts plan for up to 2 people; bigger groups are a Plus feature (SRS 2.2).
      const allowed = isPlus ? form : { ...form, groupSize: Math.min(form.groupSize, FREE_MAX_GROUP) }
      const res = await search.mutateAsync(toRequest(allowed))
      navigate(`/plan/results/${res.searchId}`)
    } catch (err) {
      if (!(err instanceof ApiError)) throw err
      if (err.status === 402) {
        toast(err.message, { description: 'Upgrade to Plus for unlimited plans.' })
        navigate('/plus')
      } else if (err.status === 422) {
        setNothingFits(err.message)
      } else if (err.status === 400 && Object.keys(err.fields).length) {
        setErrors(err.fields as FormErrors)
      } else {
        toast.error(err.message)
      }
    }
  }

  const searchesLeft = me?.tier === 'FREE' ? (me.searchesLeft ?? 0) : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 pb-32 md:pb-28">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold md:text-5xl">Plan tonight</h1>
        <p className="text-muted">Five quick answers. We'll build 3 complete plans, door to door.</p>
      </header>

      {form.includePlaceId && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3">
          <MapPin className="size-5 shrink-0 text-accent" aria-hidden />
          <p className="flex-1 text-sm">
            Every plan will include <span className="font-semibold">{form.includePlaceName || 'your place'}</span>
          </p>
          <button
            type="button"
            aria-label="Don't include this place"
            onClick={() => set({ includePlaceId: '', includePlaceName: '' })}
            className="grid size-9 place-items-center rounded-full hover:bg-surface"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <Section id="sec-who" title="Who's coming?">
        <PartyPicker form={form} set={set} error={errors.kidAges} isPlus={isPlus} />
      </Section>

      <Section id="sec-start" title="Where do you start?" error={errors.startLabel}>
        <StartPointInput form={form} set={set} error={errors.startLabel} />
      </Section>

      <Section id="sec-when" title="When, and for how long?" error={errors.time ?? errors.date}>
        <WhenPicker form={form} set={set} />
      </Section>

      <Section id="sec-budget" title="Budget" error={errors.budget}>
        <BudgetSlider form={form} set={set} error={errors.budget} />
      </Section>

      <Section id="sec-mood" title="What's the mood?" hint="Pick up to 2" error={errors.moods}>
        <MoodPicker value={form.moods} onChange={(moods) => set({ moods })} invalid={Boolean(errors.moods)} />
      </Section>

      <AdvancedFilters form={form} set={set} isPlus={isPlus} />

      {nothingFits && (
        <Card className="flex items-start gap-4 border-warn/40 p-5" role="alert">
          <SearchX className="mt-0.5 size-6 shrink-0 text-warn" aria-hidden />
          <div className="flex flex-col gap-3">
            <p className="font-semibold">{nothingFits}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => set({ budget: Math.min(500, form.budget + 30) })}>
                Add $30 to budget
              </Button>
              {form.hours < 8 && (
                <Button size="sm" variant="secondary" onClick={() => set({ hours: form.hours + 1 })}>
                  Add 1 hour
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Sticky action bar; sits above the phone bottom nav. */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {searchesLeft === null ? 'Unlimited plans with Plus' : `${searchesLeft} of 3 free plans left this month`}
          </p>
          <Button
            size="lg"
            variant="accent"
            onClick={onSubmit}
            loading={search.isPending}
            icon={<ArrowRight className="size-5" aria-hidden />}
            className="shrink-0"
          >
            Get 3 plans
          </Button>
        </div>
      </div>

      <SearchingOverlay open={search.isPending} />
    </div>
  )
}
