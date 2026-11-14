import { useSearchParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { useMoment } from '@/api/social'
import { Dialog, Skeleton } from '@/design'
import { MomentCard } from './MomentCard'

/** Opens the Moment in ?m=<id> over any page (profile grid, map, place page, friend badges). */
export function useMomentParam() {
  const [params, setParams] = useSearchParams()
  const id = params.get('m')
  const open = (momentId: string) =>
    setParams((p) => {
      p.set('m', momentId)
      return p
    })
  const close = () =>
    setParams(
      (p) => {
        p.delete('m')
        return p
      },
      { replace: true },
    )
  return { id, open, close }
}

export function MomentDialog() {
  const { id, close } = useMomentParam()
  const { data, error, isLoading } = useMoment(id ?? undefined)

  return (
    <Dialog open={Boolean(id)} onClose={close} title={data ? `Moment at ${data.place.name}` : 'Moment'} hideTitle className="sm:max-w-xl">
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <p className="py-8 text-center text-muted">
          {error instanceof ApiError && error.status === 404 ? 'This Moment is no longer available.' : 'Could not load this Moment.'}
        </p>
      ) : data ? (
        <div className="-m-1">
          <MomentCard moment={data} onDeleted={close} />
        </div>
      ) : null}
    </Dialog>
  )
}
