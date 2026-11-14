import { Hourglass, LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { Button, Card } from '@/design'

/** Not found, expired or offline: a clear message instead of a blank screen (SRS 8.4). */
export function SessionProblem({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = error instanceof ApiError ? error.status : 0
  const expired = status === 410
  const missing = status === 404

  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      {expired ? <Hourglass className="size-10 text-muted" aria-hidden /> : <LinkIcon className="size-10 text-muted" aria-hidden />}
      <h1 className="text-2xl font-bold">
        {expired ? 'This invite has expired' : missing ? "We couldn't find this invite" : 'Something went wrong'}
      </h1>
      <p className="text-muted">
        {expired
          ? 'Invites last 48 hours. Ask the organizer to send a new one.'
          : missing
            ? 'Check the link, or ask the organizer to send it again.'
            : error instanceof Error
              ? error.message
              : 'Please try again.'}
      </p>
      {expired || missing ? (
        <Link to="/">
          <Button variant="secondary">Go to Hangout</Button>
        </Link>
      ) : (
        <Button onClick={onRetry}>Try again</Button>
      )}
    </Card>
  )
}
