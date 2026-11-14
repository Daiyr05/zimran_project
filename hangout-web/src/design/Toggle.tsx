import { cn } from '@/lib/cn'

/** On/off switch with role="switch". */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40',
        checked ? 'bg-brand' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-1 size-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}
