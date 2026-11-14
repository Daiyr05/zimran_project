import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Card } from '@/design'

/** Invite link with copy and native share (FR-INVITE-1). */
export function ShareCard({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it.')
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: 'Help pick our plan', text: 'Add your mood and budget, then vote:', url: link })
    } catch {
      /* user closed the share sheet */
    }
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-xl font-bold">Send this link</h2>
        <p className="text-sm text-muted">No account needed. Everyone's budget stays private.</p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-bg p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-sm" title={link}>
          {link}
        </span>
        <Button size="sm" variant="secondary" onClick={copy} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      {canShare && (
        <Button variant="accent" onClick={share} icon={<Share2 className="size-4" aria-hidden />}>
          Share invite
        </Button>
      )}
      <p className="text-xs text-muted">
        Invite code <span className="font-mono font-semibold tracking-widest text-ink">{code}</span> · expires in 48 hours
      </p>
    </Card>
  )
}
