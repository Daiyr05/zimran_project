import { ArrowLeft, ArrowRight, ImagePlus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'
import { checkPhoto, PHOTO_TYPES } from '@/lib/image'

/** A photo already uploaded (url) or picked and waiting for upload (file). */
export interface PhotoItem {
  id: string
  preview: string
  file?: File
  url?: string
}

const MAX = 10

/** Pick, drop, preview, reorder and remove up to 10 photos (FR-MOMENT-1, SRS 8.3 MomentForm). */
export function PhotoPicker({
  value,
  onChange,
  error,
}: {
  value: PhotoItem[]
  onChange: (items: PhotoItem[]) => void
  error?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const add = (files: FileList | File[]) => {
    const list = [...files]
    const room = MAX - value.length
    if (list.length > room) toast(`Up to ${MAX} photos. Added the first ${Math.max(room, 0)}.`)
    const accepted: PhotoItem[] = []
    for (const file of list.slice(0, Math.max(room, 0))) {
      const problem = checkPhoto(file)
      if (problem) {
        toast.error(problem)
        continue
      }
      accepted.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) })
    }
    if (accepted.length) onChange([...value, ...accepted])
  }

  const remove = (id: string) => {
    const item = value.find((p) => p.id === id)
    if (item?.file) URL.revokeObjectURL(item.preview)
    onChange(value.filter((p) => p.id !== id))
  }

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          add(e.dataTransfer.files)
        }}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {value.map((p, i) => (
          <figure key={p.id} className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2">
            <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(p.id)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-ink/70 text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              {i > 0 ? (
                <button type="button" onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`} className="grid size-8 place-items-center rounded-full bg-ink/70 text-white">
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
              ) : (
                <span />
              )}
              {i < value.length - 1 && (
                <button type="button" onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`} className="grid size-8 place-items-center rounded-full bg-ink/70 text-white">
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </figure>
        ))}
        {value.length < MAX && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm font-semibold text-muted transition hover:border-brand hover:text-brand',
              dragging ? 'border-brand bg-brand-soft' : error ? 'border-bad/60' : 'border-line',
              value.length === 0 && 'col-span-3 aspect-[3/1] sm:col-span-4 sm:aspect-[4/1]',
            )}
          >
            <ImagePlus className="size-6" aria-hidden />
            {value.length === 0 ? 'Add photos (or drop them here)' : 'Add'}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) add(e.target.files)
          e.target.value = ''
        }}
      />
      <p className="text-sm text-muted">
        {value.length}/{MAX} · JPEG, PNG or WebP, up to 5 MB each. The first photo is the cover.
      </p>
    </div>
  )
}
