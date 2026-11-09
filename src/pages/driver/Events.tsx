import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Clock, MapPin, Ticket } from "lucide-react";
import { eventApi, parkingApi, type EventParkingZone } from "../../api";
import { BOOKING_RULES, formatDate, formatRwf, formatTime } from "../../lib/format";
import { useLoad } from "../../lib/useLoad";
import { Alert, BackLink, Card, EmptyState, Loading, OccupancyBar, PageHeader, Pill, cn } from "../../components/ui";

const zoneOpen = (z: EventParkingZone) =>
  (z.status ?? "").toUpperCase() !== "FULL" &&
  (z.status ?? "").toUpperCase() !== "CLOSED" &&
  (z.availableCount ?? 1) > 0;

function ZoneBadge({ zone }: { zone: EventParkingZone }) {
  if (!zoneOpen(zone)) return <Pill tone="danger">Full</Pill>;
  const left = zone.availableCount;
  return (
    <Pill tone={left !== null && zone.capacity && left / zone.capacity < 0.2 ? "warning" : "success"}>
      {left !== null ? `${left} left` : "Open"}
    </Pill>
  );
}

export function Events() {
  const { data, loading, error } = useLoad(async () => {
    const events = (await eventApi.list())
      .filter((e) => new Date(e.endTime).getTime() > Date.now() && (e.status ?? "").toUpperCase() !== "CANCELLED")
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const zones = await Promise.all(events.map((e) => eventApi.zones(e.id).catch(() => [])));
    return events.map((event, i) => ({ event, zones: zones[i] }));
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Event parking" description="Reserve ahead for matches, concerts and summits." />
      {loading && <Loading>Loading events…</Loading>}
      {error && <Alert title="Events could not be loaded">{error}</Alert>}
      {!loading && !error && data?.length === 0 && (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title="No upcoming events"
          description="When organisers publish events with parking, they'll appear here."
        />
      )}
      <div className="space-y-3">
        {data?.map(({ event, zones }) => {
          const prices = zones.filter(zoneOpen).map((z) => Number(z.price)).filter((p) => Number.isFinite(p));
          return (
            <Link key={event.id} to={`/driver/events/${event.id}`} className="block">
              <Card className="p-5 transition-colors hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <CalendarDays className="size-3.5" /> {formatDate(event.startTime)}
                    </span>
                    <h2 className="mt-1 text-lg font-semibold leading-tight">{event.name}</h2>
                    {(event.venueName || event.address) && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" /> {[event.venueName, event.address].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-3.5" /> {formatTime(event.startTime)} – {formatTime(event.endTime)}
                    </p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2">
                    {zones.length ? (
                      zones.map((z) => <ZoneBadge key={z.id} zone={z} />)
                    ) : (
                      <span className="text-sm text-muted-foreground">No parking zones yet</span>
                    )}
                  </div>
                  {prices.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      from <span className="font-semibold text-foreground">{formatRwf(Math.min(...prices))}</span>
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function EventDetail() {
  const eventId = Number(useParams().id);
  const navigate = useNavigate();
  const { data, loading, error } = useLoad(async () => {
    const [event, zones] = await Promise.all([eventApi.get(eventId), eventApi.zones(eventId)]);
    const lots = await Promise.all(zones.map((z) => parkingApi.get(z.parkingLotId).catch(() => null)));
    return { event, zones: zones.map((zone, i) => ({ zone, lot: lots[i] })) };
  }, [eventId]);
  const [zoneId, setZoneId] = useState<number | null>(null);

  if (loading) return <Loading>Loading event…</Loading>;
  if (error || !data)
    return (
      <div>
        <BackLink to="/driver/events">All events</BackLink>
        <Alert title="This event could not be loaded">{error}</Alert>
      </div>
    );

  const { event, zones } = data;
  const selectedId = zoneId ?? zones.find((z) => zoneOpen(z.zone))?.zone.id ?? null;
  const selected = zones.find((z) => z.zone.id === selectedId);

  function reserve() {
    if (!selected) return;
    // Arrive 30 minutes early; book until the event ends.
    const start = new Date(Math.max(new Date(event.startTime).getTime() - 30 * 60000, Date.now() + 10 * 60000));
    const minutes = Math.ceil((new Date(event.endTime).getTime() - start.getTime()) / 1_800_000) * 30;
    const params = new URLSearchParams({
      eventId: String(event.id),
      zoneId: String(selected.zone.id),
      start: start.toISOString(),
      minutes: String(Math.min(Math.max(minutes, BOOKING_RULES.minMinutes), BOOKING_RULES.maxMinutes)),
    });
    navigate(`/driver/parking/${selected.zone.parkingLotId}/reserve?${params}`);
  }

  return (
    <div className="mx-auto max-w-xl pb-10">
      <BackLink to="/driver/events">All events</BackLink>
      <div className="space-y-5">
        <div>
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <CalendarDays className="size-4" /> {formatDate(event.startTime)}
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{event.name}</h1>
          {(event.venueName || event.address) && (
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4" /> {[event.venueName, event.address].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" /> {formatTime(event.startTime)} – {formatTime(event.endTime)}
          </p>
          {event.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.description}</p>}
        </div>

        <div>
          <h2 className="mb-2 font-sans font-semibold tracking-normal">Choose a parking zone</h2>
          {zones.length === 0 && (
            <EmptyState title="No parking zones yet" description="The organiser hasn't added parking for this event." />
          )}
          <div className="space-y-2.5">
            {zones.map(({ zone, lot }) => {
              const open = zoneOpen(zone);
              const isSelected = zone.id === selectedId;
              const used = (zone.reservedCount ?? 0) + (zone.occupiedCount ?? 0);
              return (
                <button
                  key={zone.id}
                  type="button"
                  disabled={!open}
                  onClick={() => setZoneId(zone.id)}
                  className={cn(
                    "w-full rounded-2xl border bg-card p-4 text-left transition-colors",
                    !open && "cursor-not-allowed opacity-60",
                    isSelected && open ? "border-primary bg-accent" : "border-border hover:bg-muted",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{lot?.name ?? `Parking lot #${zone.parkingLotId}`}</p>
                      {lot && <p className="text-xs text-muted-foreground">{lot.address}</p>}
                      <div className="mt-1">
                        <ZoneBadge zone={zone} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold">{formatRwf(zone.price)}</span>
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full border-2",
                          isSelected && open ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                      >
                        {isSelected && open && <Check className="size-3" />}
                      </span>
                    </div>
                  </div>
                  {zone.capacity ? (
                    <div className="mt-3">
                      <OccupancyBar occupied={used} total={zone.capacity} />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {zones.length > 0 && (
          <>
            <button
              type="button"
              disabled={!selected || !zoneOpen(selected.zone)}
              onClick={reserve}
              className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selected ? `Reserve at ${selected.lot?.name ?? "this zone"}` : "All zones are full"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              You'll confirm the exact price, then pay with MTN MoMo or Airtel Money.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
