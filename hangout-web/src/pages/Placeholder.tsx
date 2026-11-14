import { Hammer } from 'lucide-react'
import { Badge, Card } from '@/design'

interface PlaceholderProps {
  title: string
  description: string
  requirements: string
}

/** Temporary screen for routes not built yet. Replace each one as you build it. */
export function Placeholder({ title, description, requirements }: PlaceholderProps) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      <Card className="flex items-start gap-4 p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand dark:text-ink">
          <Hammer className="size-5" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-ink">{description}</p>
          <div>
            <Badge>{requirements}</Badge>
          </div>
        </div>
      </Card>
    </section>
  )
}
