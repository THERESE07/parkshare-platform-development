import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Logo } from '@/components/parkshare/logo'
import { DriverBottomNav, DriverTopNav } from '@/components/parkshare/driver-nav'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/driver" aria-label="ParkShare home">
            <Logo size="sm" />
          </Link>
          <DriverTopNav />
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
            </button>
            <Link
              href="/driver/profile"
              className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-label="Your profile"
            >
              AU
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
      <DriverBottomNav />
    </div>
  )
}
