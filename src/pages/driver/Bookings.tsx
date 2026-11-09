import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, QrCode, Ticket } from "lucide-react";
import { parkingApi, reservationApi, type CurrentQr, type Reservation } from "../../lib/api";
import {
  CLOSED_STATUSES,
  UPCOMING_STATUSES,
  errorMessage,
  formatDateTime,
  formatRwf,
  formatTime,
} from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, ButtonLink, Card, EmptyState, Loading, PageHeader, QrPass, buttonClass, cn } from "../../components/ui";
import { ReservationStatusPill } from "../../components/parking";

type TabKey = "upcoming" | "active" | "completed" | "cancelled";
const tabs: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "upcoming", label: "Upcoming", statuses: UPCOMING_STATUSES },
  { key: "active", label: "Active", statuses: ["CHECKED_IN"] },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled", statuses: CLOSED_STATUSES },
];

export default function Bookings() {
  const user = useSession()!;
  const { data, setData, loading, error } = useLoad(async () => {
    const [reservations, lots] = await Promise.all([
      reservationApi.listByUser(user.userId),
      parkingApi.list().catch(() => []),
    ]);
    return { reservations, lots };
  }, [user.userId]);
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [passes, setPasses] = useState<Record<number, CurrentQr | string>>({});

  const reservations = data?.reservations ?? [];
  const lotName = (id: number) => data?.lots.find((l) => l.id === id)?.name ?? `Parking lot #${id}`;
  const current = tabs.find((t) => t.key === tab)!;
  const list = reservations
    .filter((r) => current.statuses.includes(r.status))
    .sort((a, b) =>
      tab === "upcoming" ? a.startTime.localeCompare(b.startTime) : b.startTime.localeCompare(a.startTime),
    );

  async function cancel(r: Reservation) {
    if (!window.confirm(`Cancel reservation ${r.reservationCode}?`)) return;
    setBusyId(r.id);
    setNotice("");
    setActionError("");
    try {
      const result = await reservationApi.cancel(r.id);
      setData((d) =>
        d ? { ...d, reservations: d.reservations.map((x) => (x.id === r.id ? result.reservation : x)) } : d,
      );
      setNotice(
        result.refundAmount
          ? `Reservation cancelled. ${formatRwf(result.refundAmount)} will be refunded to your mobile money.`
          : "Reservation cancelled.",
      );
    } catch (cause) {
      setActionError(errorMessage(cause, "The reservation could not be cancelled."));
    } finally {
      setBusyId(null);
    }
  }

  async function togglePass(r: Reservation) {
    if (passes[r.id]) {
      setPasses(({ [r.id]: _, ...rest }) => rest);
      return;
    }
    try {
      const qr = await reservationApi.qr(r.id);
      setPasses((p) => ({ ...p, [r.id]: qr }));
    } catch (cause) {
      setPasses((p) => ({ ...p, [r.id]: errorMessage(cause, "Pass unavailable.") }));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="My bookings" description="Manage your reservations and parking history." />

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-secondary/50 p-1">
        {tabs.map((t) => {
          const count = reservations.filter((r) => t.statuses.includes(r.status)).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>}
            </button>
          );
        })}
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}
      {loading && <Loading>Loading your bookings…</Loading>}
      {error && <Alert title="Bookings could not be loaded">{error}</Alert>}

      {!loading && !error && list.length === 0 && (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title={`No ${current.label.toLowerCase()} bookings`}
          description="When you reserve parking it will appear here."
          action={<ButtonLink to="/driver/find">Find parking</ButtonLink>}
        />
      )}

      <div className="space-y-3">
        {list.map((r) => {
          const pass = passes[r.id];
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ReservationStatusPill status={r.status} />
                  <Link to={`/driver/parking/${r.parkingLotId}`} className="mt-2 block font-semibold hover:underline">
                    {lotName(r.parkingLotId)}
                  </Link>
                </div>
                <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-medium">{r.reservationCode}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-4" />
                  {formatDateTime(r.startTime)} – {formatTime(r.endTime)}
                </span>
                <span className="ml-auto font-semibold">{formatRwf(r.totalAmount)}</span>
              </div>
              {r.status === "PENDING" && r.paymentDueBy && (
                <p className="mt-2 text-xs text-warning-foreground">
                  Pay by {formatTime(r.paymentDueBy)} to keep this booking.
                </p>
              )}

              {pass && (
                <div className="mt-4 text-center">
                  {typeof pass === "string" ? (
                    <p className="text-sm text-muted-foreground">{pass}</p>
                  ) : (
                    <QrPass value={pass.token} />
                  )}
                </div>
              )}

              {(r.status === "PENDING" || r.status === "CONFIRMED" || r.status === "CHECKED_IN") && (
                <div className="mt-3 flex gap-2">
                  {r.status === "PENDING" && (
                    <ButtonLink
                      to={`/driver/parking/${r.parkingLotId}/reserve?reservation=${r.id}`}
                      size="sm"
                      className="flex-1"
                    >
                      Pay now
                    </ButtonLink>
                  )}
                  {r.status === "CONFIRMED" && (
                    <button type="button" onClick={() => togglePass(r)} className={buttonClass("primary", "sm", "flex-1")}>
                      <QrCode className="size-4" /> {pass ? "Hide pass" : "Show pass"}
                    </button>
                  )}
                  {r.status === "CHECKED_IN" ? (
                    <ButtonLink to="/driver/active" size="sm" className="flex-1">
                      View active session
                    </ButtonLink>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => cancel(r)}
                      className={buttonClass("danger", "sm", "flex-1")}
                    >
                      {busyId === r.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
