'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Clock,
  CreditCard,
  MapPin,
  Smartphone,
} from 'lucide-react'
import { Card, ButtonLink, Field, Input, Select } from '@/components/parkshare/ui'
import { QRCode } from '@/components/parkshare/qr'
import { getLot, formatRwf, type ParkingLot, type VehicleType } from '@/lib/parkshare-data'
import { cn } from '@/lib/utils'

const DURATIONS = [1, 2, 3, 4, 6, 8]
const VEHICLES: VehicleType[] = ['Sedan', 'SUV / 4x4', 'Pickup', 'Motorcycle', 'Minibus']
const PAYMENTS = [
  { id: 'momo', label: 'MTN MoMo', hint: 'Mobile money', icon: Smartphone },
  { id: 'airtel', label: 'Airtel Money', hint: 'Mobile money', icon: Smartphone },
  { id: 'card', label: 'Card', hint: 'Visa / Mastercard', icon: CreditCard },
] as const

const steps = ['Details', 'Payment', 'Confirmed'] as const

export default function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const lot = getLot(id)
  if (!lot) notFound()

  const [step, setStep] = useState(0)
  const [arrival, setArrival] = useState('14:30')
  const [duration, setDuration] = useState(2)
  const [vehicle, setVehicle] = useState<VehicleType>(lot.vehicleTypes[0])
  const [plate, setPlate] = useState('')
  const [payment, setPayment] = useState<(typeof PAYMENTS)[number]['id']>('momo')
  const [phone, setPhone] = useState('')

  const total = useMemo(() => lot.priceHour * duration, [lot.priceHour, duration])
  const ref = useMemo(() => 'PS-' + id.slice(0, 2).toUpperCase() + Math.floor(1000 + Math.random() * 8999), [id])
  const paymentLabel = PAYMENTS.find((p) => p.id === payment)?.label ?? ''

  const detailsValid = plate.trim().length >= 4
  const paymentValid = payment === 'card' || phone.trim().length >= 9

  return (
    <div className="mx-auto max-w-xl pb-10">
      <Link
        href={`/driver/parking/${lot.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {lot.name}
      </Link>

      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors',
                i < step && 'bg-success text-success-foreground',
                i === step && 'bg-primary text-primary-foreground',
                i > step && 'bg-muted text-muted-foreground',
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn('text-sm font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="ml-auto hidden h-px flex-1 bg-border sm:block" />}
          </li>
        ))}
      </ol>

      {/* Step 1 — details */}
      {step === 0 && (
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Arrival time" htmlFor="arrival">
                <Input id="arrival" type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} />
              </Field>
              <Field label="Duration" htmlFor="duration">
                <Select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? 'hour' : 'hours'}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vehicle type" htmlFor="vehicle">
                <Select id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleType)}>
                  {VEHICLES.filter((v) => lot.vehicleTypes.includes(v)).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Number plate" htmlFor="plate" hint="e.g. RAD 421 C">
                <Input
                  id="plate"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="RAD 000 A"
                />
              </Field>
            </div>
          </Card>

          <PriceSummary lot={lot} arrival={arrival} duration={duration} total={total} />

          <button
            type="button"
            disabled={!detailsValid}
            onClick={() => setStep(1)}
            className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to payment
          </button>
          {!detailsValid && (
            <p className="text-center text-xs text-muted-foreground">Enter your number plate to continue.</p>
          )}
        </div>
      )}

      {/* Step 2 — payment */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <p className="text-sm font-medium">Choose a payment method</p>
            <div className="grid gap-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayment(p.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                    payment === p.id ? 'border-primary bg-accent' : 'border-border hover:bg-muted',
                  )}
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-card text-foreground shadow-sm">
                    <p.icon className="size-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                  <span
                    className={cn(
                      'grid size-5 place-items-center rounded-full border-2',
                      payment === p.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {payment === p.id && <Check className="size-3" />}
                  </span>
                </button>
              ))}
            </div>

            {payment !== 'card' ? (
              <Field label="Mobile money number" htmlFor="phone" hint="You'll get a prompt to approve the payment.">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="078 000 0000"
                />
              </Field>
            ) : (
              <div className="grid gap-4">
                <Field label="Card number" htmlFor="card">
                  <Input id="card" inputMode="numeric" placeholder="4242 4242 4242 4242" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Expiry" htmlFor="exp">
                    <Input id="exp" placeholder="MM/YY" />
                  </Field>
                  <Field label="CVC" htmlFor="cvc">
                    <Input id="cvc" placeholder="123" />
                  </Field>
                </div>
              </div>
            )}
          </Card>

          <PriceSummary lot={lot} arrival={arrival} duration={duration} total={total} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="h-12 flex-1 rounded-xl border border-input bg-card text-base font-medium transition-colors hover:bg-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!paymentValid}
              onClick={() => setStep(2)}
              className="h-12 flex-[2] rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pay {formatRwf(total)}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — confirmed */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-muted text-success">
              <CircleCheck className="size-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold">Reservation confirmed</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paid {formatRwf(total)} with {paymentLabel}. Show this pass at the entrance.
            </p>

            <div className="mx-auto mt-6 w-44 rounded-2xl border border-border p-3">
              <QRCode value={ref} className="h-auto w-full" />
            </div>
            <p className="mt-3 font-mono text-lg font-semibold tracking-wider">{ref}</p>

            <dl className="mt-6 space-y-2.5 rounded-xl bg-secondary/60 p-4 text-left text-sm">
              <Row icon={<MapPin className="size-4" />} label={lot.name} value={lot.area} />
              <Row icon={<Clock className="size-4" />} label="Arrival" value={`${arrival} · ${duration}h`} />
              <Row label="Vehicle" value={`${vehicle} · ${plate}`} />
              <Row label="Entrance" value={lot.entrance.split('.')[0]} />
            </dl>
          </Card>

          <div className="flex gap-3">
            <ButtonLink href="/driver/bookings" variant="outline" size="lg" className="h-12 flex-1 rounded-xl text-base">
              My bookings
            </ButtonLink>
            <ButtonLink href="/driver" size="lg" className="h-12 flex-1 rounded-xl text-base">
              Done
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  )
}

function PriceSummary({
  lot,
  arrival,
  duration,
  total,
}: {
  lot: ParkingLot
  arrival: string
  duration: number
  total: number
}) {
  return (
    <Card className="p-4">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {formatRwf(lot.priceHour)} × {duration} {duration === 1 ? 'hour' : 'hours'}
          </dt>
          <dd className="font-medium tabular-nums">{formatRwf(lot.priceHour * duration)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Arrival</dt>
          <dd className="font-medium">{arrival}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display font-bold tabular-nums">{formatRwf(total)}</dd>
        </div>
      </dl>
    </Card>
  )
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
