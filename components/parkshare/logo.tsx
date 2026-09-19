import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWordmark = true,
  size = 'md',
}: {
  className?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const mark = size === 'sm' ? 'size-7' : size === 'lg' ? 'size-11' : 'size-9'
  const text = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg'
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative grid place-items-center rounded-[30%] bg-primary text-primary-foreground shadow-sm',
          mark,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-2/3">
          <path
            d="M7 20V4h6.2a5 5 0 0 1 0 10H7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn('font-display font-bold tracking-tight text-foreground', text)}>
          Park<span className="text-primary">Share</span>
        </span>
      )}
    </span>
  )
}
