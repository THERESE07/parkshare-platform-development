import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  Car,
  ChevronLeft,
  Home,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MapPin,
  MapPinned,
  Moon,
  ScanLine,
  ShieldCheck,
  Sun,
  Ticket,
  User,
  type LucideIcon,
} from "lucide-react";
import { WAKING_EVENT, authApi, isServerWaking, meApi, notificationApi, type Notification } from "../api";
import { formatDateTime } from "../lib/format";
import { canUseConsole, hasRole, homeFor, initials, isAdmin, isOperator, useSession, useSessionRestoring } from "../lib/session";
import { useTheme } from "../lib/theme";
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
  const restoring = useSessionRestoring();
  const location = useLocation();
  if (restoring) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin text-primary" /> Signing you in…
        </span>
      </div>
    );
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

/* ---------- Shared header pieces ---------- */

/** Switches between the standard light theme and dark mode. */
export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={cn(
        "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

/** "Waking up the server…" while any request takes unusually long (free trial servers sleep). */
function WakingBanner() {
  const [waking, setWaking] = useState(isServerWaking());
  useEffect(() => {
    const sync = () => setWaking(isServerWaking());
    window.addEventListener(WAKING_EVENT, sync);
    return () => window.removeEventListener(WAKING_EVENT, sync);
  }, []);
  if (!waking) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[1000] flex justify-center p-2">
      <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        Waking up the server… this can take up to a minute.
      </span>
    </div>
  );
}

const NOTIFICATION_POLL_MS = 45_000;

/** Bell with the user's notifications (paged API, polled; push isn't available yet). */
function NotificationsBell({ userId }: { userId: number }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.readAt).length;

  useEffect(() => {
    let active = true;
    const load = () =>
      notificationApi
        .list(userId)
        .then((page) => active && setItems(page.content))
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(() => document.visibilityState === "visible" && load(), NOTIFICATION_POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !panel.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  async function markRead(n: Notification) {
    if (n.readAt) return;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    await notificationApi.markRead(n.id).catch(() => undefined);
  }

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        className="relative grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</p>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markRead(n)}
                    className={cn("block w-full px-4 py-3 text-left text-sm hover:bg-muted", !n.readAt && "bg-accent/50")}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium">{n.title || "ParkShare"}</span>
                      {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </span>
                    {n.message && <span className="mt-0.5 block text-muted-foreground">{n.message}</span>}
                    <span className="mt-1 block text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Reminds signed-in users to confirm their phone/email codes (sent at registration). */
function VerifyNudge() {
  const [missing, setMissing] = useState<string[]>([]);
  const location = useLocation();
  useEffect(() => {
    meApi
      .get()
      .then((me) => setMissing([!me.phoneVerified && "phone", !me.emailVerified && "email"].filter(Boolean) as string[]))
      .catch(() => undefined);
  }, [location.pathname]);
  if (missing.length === 0 || location.pathname === "/verify") return null;
  return (
    <div className="border-b border-warning/30 bg-warning-muted px-4 py-2 text-center text-sm text-warning-foreground">
      Please verify your {missing.join(" and ")}.{" "}
      <Link to={`/verify?next=${encodeURIComponent(location.pathname)}`} className="font-semibold underline">
        Enter your code
      </Link>
    </div>
  );
}

/** Site-wide footer. */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-border", className)}>
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-sm text-muted-foreground sm:px-6">
        <p>© 2026 ParkShare. All rights reserved.</p>
        <p>Kigali, Rwanda · Parking made simpler.</p>
      </div>
    </footer>
  );
}

/* ---------- Public site ---------- */

export function PublicLayout() {
  const user = useSession();
  const signOut = useSignOut();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <WakingBanner />
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
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
                <Link to="/login" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent sm:px-4">
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
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter className="bg-card" />
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

function DriverShell() {
  const user = useSession()!;
  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 md:pb-0">
      <WakingBanner />
      <header className="sticky top-0 z-[500] border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
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
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {canUseConsole(user) && (
              <Link to={homeFor(user)} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-accent sm:block">
                Console
              </Link>
            )}
            <ThemeToggle />
            <NotificationsBell userId={user.userId} />
            <Link
              to="/driver/profile"
              aria-label="Your profile"
              className="ml-1 grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            >
              {initials(user.firstName, user.lastName)}
            </Link>
          </div>
        </div>
      </header>
      <VerifyNudge />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
      <SiteFooter />
      <nav aria-label="Driver navigation" className="fixed inset-x-0 bottom-0 z-[500] border-t border-border bg-card/95 backdrop-blur md:hidden">
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

/* ---------- Operator / attendant / admin console ---------- */

type ConsoleNav = { to: string; label: string; icon: LucideIcon; end?: boolean; show: (u: ReturnType<typeof useSession>) => boolean };
const consoleNav: ConsoleNav[] = [
  { to: "/operator", label: "Overview", icon: LayoutDashboard, end: true, show: isOperator },
  { to: "/operator/lots", label: "My lots", icon: MapPinned, show: isOperator },
  { to: "/operator/reservations", label: "Reservations", icon: CalendarClock, show: isOperator },
  { to: "/operator/gate", label: "Gate", icon: ScanLine, show: canUseConsole },
  { to: "/operator/admin", label: "Admin", icon: ShieldCheck, show: isAdmin },
];

function ConsoleShell() {
  const user = useSession()!;
  const signOut = useSignOut();
  const location = useLocation();
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  const nav = consoleNav.filter((item) => item.show(user));
  const roleLabel = isAdmin(user) ? "Admin console" : hasRole(user, "OPERATOR") ? "Operator console" : "Gate console";

  if (!canUseConsole(user)) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <Logo className="justify-center" />
          <h1 className="mt-6 text-xl font-bold">Staff access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as {user.email}. The console is for parking operators, attendants and admins.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/driver" className="rounded-xl border border-input px-4 py-2.5 text-sm font-semibold">
              Driver app
            </Link>
            <button type="button" onClick={signOut} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }
  // Attendants only have the gate.
  const onProfile = location.pathname.startsWith("/operator/profile");
  if (!onProfile && !nav.some((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))) {
    return <Navigate to={nav[0].to} replace />;
  }

  return (
    <div className="min-h-dvh bg-muted/60 lg:grid lg:grid-cols-[260px_1fr]">
      <WakingBanner />
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link to={homeFor(user)} aria-label="Console home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{name}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-xl px-1 py-1">
            <NavLink
              to="/operator/profile"
              aria-label="Your profile"
              className={({ isActive }) =>
                cn("flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 hover:bg-muted", isActive && "bg-accent")
              }
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials(user.firstName, user.lastName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{name}</span>
                <span className="block truncate text-xs text-muted-foreground">View profile</span>
              </span>
            </NavLink>
            <NotificationsBell userId={user.userId} />
          </div>
          <Link to="/" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
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

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-[500] flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link to={homeFor(user)}>
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationsBell userId={user.userId} />
            <Link
              to="/operator/profile"
              aria-label="Your profile"
              className="ml-1 grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {initials(user.firstName, user.lastName)}
            </Link>
          </div>
        </header>
        <VerifyNudge />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
        <SiteFooter />
        {nav.length > 1 && (
          <nav className="sticky bottom-0 z-[500] grid grid-flow-col border-t border-border bg-card/95 backdrop-blur lg:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")
                }
              >
                <item.icon className="size-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function OperatorLayout() {
  return (
    <RequireSignIn>
      <ConsoleShell />
    </RequireSignIn>
  );
}

/** Pages that need a session but no app chrome (e.g. account verification). */
export function SignedInLayout() {
  return (
    <RequireSignIn>
      <Outlet />
    </RequireSignIn>
  );
}
