import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Car, Clock, MapPin, Search, Ticket } from "lucide-react";
import { eventApi, lotsById, parkingApi, reservationApi } from "../../api";
import { formatDateTime, formatRwf, formatTime } from "../../lib/format";
import { distanceKm, hasLocation, useGeolocation } from "../../lib/geo";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { ButtonLink, Card, SectionHeading } from "../../components/ui";
import { LotCardCompact, ReservationStatusPill } from "../../components/parking";

export default function DriverHome() {
  const user = useSession()!;
  const geo = useGeolocation(true);
  const { data } = useLoad(async () => {
    const [reservations, lots, events] = await Promise.all([
      reservationApi.listByUser(user.userId).catch(() => []),
      parkingApi.listActive().catch(() => []),
      eventApi.list().catch(() => []),
    ]);
    const names = await lotsById(reservations.map((r) => r.parkingLotId));
    return { reservations, lots, events, names };
  }, [user.userId]);

  const reservations = data?.reservations ?? [];
  const now = Date.now();
  const lotName = (id: number) => data?.names.get(id)?.name ?? `Parking lot #${id}`;

  const active = reservations.find((r) => r.status === "CHECKED_IN");
  const upcoming = reservations
    .filter((r) => ["PENDING", "CONFIRMED"].includes(r.status) && new Date(r.endTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  const nearby = (data?.lots ?? [])
    .map((lot) => ({
      lot,
      distance: geo.position && hasLocation(lot) ? distanceKm(geo.position, { lat: lot.latitude, lng: lot.longitude }) : null,
    }))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    .slice(0, 4);
  const event = (data?.events ?? [])
    .filter((e) => new Date(e.endTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-muted-foreground">Muraho, {user.firstName}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">Where are you parking today?</h1>
        <Link
          to="/driver/find"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Search className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Search parking</span>
            <span className="block text-xs text-muted-foreground">By lot name, street or city</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      {active && (
        <section>
          <SectionHeading title="Active parking" className="mb-3" />
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-success px-4 py-2 text-sm font-medium text-success-foreground">
              <Car className="size-4" />
              You're parked at {lotName(active.parkingLotId)}
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Booked until</p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formatTime(active.endTime)}</p>
                <p className="text-xs text-muted-foreground">Code {active.reservationCode}</p>
              </div>
              <ButtonLink to="/driver/active">
                Manage <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </Card>
        </section>
      )}

      {upcoming && (
        <section>
          <SectionHeading
            title="Upcoming booking"
            action={
              <Link to="/driver/bookings" className="text-sm font-medium text-primary hover:underline">
                All bookings
              </Link>
            }
            className="mb-3"
          />
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{lotName(upcoming.parkingLotId)}</p>
                <div className="mt-1">
                  <ReservationStatusPill status={upcoming.status} />
                </div>
              </div>
              <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-medium">
                {upcoming.reservationCode}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" />
                {formatDateTime(upcoming.startTime)} – {formatTime(upcoming.endTime)}
              </span>
              <span className="ml-auto font-semibold">{formatRwf(upcoming.totalAmount)}</span>
            </div>
            {upcoming.status === "PENDING" && (
              <ButtonLink
                to={`/driver/parking/${upcoming.parkingLotId}/reserve?reservation=${upcoming.id}`}
                size="sm"
                className="mt-3 w-full"
              >
                Pay to confirm
              </ButtonLink>
            )}
          </Card>
        </section>
      )}

      <section>
        <SectionHeading
          title={geo.position ? "Parking near you" : "Open parking"}
          action={
            <Link to="/driver/find" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          }
          className="mb-3"
        />
        {nearby.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {nearby.map(({ lot, distance }) => (
              <LotCardCompact key={lot.id} lot={lot} distance={distance} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            {data ? "No open parking lots yet." : "Loading parking…"}
          </p>
        )}
      </section>

      {event && (
        <section>
          <SectionHeading title="Event parking" className="mb-3" />
          <Link to={`/driver/events/${event.id}`}>
            <Card className="p-4 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <CalendarDays className="size-3.5" /> {formatDateTime(event.startTime)}
                  </span>
                  <p className="mt-1 font-semibold">{event.name}</p>
                  {event.venueName && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {event.venueName}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/driver/find", label: "Find parking", icon: MapPin },
          { to: "/driver/bookings", label: "My bookings", icon: Ticket },
          { to: "/driver/vehicles", label: "My vehicles", icon: Car },
          { to: "/driver/events", label: "Events", icon: CalendarDays },
        ].map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center text-sm font-medium transition-colors hover:border-primary/40"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <s.icon className="size-5" />
            </span>
            {s.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
