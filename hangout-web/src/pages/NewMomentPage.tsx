import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSaveMoment } from '@/api/social'
import { emptyDraft, MomentForm, type MomentDraft } from '@/features/moments/MomentForm'
import { dismissOuting } from '@/features/moments/outings'

/**
 * Post a Moment (FR-MOMENT-1 to 8). The "How was it?" prompt opens this page with
 * ?place=&placeName=&date=&spent=&plan= prefilled (FR-MOMENT-6).
 */
export default function NewMomentPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const save = useSaveMoment()

  const initial: MomentDraft = { ...emptyDraft() }
  const placeId = params.get('place')
  if (placeId) initial.place = { id: placeId, name: params.get('placeName') ?? 'This place' }
  if (params.get('date')) initial.visitDate = params.get('date')!
  if (params.get('spent')) initial.spent = params.get('spent')!
  if (params.get('plan')) initial.planId = params.get('plan')

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold md:text-5xl">New Moment</h1>
        <p className="text-muted">Where you went, what it cost, and whether it was worth it. Friends will see it on their feed.</p>
      </header>
      <MomentForm
        initial={initial}
        submitLabel="Post Moment"
        saving={save.isPending}
        onSave={async (body) => {
          const m = await save.mutateAsync(body)
          if (params.get('outing')) dismissOuting(params.get('outing')!)
          toast.success('Moment posted')
          navigate(`/me?m=${m.id}`, { replace: true })
        }}
      />
    </div>
  )
}
