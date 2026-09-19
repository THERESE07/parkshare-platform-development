import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
} & VariantProps<typeof buttonVariants> &
  Omit<React.ComponentProps<typeof Link>, 'href'>) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  )
}

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card text-card-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger'
  icon?: React.ReactNode
}) {
  const valueTone =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning-foreground'
        : tone === 'danger'
          ? 'text-destructive'
          : 'text-foreground'
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className={cn('mt-2 font-display text-2xl font-bold tabular-nums', valueTone)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

export function OccupancyBar({
  occupied,
  total,
  className,
}: {
  occupied: number
  total: number
  className?: string
}) {
  const pct = total > 0 ? Math.min(100, Math.round((occupied / total) * 100)) : 0
  const tone = pct >= 95 ? 'bg-destructive' : pct >= 80 ? 'bg-warning' : 'bg-success'
  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Occupancy"
      >
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{pct}% occupied</span>
        <span>{Math.max(0, total - occupied)} free</span>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
  className,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, 'h-11', className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'h-11 appearance-none pr-9', className)} {...props}>
      {children}
    </select>
  )
}
