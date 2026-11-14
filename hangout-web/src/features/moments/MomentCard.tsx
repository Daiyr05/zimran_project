import { BadgeCheck, Flag, MapPin, Pencil, Repeat, ThumbsDown, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useMe } from '@/api/hooks'
import { useDeleteMoment } from '@/api/social'
import type { Moment } from '@/api/types'
import { Avatar, Badge, Button, Card, Dialog, Menu, Stars } from '@/design'
import { MOOD_META } from '@/features/search/MoodPicker'
import { spent, timeAgo, visitDate } from '@/lib/format'
import { PhotoCarousel } from './PhotoCarousel'
import { ReportDialog } from './ReportDialog'

/** One Moment: photos, place, rating, spend, opinion, would go again, verified (SRS 8.3). */
export function MomentCard({ moment, onDeleted }: { moment: Moment; onDeleted?: () => void }) {
  const navigate = useNavigate()
  const [reporting, setReporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const del = useDeleteMoment()
  const { data: me } = useMe()
  const [expanded, setExpanded] = useState(false)
  const date = visitDate(moment.visitDate, moment.hideDate)
  const long = moment.opinion.length > 180

  const onDelete = async () => {
    try {
      await del.mutateAsync(moment.id)
      setConfirmDelete(false)
      toast.success('Moment deleted')
      onDeleted?.()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not delete. Try again.')
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to={`/u/${moment.author.username}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={moment.author.name} src={moment.author.photoUrl} />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {moment.isMine ? 'You' : moment.author.name}
              {moment.taggedFriends.length > 0 && (
                <span className="font-normal text-muted"> with {moment.taggedFriends.map((f) => (f.id === me?.id ? 'you' : f.name)).join(', ')}</span>
              )}
            </p>
            <p className="text-xs text-muted">{timeAgo(moment.createdAt)}</p>
          </div>
        </Link>
        <Menu
          items={
            moment.isMine
              ? [
                  { label: 'Edit', icon: <Pencil className="size-4" aria-hidden />, onSelect: () => navigate(`/moments/${moment.id}/edit`) },
                  { label: 'Delete', icon: <Trash2 className="size-4" aria-hidden />, danger: true, onSelect: () => setConfirmDelete(true) },
                ]
              : [{ label: 'Report', icon: <Flag className="size-4" aria-hidden />, onSelect: () => setReporting(true) }]
          }
        />
      </header>

      <PhotoCarousel photos={moment.photos} alt={moment.place.name} className="rounded-none" />

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link to={`/places/${moment.place.id}`} className="min-w-0 hover:underline">
            <h3 className="flex items-center gap-1.5 font-display text-xl leading-tight font-bold">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
              <span className="truncate">{moment.place.name}</span>
            </h3>
          </Link>
          {moment.verifiedVisit && (
            <Badge tone="brand" title="Posted after an outing planned with Hangout">
              <BadgeCheck className="size-3" aria-hidden />
              Verified visit
            </Badge>
          )}
        </div>

        {/* The three things friends want to know: how good, how much, worth it again. */}
        <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface-2 py-2.5 text-center">
          <div className="flex flex-col items-center gap-1 px-2">
            <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">Rating</dt>
            <dd>
              <Stars value={moment.rating} />
            </dd>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2">
            <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">Spent</dt>
            <dd className="text-sm font-bold">{spent(moment.spentCents, moment.spentBasis)}</dd>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2">
            <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">Again?</dt>
            <dd className={moment.wouldGoAgain ? 'flex items-center gap-1 text-sm font-bold text-good' : 'flex items-center gap-1 text-sm font-bold text-muted'}>
              {moment.wouldGoAgain ? <Repeat className="size-3.5" aria-hidden /> : <ThumbsDown className="size-3.5" aria-hidden />}
              {moment.wouldGoAgain ? 'Yes' : 'No'}
            </dd>
          </div>
        </dl>

        {moment.moods.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {moment.moods.map((m) => {
              const { label, icon: Icon } = MOOD_META[m]
              return (
                <Badge key={m} tone="accent">
                  <Icon className="size-3" aria-hidden />
                  {label}
                </Badge>
              )
            })}
          </div>
        )}
        {moment.opinion && (
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {long && !expanded ? `${moment.opinion.slice(0, 180).trimEnd()}… ` : moment.opinion}
            {long && (
              <button type="button" className="font-semibold text-brand dark:text-ink" onClick={() => setExpanded((x) => !x)}>
                {expanded ? ' Less' : 'More'}
              </button>
            )}
          </p>
        )}
        {date && <p className="text-xs text-muted">Visited {date}</p>}
      </div>

      <ReportDialog momentId={moment.id} open={reporting} onClose={() => setReporting(false)} />
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this Moment?">
        <p className="text-muted">It disappears from your profile, your friends' feeds and the place page. You can't undo this.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Button>
          <Button className="bg-bad text-white" loading={del.isPending} onClick={onDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </Card>
  )
}
