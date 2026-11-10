import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, QrCode, Receipt, RotateCcw, Star, Ticket } from "lucide-react";
import { lotsById, reservationApi, reviewApi, type CurrentQr, type Reservation } from "../../api";
import {
  CANCEL_POLICY,
  CLOSED_STATUSES,
  UPCOMING_STATUSES,
  countdown,
  errorMessage,
  formatDateTime,
  formatRwf,
  formatTime,
} from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, ButtonLink, Card, EmptyState, Loading, PageHeader, QrPass, Textarea, buttonClass, cn } from "../../components/ui";
import { ReservationStatusPill } from "../../components/parking";

type TabKey = "upcoming" | "active" | "completed" | "cancelled";
const tabs: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "upcoming", label: "Upcoming", statuses: UPCOMING_STATUSES },
  { key: "active", label: "Parked", statuses: ["CHECKED_IN"] },
  { key: "completed", label: "Done", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled", statuses: CLOSED_STATUSES },
];

function refundPreview(r: Reservation): string {
  const minutesToStart = (new Date(r.startTime).getTime() - Date.now()) / 60000;
  if (r.status === "PENDING") return "You haven't paid yet, so nothing is charged.";
  if (minutesToStart >= 60) return "Cancelling now gives a full refund.";
  if (minutesToStart > 0) return "Your booking starts in under an hour, so cancelling now refunds 50%.";
  return "Your booking has started, so there is no refund.";
}

export default function Bookings() {
  const user = useSession()!;
  const { data, setData, loading, error } = useLoad(async () => {
    const [reservations, reviews] = await Promise.all([
      reservationApi.listByUser(user.userId),
      reviewApi.byUser(user.userId).catch(() => []),
    ]);
    const lots = await lotsById(reservations.map((r) => r.parkingLotId));
    return { reservations, lots, reviewed: new Set(reviews.map((r) => r.reservationId)) };
  }, [user.userId]);
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [passes, setPasses] = useState<Record<number, CurrentQr | string>>({});
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const reservations = data?.reservations ?? [];
  const lotName = (id: number) => data?.lots.get(id)?.name ?? `Parking lot #${id}`;
  const current = tabs.find((t) => t.key === tab)!;
  const list = reservations
    .filter((r) => current.statuses.includes(r.status))
    .sort((a, b) => (tab === "upcoming" ? a.startTime.localeCompare(b.startTime) : b.startTime.localeCompare(a.startTime)));

  async function cancel(r: Reservation) {
    if (!window.confirm(`Cancel reservation ${r.reservationCode}?\n\n${CANCEL_POLICY}\n\n${refundPreview(r)}`)) return;
    setBusyId(r.id);
    setNotice("");
    setActionError("");
    try {
      const result = await reservationApi.cancel(r.id);
      setData((d) => (d ? { ...d, reservations: d.reservations.map((x) => (x.id === r.id ? result.reservation : x)) } : d));
      setNotice(
        result.refundAmount
          ? `Reservation cancelled. ${formatRwf(result.refundAmount)} will be refunded to your mobile money.`
          : "Reservation cancelled. No refund is due.",
      );
    } catch (cause) {
      setActionError(errorMessage(cause, "The reservation could not be cancelled."));
    } finally {
      setBusyId(null);
    }
  }

  async function togglePass(r: Reservation) {
    if (passes[r.id]) {
      setPasses(({ [r.id]: _omit, ...rest }) => rest);
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
          const closed = CLOSED_STATUSES.includes(r.status);
          const dueMs = r.status === "PENDING" && r.paymentDueBy ? new Date(r.paymentDueBy).getTime() - now : null;
          return (
            <Card key={r.id} className={cn("p-4", closed && "opacity-60")}>
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

              {dueMs !== null && (
                <p className={cn("mt-2 text-xs font-medium", dueMs < 3 * 60000 ? "text-destructive" : "text-warning-foreground")}>
                  {dueMs > 0 ? (
                    <>
                      Pay within <span className="font-mono tabular-nums">{countdown(dueMs)}</span> to keep this booking.
                    </>
                  ) : (
                    "The payment window has ended."
                  )}
                </p>
              )}
              {r.status === "CHECKED_IN" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Parked until {formatTime(r.endTime)}. Time past that is charged at check-out.
                </p>
              )}

              {pass && (
                <div className="mt-4 text-center">
                  {typeof pass === "string" ? <p className="text-sm text-muted-foreground">{pass}</p> : <QrPass value={pass.token} />}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "PENDING" && dueMs !== null && dueMs > 0 && (
                  <ButtonLink to={`/driver/parking/${r.parkingLotId}/reserve?reservation=${r.id}`} size="sm" className="flex-1">
                    Pay now
                  </ButtonLink>
                )}
                {r.status === "CONFIRMED" && (
                  <>
                    <button type="button" onClick={() => togglePass(r)} className={buttonClass("primary", "sm", "flex-1")}>
                      <QrCode className="size-4" /> {pass ? "Hide pass" : "Show pass"}
                    </button>
                    <ButtonLink to={`/driver/parking/${r.parkingLotId}`} variant="outline" size="sm" className="flex-1">
                      <MapPin className="size-4" /> Directions
                    </ButtonLink>
                  </>
                )}
                {r.status === "CHECKED_IN" && (
                  <ButtonLink to="/driver/active" size="sm" className="flex-1">
                    View active session
                  </ButtonLink>
                )}
                {(r.status === "CONFIRMED" || r.status === "CHECKED_IN" || r.status === "COMPLETED") && (
                  <ButtonLink to={`/driver/bookings/${r.id}/receipt`} variant="outline" size="sm" className="flex-1">
                    <Receipt className="size-4" /> Receipt
                  </ButtonLink>
                )}
                {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                  <button type="button" disabled={busyId === r.id} onClick={() => cancel(r)} className={buttonClass("danger", "sm", "flex-1")}>
                    {busyId === r.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
                {(closed || r.status === "COMPLETED") && (
                  <ButtonLink to={`/driver/parking/${r.parkingLotId}/reserve`} variant="outline" size="sm" className="flex-1">
                    <RotateCcw className="size-4" /> Book again
                  </ButtonLink>
                )}
              </div>

              {r.status === "COMPLETED" && !data?.reviewed.has(r.id) && (
                <ReviewPrompt
                  userId={user.userId}
                  reservation={r}
                  onDone={() => setData((d) => (d ? { ...d, reviewed: new Set([...d.reviewed, r.id]) } : d))}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPrompt({ userId, reservation, onDone }: { userId: number; reservation: Reservation; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function send() {
    setBusy(true);
    setError("");
    try {
      await reviewApi.create(userId, reservation.parkingLotId, reservation.id, rating, comment.trim() || undefined);
      setSent(true);
      window.setTimeout(onDone, 1500);
    } catch (cause) {
      setError(errorMessage(cause, "Your review couldn't be sent."));
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <p className="mt-3 text-sm text-success">Thanks for your review!</p>;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/50 p-3">
      <p className="text-sm font-medium">How was your parking?</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
            <Star className={cn("size-6", n <= rating ? "fill-warning text-warning" : "text-muted-foreground")} />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-2 space-y-2">
          <Textarea rows={2} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything other drivers should know? (optional)" />
          {error && <p className="whitespace-pre-line text-xs text-destructive">{error}</p>}
          <button type="button" disabled={busy} onClick={send} className={buttonClass("primary", "sm")}>
            {busy ? "Sending…" : "Send review"}
          </button>
        </div>
      )}
    </div>
  );
}
