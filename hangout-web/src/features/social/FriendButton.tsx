import { Ban, Check, Clock, UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useAnswerRequest, useBlockUser, useRemoveFriend, useSendRequest } from '@/api/social'
import type { Friendship } from '@/api/types'
import { Button, Dialog, Menu } from '@/design'

interface Props {
  user: { id: string; name: string; username: string }
  friendship: Friendship
  requestId?: string | null
  size?: 'sm' | 'md'
}

const fail = (e: unknown, fallback: string) => toast.error(e instanceof ApiError ? e.message : fallback)

/** The one friend action that fits the current state (FR-SOCIAL-1, 2, 5). */
export function FriendButton({ user, friendship, requestId, size = 'md' }: Props) {
  const send = useSendRequest()
  const answer = useAnswerRequest()
  const remove = useRemoveFriend()
  const block = useBlockUser()
  const [confirm, setConfirm] = useState<'remove' | 'block' | null>(null)

  const run = async (fn: () => Promise<unknown>, ok: string, fallback: string) => {
    try {
      await fn()
      toast.success(ok)
      setConfirm(null)
    } catch (e) {
      fail(e, fallback)
    }
  }

  const blockItem = { label: 'Block', icon: <Ban className="size-4" aria-hidden />, danger: true, onSelect: () => setConfirm('block') }

  let main
  if (friendship === 'SELF') return null
  if (friendship === 'NONE')
    main = (
      <Button size={size} loading={send.isPending} icon={<UserPlus className="size-4" aria-hidden />} onClick={() => run(() => send.mutateAsync(user.username), `Request sent to ${user.name}`, 'Could not send the request.')}>
        Add friend
      </Button>
    )
  else if (friendship === 'REQUEST_SENT')
    main = (
      <Button size={size} variant="secondary" loading={answer.isPending} icon={<Clock className="size-4" aria-hidden />} onClick={() => requestId && run(() => answer.mutateAsync({ id: requestId, accept: false }), 'Request canceled', 'Could not cancel.')}>
        Requested · Cancel
      </Button>
    )
  else if (friendship === 'REQUEST_RECEIVED')
    main = (
      <div className="flex gap-2">
        <Button size={size} loading={answer.isPending && answer.variables?.accept} icon={<Check className="size-4" aria-hidden />} onClick={() => requestId && run(() => answer.mutateAsync({ id: requestId, accept: true }), `You and ${user.name} are friends`, 'Could not accept.')}>
          Accept
        </Button>
        <Button size={size} variant="secondary" loading={answer.isPending && !answer.variables?.accept} onClick={() => requestId && run(() => answer.mutateAsync({ id: requestId, accept: false }), 'Request declined', 'Could not decline.')}>
          Decline
        </Button>
      </div>
    )
  else
    main = (
      <Button size={size} variant="secondary" disabled icon={<Check className="size-4" aria-hidden />} className="disabled:opacity-100">
        Friends
      </Button>
    )

  return (
    <div className="flex items-center gap-1">
      {main}
      <Menu
        label={`More actions for ${user.name}`}
        items={
          friendship === 'FRIENDS'
            ? [{ label: 'Remove friend', icon: <UserMinus className="size-4" aria-hidden />, onSelect: () => setConfirm('remove') }, blockItem]
            : [blockItem]
        }
      />
      <Dialog open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === 'block' ? `Block ${user.name}?` : `Remove ${user.name}?`}>
        <p className="text-muted">
          {confirm === 'block'
            ? `${user.name} won't be able to find you, see your Moments or send you requests. They aren't told.`
            : `You'll stop seeing each other's friends-only Moments. You can add them again later.`}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            className="bg-bad text-white"
            loading={remove.isPending || block.isPending}
            onClick={() =>
              confirm === 'block'
                ? run(() => block.mutateAsync(user.id), `${user.name} is blocked`, 'Could not block.')
                : run(() => remove.mutateAsync(user.id), `${user.name} removed`, 'Could not remove.')
            }
          >
            {confirm === 'block' ? 'Block' : 'Remove'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
