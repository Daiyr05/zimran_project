import { Link } from 'react-router-dom'
import { Button } from '@/design'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold">This page took a wrong turn</h1>
      <p className="text-muted">The link may be old or mistyped.</p>
      <Link to="/">
        <Button>Back home</Button>
      </Link>
    </div>
  )
}
