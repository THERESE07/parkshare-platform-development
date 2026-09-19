import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Car,
  CircleCheck,
  ClipboardList,
  Clock,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Ticket,
  Wallet,
} from 'lucide-react'
import { Logo } from '@/components/parkshare/logo'
import { Card, ButtonLink } from '@/components/parkshare/ui'
import { AvailabilityBadge, Pill } from '@/components/parkshare/badges'

const roles = [
  {
    href: '/driver',
    title: 'Driver',
    desc: 'Find verified parking, reserve ahead, pay with MoMo and arrive with confidence.',
    icon: Car,
  },
  {
    href: '/operator',
    title: 'Parking operator',
    desc: 'Manage lots, capacity, pricing, live occupancy, reservations and revenue.',
    icon: ClipboardList,
  },
  {
    href: '/attendant',
    title: 'Attendant',
    desc: 'Scan, verify and check vehicles in and out — fast, even on weak connectivity.',
    icon: ScanLine,
  },
  {
    href: '/organizer',
    title: 'Event organizer',
    desc: 'Create event parking zones, set capacity and monitor arrivals in real time.',
    icon: Ticket,
  },
  {
    href: '/admin',
    title: 'ParkShare admin',
    desc: 'Verify operators, resolve disputes, oversee payments and audit the network.',
    icon: ShieldCheck,
  },
]

const steps = [
  { icon: MapPin, title: 'Find', desc: 'Search your destination in Kigali and compare verified parking near you.' },
  { icon: CircleCheck, title: 'Reserve', desc: 'Pick your arrival window and confirm a real, held space.' },
  { icon: Wallet, title: 'Pay', desc: 'MTN MoMo, Airtel Money or card. No cash, no queues.' },
  { icon: QrCode, title: 'Arrive', desc: 'Show your QR at the entrance, check in and park with confidence.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#trust" className="hover:text-foreground">Trusted availability</a>
            <a href="#roles" className="hover:text-foreground">For your role</a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/operator" variant="ghost" size="lg" className="hidden h-10 px-4 sm:inline-flex">
              Operator sign in
            </ButtonLink>
            <ButtonLink href="/driver" size="lg" className="h-10 rounded-xl px-4">
              Open the app
              <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Pill tone="primary" className="mb-5">
                <MapPin className="size-3.5" />
                Built in Kigali · launching across Rwanda
              </Pill>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Know your parking. Reserve it. Arrive with confidence.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
                ParkShare is Rwanda&apos;s trusted parking network. See which spaces are actually
                available right now, reserve ahead, and pay with the methods you already use.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/driver" size="lg" className="h-12 rounded-xl px-6 text-base">
                  Find parking now
                  <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="#roles" variant="outline" size="lg" className="h-12 rounded-xl px-6 text-base">
                  Explore by role
                </ButtonLink>
              </div>
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  ['1,300+', 'verified spaces'],
                  ['24', 'partner locations'],
                  ['< 30s', 'to reserve'],
                ].map(([n, l]) => (
                  <div key={l}>
                    <dt className="font-display text-2xl font-bold text-foreground">{n}</dt>
                    <dd className="text-sm text-muted-foreground">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Hero preview card */}
            <div className="relative">
              <Card className="p-3 shadow-xl shadow-primary/5">
                <div className="rounded-xl bg-secondary/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Near Kigali City Centre</p>
                    <span className="text-xs text-muted-foreground">4 results</span>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {[
                      { name: 'Kigali Heights Parking', area: 'Kimihurura · 1.2 km', price: '700 RWF/hr', status: 'confirmed' as const, updated: '6 min ago' },
                      { name: 'Kigali City Tower Basement', area: 'City Centre · 0.4 km', price: '500 RWF/hr', status: 'confirmed' as const, updated: '3 min ago' },
                      { name: 'Union Trade Centre', area: 'City Centre · 0.7 km', price: '500 RWF/hr', status: 'likely' as const, updated: '41 min ago' },
                    ].map((p) => (
                      <div key={p.name} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold leading-tight">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.area}</p>
                          </div>
                          <span className="whitespace-nowrap text-sm font-semibold">{p.price}</span>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <AvailabilityBadge status={p.status} size="sm" />
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="size-3" /> {p.updated}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card p-3 shadow-lg sm:flex sm:items-center sm:gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-success-muted text-success">
                  <BadgeCheck className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold leading-tight">Verified operators</p>
                  <p className="text-[11px] text-muted-foreground">Every listing is checked</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Real-time that means something
              </h2>
              <p className="mt-3 text-muted-foreground text-pretty">
                Most apps show a pin and hope for the best. ParkShare shows you the availability
                status, when it was last confirmed, and who verified it — so you never drive to a
                full lot.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['confirmed', 'likely', 'full', 'unavailable'] as const).map((s) => (
                <Card key={s} className="p-4">
                  <AvailabilityBadge status={s} />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {s === 'confirmed' && 'Freshly verified by the operator or an attendant on site.'}
                    {s === 'likely' && 'Based on recent occupancy — shown with an honest timestamp.'}
                    {s === 'full' && 'No free spaces. We surface verified alternatives instantly.'}
                    {s === 'unavailable' && 'Closed or paused — never bookable until it reopens.'}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">From search to parked in four steps</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              A single trusted flow that connects your reservation to the real parking experience.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Card key={step.title} className="relative p-5">
                <span className="absolute right-4 top-4 font-display text-3xl font-bold text-muted/60">
                  {i + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <step.icon className="size-5" />
                </span>
                <p className="mt-4 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">One network, purpose-built for each role</h2>
              <p className="max-w-xl text-muted-foreground">
                Drivers, operators, attendants, organizers and administrators each get an experience
                designed around the job they actually do.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => (
                <Link key={role.href} href={role.href} className="group">
                  <Card className="flex h-full flex-col p-5 transition-colors hover:border-primary/40 hover:bg-card">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <role.icon className="size-5" />
                    </span>
                    <p className="mt-4 flex items-center gap-1.5 font-semibold">
                      {role.title}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{role.desc}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            Rwanda-first parking network · MTN MoMo · Airtel Money · Kigali
          </p>
          <p className="text-xs text-muted-foreground">© 2026 ParkShare Rwanda Ltd.</p>
        </div>
      </footer>
    </div>
  )
}
