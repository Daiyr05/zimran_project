import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-28 w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-base text-ink',
          'placeholder:text-muted focus:border-brand focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
