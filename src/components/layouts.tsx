import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Car,
  ChevronLeft,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinned,
  Ticket,
  User,
  type LucideIcon,
} from "lucide-react";
import { authApi, notificationApi } from "../lib/api";
import { homeFor, initials, isOperator, useSession } from "../lib/session";
import { cn, Logo } from "./ui";

function useSignOut() {
  const navigate = useNavigate();
  return () => {
    authApi.logout();
    navigate("/");
  };
}

/** Sends visitors to sign-in and brings them back afterwards. */
function RequireSignIn({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

/* ---------- Public site ---------- */

export function PublicLayout() {
  const user = useSession();
  const signOut = useSignOut();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="ParkShare home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="/#how" className="hover:text-primary">
              How it works
            </a>
            <a href="/#trust" className="hover:text-primary">
              Trusted availability
            </a>
            <Link to="/driver/find" className="hover:text-primary">
              Find parking
            </Link>
            <Link to="/driver/events" className="hover:text-primary">
              Events
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={signOut}
                  className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent sm:block"
                >
                  Sign out
                </button>
                <Link
                  to={homeFor(user)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-dark"
                >
                  My ParkShare <ArrowRight className="size-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent sm:px-4"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-dark"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

/* ---------- Driver app ---------- */

const driverNav: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/driver", label: "Home", icon: Home, end: true },
  { to: "/driver/find", label: "Find", icon: MapPin },
  { to: "/driver/bookings", label: "Bookings", icon: Ticket },
  { to: "/driver/active", label: "Active", icon: Car },
  { to: "/driver/profile", label: "Profile", icon: User },
];

function UnreadBell({ userId }: { userId: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    notificationApi
      .unread(userId)
      .then((list) => active && setCount(list.length))
      .catch(() => active && setCount(0));
    return () => {
      active = false;
    };
  }, [userId]);
  return (
    <span
      aria-label={count ? `${count} unread notifications` : "No unread notifications"}
      title={count ? `${count} unread notifications` : "No unread notifications"}
      className="relative grid size-9 place-items-center rounded-full text-muted-foreground"
    >
      <Bell className="size-5" />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-card" />
      )}
    </span>
  );
}

function DriverShell() {
  const user = useSession()!;
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/driver" aria-label="ParkShare driver home">
            <Logo size="sm" />
          </Link>
          <nav aria-label="Driver navigation" className="hidden items-center gap-1 md:flex">
            {driverNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isOperator(user) && (
              <Link
                to="/operator"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-accent sm:block"
              >
                Operator console
              </Link>
            )}
            <UnreadBell userId={user.userId} />
            <Link
              to="/driver/profile"
              aria-label="Your profile"
              className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            >
              {initials(user.firstName, user.lastName)}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <nav
        aria-label="Driver navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {driverNav.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function DriverLayout() {
  return (
    <RequireSignIn>
      <DriverShell />
    </RequireSignIn>
  );
}

/* ---------- Operator console ---------- */

const operatorNav: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/operator", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/operator/lots", label: "My lots", icon: MapPinned },
  { to: "/operator/reservations", label: "Reservations", icon: CalendarClock },
];

function OperatorShell() {
  const user = useSession()!;
  const signOut = useSignOut();
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  if (!isOperator(user)) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-xl font-bold">Operator access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as {user.email}, which doesn't have the OPERATOR role. Create an operator account to
            list parking, or continue as a driver.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/driver" className="rounded-xl border border-input px-4 py-2.5 text-sm font-semibold">
              Driver app
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-muted/60 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border px-5 py-4">
          <Link to="/operator" aria-label="Operator overview">
            <Logo />
          </Link>
        </div>
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Operator console</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{name}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {operatorNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials(user.firstName, user.lastName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            Back to ParkShare
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link to="/operator">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {initials(user.firstName, user.lastName)}
          </button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
        <nav className="sticky bottom-0 z-20 grid grid-flow-col border-t border-border bg-card/95 backdrop-blur lg:hidden">
          {operatorNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <item.icon className="size-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function OperatorLayout() {
  return (
    <RequireSignIn>
      <OperatorShell />
    </RequireSignIn>
  );
}
