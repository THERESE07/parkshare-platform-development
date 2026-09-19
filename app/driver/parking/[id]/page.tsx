import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Accessibility,
  ArrowLeft,
  Car,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { Card, ButtonLink } from '@/components/parkshare/ui'
import { AvailabilityBadge, VerifiedBadge } from '@/components/parkshare/badges'
import { OccupancyBar } from '@/components/parkshare/ui'
import { PARKING_LOTS, formatRwf, getLot, updatedLabel } from '@/lib/parkshare-data'

export function generateStaticParams() {
  return PARKING_LOTS.map((l) => ({ id: l.id }))
}

export default async function ParkingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lot = getLot(id)
  if (!lot) notFound()

  const bookable = lot.availability !== 'unavailable' && lot.availability !== 'full'

  return (
    <div className="pb-24">
      <Link
        href="/driver/find"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to results
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <AvailabilityBadge status={lot.availability} />
              <VerifiedBadge verified={lot.verified} />
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{lot.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              {lot.address} · {lot.distanceKm} km away
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-medium text-foreground">{lot.rating.toFixed(1)}</span> ({lot.reviews} reviews)
              </span>
              <span>Operated by {lot.operator}</span>
            </div>
          </div>

          {/* Live availability */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Live availability</h2>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> Updated {updatedLabel(lot.updatedMinutesAgo)}
              </span>
            </div>
            <div className="mt-3">
              <OccupancyBar occupied={lot.totalSpaces - lot.availableSpaces} total={lot.totalSpaces} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {lot.availability === 'confirmed' &&
                'An attendant confirmed free spaces here recently. Reserve to guarantee your bay.'}
              {lot.availability === 'likely' &&
                'Availability is estimated from recent activity and has not been freshly confirmed.'}
              {lot.availability === 'full' && 'This lot is currently full. Check back or pick a nearby alternative.'}
              {lot.availability === 'unavailable' && 'This lot is temporarily closed by the operator.'}
            </p>
          </Card>

          {/* Directions / entrance */}
          <Card className="p-4">
            <h2 className="font-semibold">Entrance & directions</h2>
            <p className="mt-2 text-sm text-muted-foreground">{lot.entrance}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              {lot.hours}
            </p>
          </Card>

          {/* Security & amenities */}
          <Card className="p-4">
            <h2 className="font-semibold">Security & amenities</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {lot.security.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-sm"
                >
                  <ShieldCheck className="size-3.5 text-info" />
                  {s}
                </span>
              ))}
              {lot.accessible > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-sm">
                  <Accessibility className="size-3.5 text-info" />
                  {lot.accessible} accessible bays
                </span>
              )}
            </div>
          </Card>

          {/* Vehicle types */}
          <Card className="p-4">
            <h2 className="font-semibold">Suitable for</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {lot.vehicleTypes.map((v) => (
                <span key={v} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-sm text-accent-foreground">
                  <Car className="size-3.5" />
                  {v}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Booking sidebar */}
        <div>
          <Card className="p-5 lg:sticky lg:top-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-3xl font-bold">{formatRwf(lot.priceHour)}</p>
                <p className="text-sm text-muted-foreground">per hour</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{formatRwf(lot.priceDay)}</p>
                <p>full day</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2 border-y border-border py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Spaces free now</dt>
                <dd className="font-medium tabular-nums">
                  {bookable ? `${lot.availableSpaces} of ${lot.totalSpaces}` : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hours</dt>
                <dd className="font-medium">{lot.open24 ? '24 hours' : 'See details'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Covered</dt>
                <dd className="font-medium">{lot.covered ? 'Yes' : 'No'}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-muted-foreground">{lot.cancellation}</p>

            {bookable ? (
              <ButtonLink
                href={`/driver/parking/${lot.id}/reserve`}
                size="lg"
                className="mt-4 h-12 w-full rounded-xl text-base"
              >
                Reserve a space
              </ButtonLink>
            ) : (
              <button
                type="button"
                disabled
                className="mt-4 h-12 w-full cursor-not-allowed rounded-xl bg-muted text-base font-medium text-muted-foreground"
              >
                {lot.availability === 'full' ? 'Currently full' : 'Temporarily unavailable'}
              </button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Pay with MTN MoMo, Airtel Money or card
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
