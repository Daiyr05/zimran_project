import { AnimatePresence, motion } from 'framer-motion'
import { Check, Crown, Loader2 } from 'lucide-react'
import type { Session } from '@/api/types'
import { Card } from '@/design'
import { cn } from '@/lib/cn'

/** Who has answered or voted, updated live (FR-INVITE-6). */
export function MemberList({ session }: { session: Session }) {
  const voting = session.status !== 'OPEN'
  const done = session.members.filter((m) => (voting ? m.hasVoted : m.hasAnswered)).length
  const waiting = session.members.filter((m) => !(voting ? m.hasVoted : m.hasAnswered))

  const headline =
    done === session.members.length
      ? voting
        ? 'Everyone voted'
        : 'Everyone answered'
      : `Waiting for ${waiting.map((m) => m.displayName).join(', ')}…`

  return (
    <Card className="flex flex-col gap-4 p-5" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{voting ? 'Votes' : 'Answers'}</h2>
        <span className="text-sm font-semibold text-muted tabular-nums">
          {done}/{session.members.length}
        </span>
      </div>
      <p className="text-sm font-medium">{headline}</p>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {session.members.map((m) => {
            const ok = voting ? m.hasVoted : m.hasAnswered
            return (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft font-display font-bold text-brand dark:text-ink">
                  {m.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-medium">
                  {m.displayName}
                  {m.isOrganizer && <Crown className="size-3.5 text-warn" aria-label="Organizer" />}
                  {session.me?.memberId === m.id && <span className="text-sm text-muted">(you)</span>}
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                    ok ? 'bg-good/10 text-good' : 'bg-surface-2 text-muted',
                  )}
                >
                  {ok ? <Check className="size-3.5" aria-hidden /> : <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                  {ok ? (voting ? 'Voted' : 'Ready') : voting ? 'Voting' : 'Answering'}
                </span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </Card>
  )
}
