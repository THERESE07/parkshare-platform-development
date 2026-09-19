import { BadgeCheck, Circle, CircleAlert, CircleCheck, CircleSlash, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AVAILABILITY_META, type AvailabilityStatus } from '@/lib/parkshare-data'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'

const toneClasses: Record<Tone, string> = {
  success: 'bg-success-muted text-success border-success/20',
  warning: 'bg-warning-muted text-warning-foreground border-warning/30',
  danger: 'bg-danger-muted text-destructive border-destructive/20',
  info: 'bg-info-muted text-info border-info/20',
  neutral: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-accent text-accent-foreground border-primary/15',
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const statusIcon: Record<AvailabilityStatus, typeof Circle> = {
  confirmed: CircleCheck,
  likely: CircleAlert,
  full: CircleX,
  unavailable: CircleSlash,
}

const statusTone: Record<AvailabilityStatus, Tone> = {
  confirmed: 'success',
  likely: 'warning',
  full: 'danger',
  unavailable: 'neutral',
}

export function AvailabilityBadge({
  status,
  className,
  size = 'md',
}: {
  status: AvailabilityStatus
  className?: string
  size?: 'sm' | 'md'
}) {
  const Icon = statusIcon[status]
  const meta = AVAILABILITY_META[status]
  return (
    <Pill tone={statusTone[status]} className={cn(size === 'sm' && 'px-2 py-0.5 text-[11px]', className)}>
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden="true" />
      {meta.label}
    </Pill>
  )
}

export function VerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  if (!verified) {
    return (
      <Pill tone="neutral" className={className}>
        <Circle className="size-3" aria-hidden="true" />
        Unverified
      </Pill>
    )
  }
  return (
    <Pill tone="info" className={className}>
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      Verified operator
    </Pill>
  )
}
