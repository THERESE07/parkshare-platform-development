import Link from 'next/link'
import { ArrowRight, Car, Clock, MapPin, Search, Ticket } from 'lucide-react'
import { Card, ButtonLink, SectionHeading } from '@/components/parkshare/ui'
import { ParkingCardCompact } from '@/components/parkshare/parking-card'
import { AvailabilityBadge } from '@/components/parkshare/badges'
import { BOOKINGS, EVENTS, PARKING_LOTS, formatRwf, getLot } from '@/lib/parkshare-data'

export default function DriverHome() {
  const active = BOOKINGS.find((b) => b.status === 'active')
  const upcoming = BOOKINGS.find((b) => b.status === 'upcoming')
  const activeLot = active ? getLot(active.lotId) : undefined
  const nearby = PARKING_LOTS.filter((l) => l.availability !== 'unavailable').slice(0, 4)
  const event = EVENTS[0]

  return (
    <div className="space-y-8">
      {/* Greeting + search */}
      <section>
        <p className="text-sm text-muted-foreground">Muraho, Aline</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">Where are you parking today?</h1>
        <Link
          href="/driver/find"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Search className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Search a destination in Kigali</span>
            <span className="block text-xs text-muted-foreground">Kacyiru · City Centre · Remera · Kimihurura…</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      {/* Active parking */}
      {active && activeLot && (
        <section>
          <SectionHeading title="Active parking" className="mb-3" />
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-success px-4 py-2 text-sm font-medium text-success-foreground">
              <Car className="size-4" />
              You&apos;re parked at {activeLot.name}
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Checked in {active.arrival} · {active.entrance}</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">2h 14m</p>
                <p className="text-xs text-muted-foreground">Running · {formatRwf(activeLot.priceHour)}/hr</p>
              </div>
              <ButtonLink href="/driver/active" className="h-10 rounded-xl px-4">
                Manage
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </Card>
        </section>
      )}

      {/* Upcoming booking */}
      {upcoming && (
        <section>
          <SectionHeading
            title="Upcoming booking"
            action={<Link href="/driver/bookings" className="text-sm font-medium text-primary hover:underline">All bookings</Link>}
            className="mb-3"
          />
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{upcoming.lotName}</p>
                <p className="text-sm text-muted-foreground">{upcoming.area} · {upcoming.entrance}</p>
              </div>
              <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-medium">{upcoming.ref}</span>
            </div>
            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" />
                {upcoming.date}, {upcoming.arrival}–{upcoming.departure}
              </span>
              <span className="ml-auto font-semibold">{formatRwf(upcoming.amount)}</span>
            </div>
          </Card>
        </section>
      )}

      {/* Nearby */}
      <section>
        <SectionHeading
          title="Verified parking near you"
          action={<Link href="/driver/find" className="text-sm font-medium text-primary hover:underline">See map</Link>}
          className="mb-3"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {nearby.map((lot) => (
            <ParkingCardCompact key={lot.id} lot={lot} />
          ))}
        </div>
      </section>

      {/* Event */}
      <section>
        <SectionHeading title="Event parking" className="mb-3" />
        <Link href={`/driver/events/${event.id}`}>
          <Card className="p-4 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Ticket className="size-3.5" /> {event.date}
                </span>
                <p className="mt-1 font-semibold">{event.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" /> {event.venue} · {event.area}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              {event.zones.map((z) => (
                <span key={z.id} className="flex items-center gap-1.5 text-xs">
                  <AvailabilityBadge status={z.status} size="sm" />
                </span>
              ))}
            </div>
          </Card>
        </Link>
      </section>

      {/* Shortcuts */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/driver/find', label: 'Find parking', icon: MapPin },
          { href: '/driver/bookings', label: 'My bookings', icon: Ticket },
          { href: '/driver/active', label: 'Active parking', icon: Car },
          { href: '/driver/events', label: 'Events', icon: Search },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center text-sm font-medium transition-colors hover:border-primary/40"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <s.icon className="size-5" />
            </span>
            {s.label}
          </Link>
        ))}
      </section>
    </div>
  )
}
