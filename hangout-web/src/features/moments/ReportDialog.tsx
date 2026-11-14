import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useReportMoment } from '@/api/social'
import { Button, Dialog } from '@/design'
import { cn } from '@/lib/cn'

const REASONS = ['Spam or ad', 'Not a real visit', 'Offensive or hateful', 'Private info about someone', 'Something else']

/** FR-MOMENT-10: report a Moment. After 3 reports it is hidden until an admin reviews it. */
export function ReportDialog({ momentId, open, onClose }: { momentId: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const report = useReportMoment()

  const send = async () => {
    try {
      await report.mutateAsync({ id: momentId, reason })
      toast.success("Thanks. We'll take a look.")
      setReason('')
      onClose()
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not send the report.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Report this Moment">
      <p className="text-sm text-muted">The author won't see who reported it.</p>
      <div role="radiogroup" aria-label="Reason" className="flex flex-col gap-2">
        {REASONS.map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={reason === r}
            onClick={() => setReason(r)}
            className={cn(
              'rounded-xl border px-4 py-3 text-left text-sm font-medium transition',
              reason === r ? 'border-brand bg-brand-soft' : 'border-line hover:bg-surface-2',
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!reason} loading={report.isPending} onClick={send}>
          Send report
        </Button>
      </div>
    </Dialog>
  )
}
