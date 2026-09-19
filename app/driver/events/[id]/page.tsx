'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, CircleCheck, Clock, MapPin } from 'lucide-react'
import { Card, ButtonLink } from '@/components/parkshare/ui'
import { AvailabilityBadge } from '@/components/parkshare/badges'
import { OccupancyBar } from '@/components/parkshare/ui'
import { QRCode } from '@/components/parkshare/qr'
import { getEvent, formatRwf } from '@/lib/parkshare-data'
import { cn } from '@/lib/utils'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const event = getEvent(id)
  if (!event) notFound()

  const bookableZones = event.zones.filter((z) => z.status !== 'full')
  const [zoneId, setZoneId] = useState<string>(bookableZones[0]?.id ?? event.zones[0].id)
  const [confirmed, setConfirmed] = useState(false)
  const zone = event.zones.find((z) => z.id === zoneId)!
  const ref = 'PS-EV' + Math.floor(100 + Math.random() * 899)

  if (confirmed) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="p-6 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-muted text-success">
            <CircleCheck className="size-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Event parking reserved</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.name} · {zone.name}
          </p>
          <div className="mx-auto mt-6 w-44 rounded-2xl border border-border p-3">
            <QRCode value={ref} className="h-auto w-full" />
          </div>
          <p className="mt-3 font-mono text-lg font-semibold tracking-wider">{ref}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Paid {formatRwf(zone.price)} · Show at {zone.name.split('—')[1]?.trim() ?? 'the gate'}
          </p>
          <div className="mt-6 flex gap-3">
            <ButtonLink href="/driver/events" variant="outline" size="lg" className="h-12 flex-1 rounded-xl text-base">
              All events
            </ButtonLink>
            <ButtonLink href="/driver/bookings" size="lg" className="h-12 flex-1 rounded-xl text-base">
              My bookings
            </ButtonLink>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl pb-10">
      <Link
        href="/driver/events"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All events
      </Link>

      <div className="space-y-5">
        <div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <CalendarDays className="size-4" /> {event.date}
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" /> {event.venue} · {event.area}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" /> {event.time}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Organised by {event.organizer}</p>
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Choose a parking zone</h2>
          <div className="space-y-2.5">
            {event.zones.map((z) => {
              const full = z.status === 'full'
              const selected = z.id === zoneId
              return (
                <button
                  key={z.id}
                  type="button"
                  disabled={full}
                  onClick={() => setZoneId(z.id)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-colors',
                    full && 'cursor-not-allowed opacity-60',
                    selected && !full ? 'border-primary bg-accent' : 'border-border hover:bg-muted',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{z.name}</p>
                      <div className="mt-1">
                        <AvailabilityBadge status={z.status} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold">{formatRwf(z.price)}</span>
                      <span
                        className={cn(
                          'grid size-5 place-items-center rounded-full border-2',
                          selected && !full ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                        )}
                      >
                        {selected && !full && <Check className="size-3" />}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <OccupancyBar occupied={z.occupied} total={z.capacity} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={zone.status === 'full'}
          onClick={() => setConfirmed(true)}
          className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reserve {zone.name.split('—')[0].trim()} · {formatRwf(zone.price)}
        </button>
        <p className="text-center text-xs text-muted-foreground">Pay with MTN MoMo, Airtel Money or card</p>
      </div>
    </div>
  )
}
