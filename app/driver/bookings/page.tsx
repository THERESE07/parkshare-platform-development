'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MapPin, Ticket } from 'lucide-react'
import { Card, EmptyState, ButtonLink } from '@/components/parkshare/ui'
import { Pill } from '@/components/parkshare/badges'
import { BOOKINGS, type BookingStatus, formatRwf } from '@/lib/parkshare-data'

const tabs: { key: BookingStatus | 'all'; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusTone: Record<BookingStatus, 'info' | 'success' | 'neutral' | 'danger'> = {
  upcoming: 'info',
  active: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

const payTone = {
  paid: 'success',
  pending: 'warning',
  refunded: 'neutral',
} as const

export default function BookingsPage() {
  const [tab, setTab] = useState<BookingStatus | 'all'>('upcoming')
  const list = BOOKINGS.filter((b) => tab === 'all' || b.status === tab)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
        <p className="text-sm text-muted-foreground">Manage your reservations and parking history.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/50 p-1">
        {tabs.map((t) => {
          const count = BOOKINGS.filter((b) => b.status === t.key).length
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {count > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>}
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title={`No ${tab} bookings`}
          description="When you reserve parking it will appear here."
          action={
            <ButtonLink href="/driver/find" className="h-10 rounded-xl px-4">
              Find parking
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Pill tone={statusTone[b.status]}>{b.status}</Pill>
                    <Pill tone={payTone[b.paymentStatus]}>{b.paymentStatus}</Pill>
                  </div>
                  <Link href={`/driver/parking/${b.lotId}`} className="mt-2 block font-semibold hover:underline">
                    {b.lotName}
                  </Link>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {b.area} · {b.entrance}
                  </p>
                </div>
                <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-medium">{b.ref}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" />
                  {b.date}, {b.arrival}
                  {b.departure !== '—' && `–${b.departure}`}
                </span>
                <span className="text-muted-foreground">
                  {b.vehicle} · {b.plate}
                </span>
                <span className="ml-auto font-semibold">{formatRwf(b.amount)}</span>
              </div>
              {(b.status === 'upcoming' || b.status === 'active') && (
                <div className="mt-3 flex gap-2">
                  {b.status === 'active' ? (
                    <ButtonLink href="/driver/active" size="lg" className="h-10 flex-1 rounded-xl">
                      View active session
                    </ButtonLink>
                  ) : (
                    <>
                      <ButtonLink
                        href={`/driver/parking/${b.lotId}`}
                        variant="outline"
                        size="lg"
                        className="h-10 flex-1 rounded-xl"
                      >
                        Directions
                      </ButtonLink>
                      <button
                        type="button"
                        className="h-10 flex-1 rounded-xl border border-input bg-card text-sm font-medium text-destructive transition-colors hover:bg-danger-muted"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
