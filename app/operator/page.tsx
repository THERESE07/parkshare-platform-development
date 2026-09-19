import Link from 'next/link'
import { ArrowRight, Car, CircleParking, TrendingUp, Wallet } from 'lucide-react'
import { Card, Stat, OccupancyBar } from '@/components/parkshare/ui'
import { PageHeader } from '@/components/parkshare/console-shell'
import { AvailabilityBadge, Pill } from '@/components/parkshare/badges'
import { OPERATOR_RESERVATIONS, PARKING_LOTS, formatRwf } from '@/lib/parkshare-data'

export default function OperatorOverview() {
  const myLots = PARKING_LOTS.filter((l) =>
    ['op-century', 'op-kcc', 'op-kct'].includes(l.operatorId),
  ).slice(0, 3)

  const totalSpaces = myLots.reduce((s, l) => s + l.totalSpaces, 0)
  const freeSpaces = myLots.reduce((s, l) => s + l.availableSpaces, 0)
  const occupied = totalSpaces - freeSpaces
  const todayRevenue = OPERATOR_RESERVATIONS.filter((r) => r.payment === 'paid').reduce((s, r) => s + r.amount, 0)
  const upcoming = OPERATOR_RESERVATIONS.filter((r) => r.status === 'reserved').length

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Sunday, 26 Sep 2026 · Live across your Kigali lots."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Occupancy now" value={`${Math.round((occupied / totalSpaces) * 100)}%`} hint={`${occupied} of ${totalSpaces} bays`} icon={<CircleParking className="size-4" />} tone="warning" />
        <Stat label="Spaces free" value={freeSpaces} hint="Across 3 lots" icon={<Car className="size-4" />} tone="success" />
        <Stat label="Today's revenue" value={formatRwf(todayRevenue)} hint="+12% vs last Sun" icon={<Wallet className="size-4" />} />
        <Stat label="Upcoming reservations" value={upcoming} hint="Next 4 hours" icon={<TrendingUp className="size-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Lots */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Your lots</h2>
            <Link href="/operator/lots" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {myLots.map((lot) => (
              <Card key={lot.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{lot.name}</p>
                    <p className="text-sm text-muted-foreground">{lot.area} · {formatRwf(lot.priceHour)}/hr</p>
                  </div>
                  <AvailabilityBadge status={lot.availability} size="sm" />
                </div>
                <div className="mt-3">
                  <OccupancyBar occupied={lot.totalSpaces - lot.availableSpaces} total={lot.totalSpaces} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent reservations */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent reservations</h2>
            <Link href="/operator/reservations" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All <ArrowRight className="size-4" />
            </Link>
          </div>
          <Card className="divide-y divide-border">
            {OPERATOR_RESERVATIONS.slice(0, 5).map((r) => (
              <div key={r.ref} className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.driver}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.plate} · {r.arrival}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatRwf(r.amount)}</p>
                  <Pill tone={r.payment === 'paid' ? 'success' : 'warning'}>{r.payment}</Pill>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  )
}
