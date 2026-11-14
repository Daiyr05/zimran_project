import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useMoment, useSaveMoment } from '@/api/social'
import type { Moment } from '@/api/types'
import { EmptyState, Skeleton } from '@/design'
import { MomentForm, type MomentDraft } from '@/features/moments/MomentForm'
import { FileQuestion } from 'lucide-react'

function toDraft(m: Moment): MomentDraft {
  return {
    photos: m.photos.map((url, i) => ({ id: `p${i}`, url, preview: url })),
    place: { id: m.place.id, name: m.place.name, address: m.place.address },
    planId: m.planId,
    // The API returns the real date to the author; month-only and hidden apply to others.
    visitDate: m.visitDate ?? '',
    hideDate: m.hideDate,
    rating: m.rating,
    spent: String(m.spentCents / 100),
    spentBasis: m.spentBasis,
    opinion: m.opinion,
    wouldGoAgain: m.wouldGoAgain,
    moods: m.moods,
    shareToPlace: m.shareToPlace,
    tagged: m.taggedFriends.map((f) => f.id),
  }
}

/** Edit your own Moment (FR-MOMENT-9). */
export default function EditMomentPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useMoment(id)
  const save = useSaveMoment(id)

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl" />
  if (error || !data || !data.isMine)
    return (
      <EmptyState icon={<FileQuestion className="size-6" aria-hidden />} title="You can't edit this Moment">
        It was deleted, or it isn't yours.
      </EmptyState>
    )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header>
        <h1 className="text-4xl font-extrabold md:text-5xl">Edit Moment</h1>
      </header>
      <MomentForm
        initial={toDraft(data)}
        submitLabel="Save changes"
        saving={save.isPending}
        onSave={async (body) => {
          await save.mutateAsync(body)
          toast.success('Moment updated')
          navigate(`/me?m=${id}`, { replace: true })
        }}
      />
    </div>
  )
}
