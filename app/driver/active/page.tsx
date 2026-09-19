'use client'

import { useEffect, useState } from 'react'
import { Car, Clock, MapPin, Timer } from 'lucide-react'
import { Card, EmptyState, ButtonLink } from '@/components/parkshare/ui'
import { QRCode } from '@/components/parkshare/qr'
import { Pill } from '@/components/parkshare/badges'
import { BOOKINGS, getLot, formatRwf } from '@/lib/parkshare-data'

export default function ActivePage() {
  const active = BOOKINGS.find((b) => b.status === 'active')
  const lot = active ? getLot(active.lotId) : undefined

  // live elapsed timer starting from a fixed base for a realistic feel
  const [seconds, setSeconds] = useState(2 * 3600 + 14 * 60)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!active || !lot) {
    return (
      <EmptyState
        icon={<Car className="size-6" />}
        title="No active parking session"
        description="When you check in to a reserved space, your live session appears here."
        action={
          <ButtonLink href="/driver/find" className="h-10 rounded-xl px-4">
            Find parking
          </ButtonLink>
        }
      />
    )
  }

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const elapsedHours = seconds / 3600
  const runningCost = Math.max(lot.priceHour, Math.ceil(elapsedHours) * lot.priceHour)

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active parking</h1>
        <p className="text-sm text-muted-foreground">Your live session at {lot.name}.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 bg-success px-4 py-2.5 text-sm font-medium text-success-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-foreground/70" />
            <span className="relative inline-flex size-2 rounded-full bg-success-foreground" />
          </span>
          Parked · checked in {active.arrival}
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-muted-foreground">Time parked</p>
          <p className="mt-1 font-display text-5xl font-bold tabular-nums">
            {h}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1.5">
              <Timer className="size-4 text-muted-foreground" />
              {formatRwf(lot.priceHour)}/hr
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              Running total {formatRwf(runningCost)}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Exit pass</h2>
          <Pill tone="info">{active.ref}</Pill>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Scan at the barrier to check out and settle.</p>
        <div className="mx-auto mt-4 w-40 rounded-2xl border border-border p-3">
          <QRCode value={active.ref} className="h-auto w-full" />
        </div>
      </Card>

      <Card className="space-y-2.5 p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" /> Location</span>
          <span className="font-medium">{lot.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Car className="size-4" /> Vehicle</span>
          <span className="font-medium">{active.vehicle} · {active.plate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /> Entrance</span>
          <span className="font-medium">{active.entrance}</span>
        </div>
      </Card>

      <button
        type="button"
        className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        End session & pay {formatRwf(runningCost)}
      </button>
    </div>
  )
}
