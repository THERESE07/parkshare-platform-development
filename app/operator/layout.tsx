import { CalendarClock, LayoutDashboard, MapPinned, Settings, Wallet } from 'lucide-react'
import { ConsoleShell, type NavItem } from '@/components/parkshare/console-shell'

const nav: NavItem[] = [
  { href: '/operator', label: 'Overview', icon: LayoutDashboard },
  { href: '/operator/lots', label: 'My lots', icon: MapPinned },
  { href: '/operator/reservations', label: 'Reservations', icon: CalendarClock },
  { href: '/operator/revenue', label: 'Revenue', icon: Wallet },
  { href: '/operator/settings', label: 'Settings', icon: Settings },
]

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell
      role="Operator console"
      subtitle="Century Real Estate"
      nav={nav}
      user={{ name: 'Century Real Estate', initials: 'CR', meta: 'Kimihurura · 3 lots' }}
    >
      {children}
    </ConsoleShell>
  )
}
