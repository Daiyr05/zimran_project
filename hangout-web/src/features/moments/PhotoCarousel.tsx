import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/** Swipe on phones, arrows on desktop, dots show where you are (SRS 8.3 MomentCard). */
export function PhotoCarousel({
  photos,
  alt,
  aspect = 'aspect-[4/3]',
  className,
}: {
  photos: string[]
  alt: string
  aspect?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const go = (i: number) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  if (photos.length === 0) return null

  return (
    <div className={cn('group relative overflow-hidden rounded-2xl bg-surface-2', className)}>
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className={cn('flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]', aspect)}
        aria-roledescription="carousel"
        aria-label={`${photos.length} photo${photos.length > 1 ? 's' : ''}`}
      >
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt}, photo ${i + 1} of ${photos.length}`}
            loading="lazy"
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn('size-1.5 rounded-full bg-white/60 transition', i === index && 'w-4 bg-white')}
              />
            ))}
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white group-hover:grid"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white group-hover:grid"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          )}
        </>
      )}
    </div>
  )
}
