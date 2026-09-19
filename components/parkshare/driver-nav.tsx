'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Home, MapPin, Ticket, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/driver', label: 'Home', icon: Home, exact: true },
  { href: '/driver/find', label: 'Find', icon: MapPin },
  { href: '/driver/bookings', label: 'Bookings', icon: Ticket },
  { href: '/driver/active', label: 'Active', icon: Car },
  { href: '/driver/profile', label: 'Profile', icon: User },
]

function useActive(pathname: string) {
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
}

export function DriverBottomNav() {
  const pathname = usePathname()
  const isActive = useActive(pathname)
  return (
    <nav
      aria-label="Driver navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon className={cn('size-5', active && 'fill-primary/10')} />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function DriverTopNav() {
  const pathname = usePathname()
  const isActive = useActive(pathname)
  return (
    <nav aria-label="Driver navigation" className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active = isActive(item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
