import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/parkshare/ui'
import { AvailabilityBadge } from '@/components/parkshare/badges'
import { EVENTS, formatRwf } from '@/lib/parkshare-data'

export default function EventsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Event parking</h1>
        <p className="text-sm text-muted-foreground">Reserve ahead for matches, concerts and summits in Kigali.</p>
      </div>

      <div className="space-y-3">
        {EVENTS.map((ev) => {
          const from = Math.min(...ev.zones.filter((z) => z.status !== 'full').map((z) => z.price))
          const anyOpen = ev.zones.some((z) => z.status !== 'full')
          return (
            <Link key={ev.id} href={`/driver/events/${ev.id}`}>
              <Card className="p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <CalendarDays className="size-3.5" /> {ev.date}
                    </span>
                    <h2 className="mt-1 text-lg font-semibold leading-tight">{ev.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {ev.venue} · {ev.area}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-3.5" /> {ev.time}
                    </p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2">
                    {ev.zones.map((z) => (
                      <AvailabilityBadge key={z.id} status={z.status} size="sm" />
                    ))}
                  </div>
                  {anyOpen && (
                    <span className="text-sm text-muted-foreground">
                      from <span className="font-semibold text-foreground">{formatRwf(from)}</span>
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
