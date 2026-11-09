import { useEffect, useState } from "react";
import { Car, Clock, MapPin, Timer } from "lucide-react";
import { parkingApi, reservationApi } from "../../lib/api";
import { formatDateTime, formatRwf, formatTime } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, ButtonLink, Card, EmptyState, Loading, Pill, QrPass } from "../../components/ui";

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function ActiveParking() {
  const user = useSession()!;
  const { data, loading, error } = useLoad(async () => {
    const reservations = await reservationApi.listByUser(user.userId);
    const active = reservations
      .filter((r) => r.status === "CHECKED_IN")
      .sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
    const lot = active ? await parkingApi.get(active.parkingLotId).catch(() => null) : null;
    return { active, lot };
  }, [user.userId]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (loading) return <Loading>Checking for an active session…</Loading>;
  if (error) return <Alert title="Your session could not be loaded">{error}</Alert>;

  const active = data?.active;
  if (!active) {
    return (
      <EmptyState
        icon={<Car className="size-6" />}
        title="No active parking session"
        description="When the attendant checks you in at a reserved space, your live session appears here."
        action={<ButtonLink to="/driver/bookings">My bookings</ButtonLink>}
      />
    );
  }

  const start = new Date(active.startTime).getTime();
  const end = new Date(active.endTime).getTime();
  const remaining = (end - now) / 1000;
  const overstay = remaining < 0;
  const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const lotName = data?.lot?.name ?? `Parking lot #${active.parkingLotId}`;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active parking</h1>
        <p className="text-sm text-muted-foreground">Your live session at {lotName}.</p>
      </div>

      <Card className="overflow-hidden">
        <div
          className={
            overstay
              ? "flex items-center gap-2 bg-warning px-4 py-2.5 text-sm font-medium text-warning-foreground"
              : "flex items-center gap-2 bg-success px-4 py-2.5 text-sm font-medium text-success-foreground"
          }
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          {overstay ? "Past your booked time" : "Parked · checked in"}
        </div>
        <div className="p-5 text-center">
          <p className="text-sm text-muted-foreground">{overstay ? "Overstay" : "Time remaining"}</p>
          <p className="mt-1 font-display text-5xl font-bold tabular-nums">{clock(Math.abs(remaining))}</p>
          <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-muted">
            <div className={overstay ? "h-full bg-warning" : "h-full bg-success"} style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1.5">
              <Timer className="size-4 text-muted-foreground" />
              {formatTime(active.startTime)} – {formatTime(active.endTime)}
            </span>
            <span className="font-semibold">Paid {formatRwf(active.totalAmount)}</span>
          </div>
          {overstay && (
            <p className="mt-3 text-xs text-warning-foreground">
              Time past your booking is charged at the lot's normal rate when you check out.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-semibold tracking-normal">Exit reference</h2>
          <Pill tone="info">{active.reservationCode}</Pill>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Show this code to the attendant at the exit to check out.
        </p>
        <QrPass value={active.reservationCode} className="mt-4 w-40" />
      </Card>

      <Card className="space-y-2.5 p-5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" /> Location
          </span>
          <span className="text-right font-medium">
            {lotName}
            {data?.lot && <span className="block text-xs font-normal text-muted-foreground">{data.lot.address}</span>}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" /> Booked until
          </span>
          <span className="font-medium">{formatDateTime(active.endTime)}</span>
        </div>
      </Card>
    </div>
  );
}
