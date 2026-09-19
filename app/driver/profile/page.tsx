import Link from 'next/link'
import {
  Bell,
  Car,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Shield,
  Smartphone,
  Star,
} from 'lucide-react'
import { Card } from '@/components/parkshare/ui'
import { Pill } from '@/components/parkshare/badges'
import { BOOKINGS, formatRwf } from '@/lib/parkshare-data'

export default function ProfilePage() {
  const completed = BOOKINGS.filter((b) => b.status === 'completed').length
  const totalSpent = BOOKINGS.filter((b) => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0)

  const vehicles = [
    { plate: 'RAD 421 C', type: 'SUV / 4x4', label: 'Toyota RAV4', primary: true },
    { plate: 'RAB 908 D', type: 'Sedan', label: 'Toyota Corolla', primary: false },
  ]

  const payments = [
    { icon: Smartphone, label: 'MTN MoMo', detail: '078 •• •• 42', primary: true },
    { icon: Smartphone, label: 'Airtel Money', detail: '073 •• •• 15', primary: false },
    { icon: CreditCard, label: 'Visa card', detail: '•••• 4242', primary: false },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            AU
          </span>
          <div>
            <h1 className="text-xl font-bold">Aline Uwase</h1>
            <p className="text-sm text-muted-foreground">aline.uwase@gmail.com</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Pill tone="info"><Shield className="size-3" /> Verified driver</Pill>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-warning text-warning" /> 4.9
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <div>
            <p className="font-display text-xl font-bold">{completed}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{formatRwf(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Spent</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Vehicles</p>
          </div>
        </div>
      </Card>

      {/* Vehicles */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">My vehicles</h2>
        <Card className="divide-y divide-border">
          {vehicles.map((v) => (
            <div key={v.plate} className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Car className="size-5" />
              </span>
              <div className="flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {v.plate}
                  {v.primary && <Pill tone="primary">Primary</Pill>}
                </p>
                <p className="text-sm text-muted-foreground">{v.label} · {v.type}</p>
              </div>
            </div>
          ))}
          <button type="button" className="flex w-full items-center justify-between p-4 text-sm font-medium text-primary hover:bg-muted">
            Add a vehicle
            <ChevronRight className="size-4" />
          </button>
        </Card>
      </section>

      {/* Payment methods */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment methods</h2>
        <Card className="divide-y divide-border">
          {payments.map((p) => (
            <div key={p.label} className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-foreground">
                <p.icon className="size-5" />
              </span>
              <div className="flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {p.label}
                  {p.primary && <Pill tone="primary">Default</Pill>}
                </p>
                <p className="text-sm text-muted-foreground">{p.detail}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      {/* Settings list */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Settings</h2>
        <Card className="divide-y divide-border">
          {[
            { icon: Bell, label: 'Notifications' },
            { icon: Shield, label: 'Privacy & security' },
            { icon: HelpCircle, label: 'Help & support' },
          ].map((s) => (
            <button key={s.label} type="button" className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted">
              <s.icon className="size-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{s.label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </Card>
      </section>

      <Link
        href="/"
        className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-destructive hover:bg-danger-muted"
      >
        <LogOut className="size-4" />
        Sign out
      </Link>
    </div>
  )
}
