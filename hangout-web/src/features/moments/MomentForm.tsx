import { Repeat, Send, ThumbsDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { uploadPhoto, useFriends } from '@/api/social'
import type { HideDate, Mood, MomentInput, SpentBasis } from '@/api/types'
import { Avatar, Button, Card, Chip, Input, StarInput, Textarea, Toggle } from '@/design'
import { MoodPicker } from '@/features/search/MoodPicker'
import { Section } from '@/features/search/Section'
import { cn } from '@/lib/cn'
import { shrinkPhoto } from '@/lib/image'
import { cityDate } from '@/lib/time'
import { PhotoPicker, type PhotoItem } from './PhotoPicker'
import { PlacePicker, type PickedPlace } from './PlacePicker'

export interface MomentDraft {
  photos: PhotoItem[]
  place: PickedPlace | null
  planId: string | null
  visitDate: string
  hideDate: HideDate
  rating: number
  spent: string // dollars, as typed
  spentBasis: SpentBasis
  opinion: string
  wouldGoAgain: boolean | null
  moods: Mood[]
  shareToPlace: boolean
  tagged: string[]
}

export function emptyDraft(): MomentDraft {
  return {
    photos: [],
    place: null,
    planId: null,
    visitDate: cityDate(),
    hideDate: 'NONE',
    rating: 0,
    spent: '',
    spentBasis: 'PER_PERSON',
    opinion: '',
    wouldGoAgain: null,
    moods: [],
    shareToPlace: false, // FR-MOMENT-4: off by default
    tagged: [],
  }
}

type Errors = Partial<Record<'photos' | 'place' | 'visitDate' | 'rating' | 'spent' | 'opinion' | 'wouldGoAgain', string>>

const MAX_OPINION = 1000

function validate(d: MomentDraft): Errors {
  const e: Errors = {}
  if (d.photos.length === 0) e.photos = 'Add at least one photo'
  if (!d.place) e.place = 'Pick the place you went to'
  if (!d.visitDate) e.visitDate = 'Add the date you went'
  else if (d.visitDate > cityDate()) e.visitDate = "The visit can't be in the future"
  if (!d.rating) e.rating = 'Tap a star to rate it'
  if (d.spent.trim() === '' || Number.isNaN(Number(d.spent)) || Number(d.spent) < 0) e.spent = 'Enter how much you spent (0 if free)'
  if (d.opinion.length > MAX_OPINION) e.opinion = `Keep it under ${MAX_OPINION.toLocaleString('en-US')} characters`
  if (d.wouldGoAgain === null) e.wouldGoAgain = 'Pick yes or no'
  return e
}

const ORDER: (keyof Errors)[] = ['photos', 'place', 'visitDate', 'rating', 'spent', 'wouldGoAgain', 'opinion']

/** The whole Moment form. Uploads new photos first, then saves (FR-MOMENT-1 to 8). */
export function MomentForm({
  initial,
  submitLabel,
  onSave,
  saving,
}: {
  initial: MomentDraft
  submitLabel: string
  onSave: (body: MomentInput) => Promise<void>
  saving: boolean
}) {
  const [d, setD] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  // Errors the server sent back; cleared as soon as the user edits again.
  const [serverErrors, setServerErrors] = useState<Errors>({})
  const errors: Errors = submitted ? { ...validate(d), ...serverErrors } : {}
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null)
  const { data: friends } = useFriends()

  const set = (patch: Partial<MomentDraft>) => {
    setServerErrors({})
    setD((cur) => ({ ...cur, ...patch }))
  }

  const submit = async () => {
    setSubmitted(true)
    const errs = validate(d)
    const first = ORDER.find((k) => errs[k])
    if (first) {
      document.getElementById(`mf-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Upload new photos one by one so the progress is honest.
    const toUpload = d.photos.filter((p) => !p.url)
    const urls = new Map<string, string>()
    try {
      if (toUpload.length) setUploading({ done: 0, total: toUpload.length })
      for (const [i, p] of toUpload.entries()) {
        const blob = await shrinkPhoto(p.file!)
        urls.set(p.id, await uploadPhoto(blob, p.file!.name.replace(/\.\w+$/, '.jpg')))
        setUploading({ done: i + 1, total: toUpload.length })
      }
    } catch (e) {
      setUploading(null)
      toast.error(e instanceof ApiError ? e.message : 'A photo failed to upload. Try again.')
      return
    }
    setUploading(null)
    // Keep uploaded URLs on the draft, so a retry after a save error doesn't upload twice.
    const photos = d.photos.map((p) => (urls.has(p.id) ? { ...p, url: urls.get(p.id) } : p))
    setD((cur) => ({ ...cur, photos }))

    try {
      await onSave({
        placeId: d.place!.id,
        planId: d.planId,
        visitDate: d.visitDate,
        hideDate: d.hideDate,
        rating: d.rating,
        opinion: d.opinion.trim(),
        wouldGoAgain: d.wouldGoAgain!,
        spentCents: Math.round(Number(d.spent) * 100),
        spentBasis: d.spentBasis,
        moods: d.moods,
        shareToPlace: d.shareToPlace,
        photoUrls: photos.map((p) => p.url!),
        taggedUserIds: d.tagged,
      })
    } catch (e) {
      if (e instanceof ApiError) {
        const f = e.fields
        setServerErrors({
          photos: f.photos,
          place: f.placeId,
          visitDate: f.visitDate,
          rating: f.rating,
          spent: f.spentCents,
          opinion: f.opinion,
        })
        toast.error(e.message)
      } else toast.error('Could not save. Try again.')
    }
  }

  const busy = saving || uploading !== null

  return (
    <div className="flex flex-col gap-10 pb-32 md:pb-28">
      <Section id="mf-photos" title="Photos" hint="1 to 10" error={errors.photos}>
        <PhotoPicker value={d.photos} onChange={(photos) => set({ photos })} error={errors.photos} />
      </Section>

      <Section id="mf-place" title="Where did you go?" error={errors.place}>
        <PlacePicker value={d.place} onChange={(place) => set({ place })} invalid={Boolean(errors.place)} />
      </Section>

      <Section id="mf-visitDate" title="When?" error={errors.visitDate}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="mf-date" className="sr-only">
            Visit date
          </label>
          <Input
            id="mf-date"
            type="date"
            max={cityDate()}
            value={d.visitDate}
            onChange={(e) => set({ visitDate: e.target.value })}
            className="sm:w-48"
          />
          <div role="radiogroup" aria-label="Who sees the date" className="flex flex-wrap gap-2">
            {(
              [
                ['NONE', 'Show date'],
                ['DAY', 'Month only'],
                ['FULL', 'Hide date'],
              ] as [HideDate, string][]
            ).map(([v, label]) => (
              <Chip key={v} role="radio" aria-checked={d.hideDate === v} selected={d.hideDate === v} onClick={() => set({ hideDate: v })}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      <Section id="mf-rating" title="How was it?" error={errors.rating}>
        <StarInput value={d.rating} onChange={(rating) => set({ rating })} invalid={Boolean(errors.rating)} />
      </Section>

      <Section id="mf-spent" title="Money spent" hint="All-in: food, tickets, tip" error={errors.spent}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-40">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">$</span>
            <label htmlFor="mf-amount" className="sr-only">
              Amount in dollars
            </label>
            <Input
              id="mf-amount"
              inputMode="decimal"
              placeholder="0"
              value={d.spent}
              onChange={(e) => set({ spent: e.target.value.replace(/[^\d.]/g, '') })}
              className="pl-7"
              aria-invalid={Boolean(errors.spent)}
            />
          </div>
          <div role="radiogroup" aria-label="Amount is" className="flex gap-2">
            <Chip role="radio" aria-checked={d.spentBasis === 'PER_PERSON'} selected={d.spentBasis === 'PER_PERSON'} onClick={() => set({ spentBasis: 'PER_PERSON' })}>
              Per person
            </Chip>
            <Chip role="radio" aria-checked={d.spentBasis === 'TOTAL'} selected={d.spentBasis === 'TOTAL'} onClick={() => set({ spentBasis: 'TOTAL' })}>
              Total
            </Chip>
          </div>
        </div>
      </Section>

      <Section id="mf-wouldGoAgain" title="Would you go again?" error={errors.wouldGoAgain}>
        <div role="radiogroup" aria-label="Would you go again" className="grid grid-cols-2 gap-2 sm:max-w-sm">
          {(
            [
              [true, 'Yes', Repeat],
              [false, 'No', ThumbsDown],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={d.wouldGoAgain === v}
              onClick={() => set({ wouldGoAgain: v })}
              className={cn(
                'flex h-12 items-center justify-center gap-2 rounded-2xl border font-semibold transition',
                d.wouldGoAgain === v ? 'border-brand bg-brand-soft' : errors.wouldGoAgain ? 'border-bad/50' : 'border-line bg-surface',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section id="mf-opinion" title="Your take" hint="Optional" error={errors.opinion}>
        <label htmlFor="mf-text" className="sr-only">
          Your opinion
        </label>
        <Textarea
          id="mf-text"
          value={d.opinion}
          maxLength={MAX_OPINION + 200}
          placeholder="What should friends know? Best dish, when to go, what to skip."
          onChange={(e) => set({ opinion: e.target.value })}
        />
        <p className={cn('-mt-1 text-right text-xs', d.opinion.length > MAX_OPINION ? 'text-bad' : 'text-muted')}>
          {d.opinion.length.toLocaleString('en-US')}/{MAX_OPINION.toLocaleString('en-US')}
        </p>
      </Section>

      <Section title="Mood" hint="Up to 3, optional">
        <MoodPicker value={d.moods} onChange={(moods) => set({ moods })} max={3} />
      </Section>

      {friends && friends.friends.length > 0 && (
        <Section title="Who was with you?" hint="They approve before their name shows">
          <div className="flex flex-wrap gap-2">
            {friends.friends.map((f) => {
              const on = d.tagged.includes(f.id)
              return (
                <Chip
                  key={f.id}
                  selected={on}
                  onClick={() => set({ tagged: on ? d.tagged.filter((x) => x !== f.id) : [...d.tagged, f.id] })}
                >
                  <Avatar name={f.name} src={f.photoUrl} size="sm" className="-ml-2 size-7" />
                  {f.name}
                </Chip>
              )
            })}
          </div>
        </Section>
      )}

      <Card className="flex items-center gap-4 p-4">
        <div className="flex-1">
          <p id="share-label" className="font-semibold">
            Share to the place page
          </p>
          <p className="text-sm text-muted">
            Off: only friends see it. On: anyone who opens this place, or the map, can see it.
          </p>
        </div>
        <Toggle checked={d.shareToPlace} onChange={(shareToPlace) => set({ shareToPlace })} label="Share to the place page" />
      </Card>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite">
            {uploading ? `Uploading photo ${Math.min(uploading.done + 1, uploading.total)} of ${uploading.total}…` : d.shareToPlace ? 'Friends + place page' : 'Friends only'}
          </p>
          <Button size="lg" variant="accent" loading={busy} onClick={submit} icon={<Send className="size-5" aria-hidden />} className="shrink-0">
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
