import { Link } from "react-router-dom";
import { ArrowRight, Car, CircleParking, MapPinned, TrendingUp, Wallet } from "lucide-react";
import { formatDate, formatDateTime, formatRwf } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, ButtonLink, Card, EmptyState, Loading, OccupancyBar, PageHeader, Stat } from "../../components/ui";
import { LotStatusPill, ReservationStatusPill } from "../../components/parking";
import { inUse, isFree, loadOperatorLots } from "./data";

const EARNING = ["CONFIRMED", "CHECKED_IN", "COMPLETED"];

export default function OperatorOverview() {
  const user = useSession()!;
  const { data, loading, error } = useLoad(() => loadOperatorLots(user.userId), [user.userId]);

  if (loading) return <Loading>Loading your lots…</Loading>;
  if (error) return <Alert title="Your console could not be loaded">{error}</Alert>;

  const lots = data ?? [];
  if (lots.length === 0) {
    return (
      <div>
        <PageHeader title="Overview" description={`${formatDate(new Date().toISOString())} · Welcome, ${user.firstName}.`} />
        <EmptyState
          icon={<MapPinned className="size-6" />}
          title="List your first parking lot"
          description="Add your lot, its zones and spaces. An admin approves it before drivers can book."
          action={<ButtonLink to="/operator/lots?new=1">Add a lot</ButtonLink>}
        />
      </div>
    );
  }

  const spaces = lots.flatMap((l) => l.spaces);
  const occupied = spaces.filter(inUse).length;
  const free = spaces.filter(isFree).length;
  const reservations = lots.flatMap((l) => l.reservations.map((r) => ({ r, lotName: l.lot.name })));
  const todayKey = new Date().toDateString();
  const todayRevenue = reservations
    .filter(({ r }) => EARNING.includes(r.status) && new Date(r.startTime).toDateString() === todayKey)
    .reduce((s, { r }) => s + Number(r.totalAmount || 0), 0);
  const now = Date.now();
  const upcoming = reservations.filter(
    ({ r }) => ["PENDING", "CONFIRMED"].includes(r.status) && new Date(r.startTime).getTime() > now,
  ).length;
  const recent = [...reservations].sort((a, b) => b.r.startTime.localeCompare(a.r.startTime)).slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`${formatDate(new Date().toISOString())} · Live across your ${lots.length} ${lots.length === 1 ? "lot" : "lots"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Occupancy now"
          value={spaces.length ? `${Math.round((occupied / spaces.length) * 100)}%` : "—"}
          hint={spaces.length ? `${occupied} of ${spaces.length} spaces in use` : "No spaces registered"}
          icon={<CircleParking className="size-4" />}
          tone="warning"
        />
        <Stat label="Spaces free" value={free} hint={`Across ${lots.length} lots`} icon={<Car className="size-4" />} tone="success" />
        <Stat label="Today's bookings" value={formatRwf(todayRevenue)} hint="Paid reservations starting today" icon={<Wallet className="size-4" />} />
        <Stat label="Upcoming reservations" value={upcoming} hint="Pending or confirmed" icon={<TrendingUp className="size-4" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans font-semibold tracking-normal">Your lots</h2>
            <Link to="/operator/lots" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {lots.map(({ lot, spaces: lotSpaces, rules }) => {
              const hourly = rules.find((r) => r.pricingType === "HOURLY");
              return (
                <Card key={lot.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{lot.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lot.city}
                        {hourly ? ` · ${formatRwf(hourly.amount)}/hr` : " · standard rate"}
                      </p>
                    </div>
                    <LotStatusPill status={lot.status} />
                  </div>
                  <div className="mt-3">
                    {lotSpaces.length ? (
                      <OccupancyBar occupied={lotSpaces.filter(inUse).length} total={lotSpaces.length} />
                    ) : (
                      <p className="text-xs text-muted-foreground">No spaces registered yet.</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans font-semibold tracking-normal">Recent reservations</h2>
            <Link to="/operator/reservations" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All <ArrowRight className="size-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No reservations yet.
            </p>
          ) : (
            <Card className="divide-y divide-border">
              {recent.map(({ r, lotName }) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">{r.reservationCode}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lotName} · {formatDateTime(r.startTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatRwf(r.totalAmount)}</p>
                    <ReservationStatusPill status={r.status} />
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
