'use client'

import { cn } from '@/lib/utils'
import type { AvailabilityStatus, ParkingLot } from '@/lib/parkshare-data'
import { formatRwf } from '@/lib/parkshare-data'

const pinTone: Record<AvailabilityStatus, string> = {
  confirmed: 'bg-success text-success-foreground',
  likely: 'bg-warning text-warning-foreground',
  full: 'bg-destructive text-destructive-foreground',
  unavailable: 'bg-muted-foreground text-background',
}

export function MapSurface({
  lots,
  activeId,
  onSelect,
  className,
}: {
  lots: ParkingLot[]
  activeId?: string
  onSelect?: (id: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-secondary',
        className,
      )}
    >
      {/* schematic street grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, color-mix(in oklch, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 55%, transparent) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      {/* a couple of "main roads" */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute left-0 right-0 top-[52%] h-2 -translate-y-1/2 bg-background/70" />
        <div className="absolute bottom-0 top-0 left-[46%] w-2 -translate-x-1/2 bg-background/70" />
      </div>

      <span className="absolute left-3 top-3 rounded-md bg-card/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        Kigali · schematic view
      </span>

      {lots.map((lot) => {
        const active = lot.id === activeId
        return (
          <button
            key={lot.id}
            type="button"
            onClick={() => onSelect?.(lot.id)}
            style={{ left: `${lot.map.x}%`, top: `${lot.map.y}%` }}
            className={cn(
              'group absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none',
            )}
            aria-label={`${lot.name}, ${lot.availableSpaces} spaces, ${formatRwf(lot.priceHour)} per hour`}
          >
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold shadow-md ring-2 ring-card transition-transform',
                pinTone[lot.availability],
                active ? 'scale-110' : 'group-hover:scale-105',
              )}
            >
              {lot.availability === 'full' || lot.availability === 'unavailable'
                ? '—'
                : lot.availableSpaces}
            </span>
            <span
              className={cn(
                'mx-auto block size-2 w-px rotate-0 border-l-2',
                active ? 'border-foreground' : 'border-transparent',
              )}
            />
            {active && (
              <span className="absolute left-1/2 top-full mt-1 w-max max-w-[160px] -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-lg">
                {lot.name}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
