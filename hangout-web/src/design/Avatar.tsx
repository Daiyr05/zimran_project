import { cn } from '@/lib/cn'

const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-20 text-2xl' }

/** Profile photo, or the first letter on a brand circle. */
export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  src?: string | null
  size?: keyof typeof sizes
  className?: string
}) {
  return src ? (
    <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover', sizes[size], className)} />
  ) : (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-brand font-display font-bold text-brand-ink',
        sizes[size],
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
