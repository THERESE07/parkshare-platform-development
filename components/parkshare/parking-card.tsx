import Link from 'next/link'
import { Accessibility, Clock, MapPin, ShieldCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ParkingLot, formatRwf, updatedLabel } from '@/lib/parkshare-data'
import { AvailabilityBadge } from './badges'

export function ParkingCard({ lot, className }: { lot: ParkingLot; className?: string }) {
  const bookable = lot.availability !== 'unavailable'
  return (
    <Link
      href={`/driver/parking/${lot.id}`}
      className={cn(
        'block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold leading-tight">{lot.name}</h3>
            {lot.verified && <ShieldCheck className="size-4 shrink-0 text-info" aria-label="Verified operator" />}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {lot.area} · {lot.distanceKm} km
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold leading-none">{formatRwf(lot.priceHour)}</p>
          <p className="text-xs text-muted-foreground">per hour</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AvailabilityBadge status={lot.availability} size="sm" />
        {bookable && lot.availability !== 'full' && (
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {lot.availableSpaces} of {lot.totalSpaces} free
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          Updated {updatedLabel(lot.updatedMinutesAgo)}
        </span>
        <span className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-warning text-warning" />
            {lot.rating.toFixed(1)}
          </span>
          {lot.accessible > 0 && (
            <span className="flex items-center gap-1" title={`${lot.accessible} accessible bays`}>
              <Accessibility className="size-3.5" />
              {lot.accessible}
            </span>
          )}
        </span>
      </div>
    </Link>
  )
}

export function ParkingCardCompact({ lot }: { lot: ParkingLot }) {
  return (
    <Link
      href={`/driver/parking/${lot.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{lot.name}</p>
        <p className="text-xs text-muted-foreground">{lot.area} · {lot.distanceKm} km</p>
        <div className="mt-1.5">
          <AvailabilityBadge status={lot.availability} size="sm" />
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{formatRwf(lot.priceHour)}</p>
        <p className="text-[11px] text-muted-foreground">per hour</p>
      </div>
    </Link>
  )
}
