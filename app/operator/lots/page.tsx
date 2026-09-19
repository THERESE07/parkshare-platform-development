'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Card, OccupancyBar } from '@/components/parkshare/ui'
import { PageHeader } from '@/components/parkshare/console-shell'
import { AvailabilityBadge, VerifiedBadge } from '@/components/parkshare/badges'
import { PARKING_LOTS, formatRwf, type AvailabilityStatus } from '@/lib/parkshare-data'
import { cn } from '@/lib/utils'

const statuses: AvailabilityStatus[] = ['confirmed', 'likely', 'full', 'unavailable']
const statusLabel: Record<AvailabilityStatus, string> = {
  confirmed: 'Confirm available',
  likely: 'Mark likely',
  full: 'Mark full',
  unavailable: 'Pause lot',
}

export default function OperatorLots() {
  const myLots = PARKING_LOTS.filter((l) => ['op-century', 'op-kcc', 'op-kct'].includes(l.operatorId))
  const [overrides, setOverrides] = useState<Record<string, AvailabilityStatus>>({})

  return (
    <div>
      <PageHeader
        title="My lots"
        description="Update live availability so drivers see the truth."
        action={
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" /> Add lot
          </button>
        }
      />

      <div className="space-y-4">
        {myLots.map((lot) => {
          const current = overrides[lot.id] ?? lot.availability
          return (
            <Card key={lot.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{lot.name}</h2>
                    <VerifiedBadge verified={lot.verified} />
                  </div>
                  <p className="text-sm text-muted-foreground">{lot.address}</p>
                </div>
                <AvailabilityBadge status={current} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <OccupancyBar occupied={lot.totalSpaces - lot.availableSpaces} total={lot.totalSpaces} />
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Rate <span className="font-semibold text-foreground">{formatRwf(lot.priceHour)}/hr</span></span>
                  <span className="text-muted-foreground">Capacity <span className="font-semibold text-foreground">{lot.totalSpaces}</span></span>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Set availability</p>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => {
                    const active = current === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setOverrides((o) => ({ ...o, [lot.id]: s }))}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted',
                        )}
                      >
                        {active && <Check className="size-3.5" />}
                        {statusLabel[s]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
