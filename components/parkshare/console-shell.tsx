'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/parkshare/logo'
import { cn } from '@/lib/utils'

export type NavItem = { href: string; label: string; icon: LucideIcon }

export function ConsoleShell({
  role,
  subtitle,
  nav,
  user,
  children,
}: {
  role: string
  subtitle: string
  nav: NavItem[]
  user: { name: string; initials: string; meta: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-dvh bg-muted/40 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Logo />
        </div>
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{role}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.meta}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            Switch role
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-dvh flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {user.initials}
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-20 grid grid-flow-col border-t border-border bg-card/95 backdrop-blur lg:hidden">
          {nav.slice(0, 5).map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
