import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  /** Hide the visible title (screen readers still read it). */
  hideTitle?: boolean
}

/**
 * Modal on the native <dialog>: focus trap, Esc to close and a backdrop for free.
 * Bottom sheet on phones, centered card on larger screens.
 */
export function Dialog({ open, onClose, title, children, className, hideTitle }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      // A nested dialog's close event reaches this one through React; only react to our own.
      onClose={(e) => e.target === e.currentTarget && onClose()}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        'm-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl border border-line bg-surface p-0 text-ink shadow-card',
        'backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-card',
        className,
      )}
    >
      {open && (
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className={cn('font-display text-xl font-bold', hideTitle && 'sr-only')}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-auto grid size-10 shrink-0 place-items-center rounded-full hover:bg-surface-2"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
