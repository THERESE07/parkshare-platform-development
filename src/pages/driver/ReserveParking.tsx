import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, CircleCheck, Clock, LoaderCircle, MapPin, Smartphone } from "lucide-react";
import {
  eventApi,
  loadLotLayout,
  meApi,
  parkingApi,
  paymentApi,
  pricingApi,
  reservationApi,
  vehicleApi,
  type CurrentQr,
  type PaymentMethod,
  type PaymentView,
  type PriceQuote,
  type Reservation,
} from "../../lib/api";
import { errorMessage, formatDateTime, formatDuration, formatRwf, formatTime, durationMinutes, toLocalInput } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, BackLink, ButtonLink, Card, Field, Input, Loading, QrPass, Select, Textarea, cn } from "../../components/ui";

const DURATIONS = [1, 2, 3, 4, 6, 8, 12, 24];
const steps = ["Details", "Payment", "Confirmed"] as const;
const PAYMENTS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "MTN_MOMO", label: "MTN MoMo", hint: "078 / 079 numbers" },
  { id: "AIRTEL_MONEY", label: "Airtel Money", hint: "072 / 073 numbers" },
];

/** "+250788123456" → "0788123456" for display in the phone field. */
function localPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("250") ? `0${digits.slice(3)}` : phone;
}
function methodForPhone(phone: string): PaymentMethod | null {
  const d = phone.replace(/\D/g, "").replace(/^250/, "0");
  if (/^07[89]/.test(d)) return "MTN_MOMO";
  if (/^07[23]/.test(d)) return "AIRTEL_MONEY";
  return null;
}
function defaultStart(): string {
  const d = new Date(Date.now() + 15 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return toLocalInput(d);
}

export default function ReserveParking() {
  const lotId = Number(useParams().id);
  const [params] = useSearchParams();
  const user = useSession()!;
  const resumeId = params.get("reservation");
  const eventId = params.get("eventId");
  const zoneId = params.get("zoneId");
  const presetHours = Number(params.get("hours")) || 0;
  const presetStart = params.get("start");

  const { data, loading, error: loadError } = useLoad(async () => {
    const [lot, vehicles, layout, profile, resumed] = await Promise.all([
      parkingApi.get(lotId),
      vehicleApi.listByUser(user.userId),
      loadLotLayout(lotId).catch(() => ({ zones: [], spaces: [] })),
      meApi.get().catch(() => null),
      resumeId ? reservationApi.get(Number(resumeId)) : Promise.resolve(null),
    ]);
    return { lot, vehicles: vehicles.filter((v) => v.isActive), layout, profile, resumed };
  }, [lotId, user.userId, resumeId]);

  const [step, setStep] = useState(0);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Resuming an existing booking skips straight to the right step.
  useEffect(() => {
    const r = data?.resumed;
    if (!r) return;
    setReservation(r);
    if (r.status === "PENDING") setStep(1);
    else if (r.status === "CONFIRMED" || r.status === "CHECKED_IN") setStep(2);
  }, [data?.resumed]);

  if (loading) return <Loading>Preparing your reservation…</Loading>;
  if (loadError || !data)
    return (
      <div className="mx-auto max-w-xl">
        <BackLink to={`/driver/parking/${lotId}`}>Back</BackLink>
        <Alert title="The reservation form could not be loaded">{loadError}</Alert>
      </div>
    );

  const { lot } = data;
  const resumedClosed = data.resumed && !["PENDING", "CONFIRMED", "CHECKED_IN"].includes(data.resumed.status);

  return (
    <div className="mx-auto max-w-xl pb-10">
      <BackLink to={`/driver/parking/${lot.id}`}>{lot.name}</BackLink>

      <ol className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors",
                i < step && "bg-success text-success-foreground",
                i === step && "bg-primary text-primary-foreground",
                i > step && "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("text-sm font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="ml-auto hidden h-px flex-1 bg-border sm:block" />}
          </li>
        ))}
      </ol>

      {resumedClosed ? (
        <Alert tone="warning" title="This booking can't be paid any more">
          Reservation {data.resumed!.reservationCode} is {data.resumed!.status.toLowerCase().replace("_", " ")}.{" "}
          <Link to={`/driver/parking/${lot.id}/reserve`} className="font-semibold underline">
            Make a new reservation
          </Link>
          .
        </Alert>
      ) : step === 0 ? (
        <DetailsStep
          lotId={lot.id}
          lotOpen={lot.status?.toUpperCase() === "ACTIVE"}
          vehicles={data.vehicles}
          spaces={data.layout.spaces.filter((s) => s.status?.toUpperCase() === "AVAILABLE")}
          presetStart={presetStart}
          presetHours={presetHours}
          onCreated={async (created) => {
            if (eventId && zoneId) {
              await eventApi.linkReservation(Number(eventId), Number(zoneId), created.id).catch(() => undefined);
            }
            setReservation(created);
            setStep(1);
          }}
        />
      ) : step === 1 && reservation ? (
        <PaymentStep
          reservation={reservation}
          defaultPhone={localPhone(data.profile?.phone)}
          onPaid={(updated) => {
            setReservation(updated);
            setStep(2);
          }}
        />
      ) : reservation ? (
        <ConfirmedStep reservation={reservation} lotName={lot.name} lotAddress={`${lot.address}, ${lot.city}`} />
      ) : null}
    </div>
  );
}

/* ---------- Step 1: details ---------- */

function DetailsStep({
  lotId,
  lotOpen,
  vehicles,
  spaces,
  presetStart,
  presetHours,
  onCreated,
}: {
  lotId: number;
  lotOpen: boolean;
  vehicles: { id: number; plateNumber: string; isDefault: boolean; vehicleType: string }[];
  spaces: { id: number; spaceCode: string; floor: string | null; spaceType: string }[];
  presetStart: string | null;
  presetHours: number;
  onCreated: (r: Reservation) => Promise<void>;
}) {
  const [vehicleId, setVehicleId] = useState(() => String((vehicles.find((v) => v.isDefault) ?? vehicles[0])?.id ?? ""));
  const [spaceId, setSpaceId] = useState("");
  const [startLocal, setStartLocal] = useState(() => {
    const preset = presetStart ? new Date(presetStart) : null;
    return preset && preset.getTime() > Date.now() ? toLocalInput(preset) : defaultStart();
  });
  const [hours, setHours] = useState(presetHours || 2);
  const [notes, setNotes] = useState("");
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const durations = useMemo(() => [...new Set([...DURATIONS, hours])].sort((a, b) => a - b), [hours]);
  const start = new Date(startLocal);
  const end = new Date(start.getTime() + hours * 3600000);
  const validTimes = Number.isFinite(start.getTime()) && start.getTime() > Date.now();

  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (!validTimes) return;
    let active = true;
    const timer = window.setTimeout(() => {
      pricingApi
        .quote(lotId, start.toISOString(), end.toISOString())
        .then((q) => active && setQuote(q))
        .catch((cause) => active && setQuoteError(errorMessage(cause, "Price unavailable.")));
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId, startLocal, hours]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validTimes) {
      setError("Choose a start time in the future.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await reservationApi.create({
        vehicleId: Number(vehicleId),
        parkingLotId: lotId,
        parkingSpaceId: spaceId ? Number(spaceId) : undefined,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: notes.trim() || undefined,
      });
      await onCreated(created);
    } catch (cause) {
      setError(errorMessage(cause, "The reservation could not be created."));
    } finally {
      setSaving(false);
    }
  }

  if (!lotOpen)
    return (
      <Alert tone="warning" title="This lot is not open for booking">
        The operator's lot hasn't been approved or is temporarily closed.
      </Alert>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Arrival" htmlFor="arrival">
            <Input
              id="arrival"
              type="datetime-local"
              required
              min={toLocalInput(new Date())}
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </Field>
          <Field label="Duration" htmlFor="duration" hint={validTimes ? `Until ${formatDateTime(end.toISOString())}` : undefined}>
            <Select id="duration" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? "hour" : "hours"}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {vehicles.length === 0 ? (
          <Alert tone="warning">
            You need an active vehicle before reserving.{" "}
            <Link to="/driver/vehicles" className="font-semibold underline">
              Add a vehicle
            </Link>
            .
          </Alert>
        ) : (
          <Field label="Vehicle" htmlFor="vehicle">
            <Select id="vehicle" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} · {v.vehicleType.toLowerCase()}
                  {v.isDefault ? " · default" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field
          label="Parking space"
          htmlFor="space"
          optional
          hint={
            spaces.length > 0
              ? `${spaces.length} space(s) are free right now. This is a live snapshot, not a guarantee for later times.`
              : "No individual spaces are marked free right now; the operator will assign one."
          }
        >
          <Select id="space" value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
            <option value="">Let the operator assign a space</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.spaceCode}
                {s.floor ? ` · floor ${s.floor}` : ""} · {s.spaceType.toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes for the operator" htmlFor="notes" optional>
          <Textarea
            id="notes"
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Arrival details or accessibility needs"
          />
        </Field>
      </Card>

      <PriceSummary quote={quote} error={quoteError} startLocal={startLocal} hours={hours} />

      {error && <Alert>{error}</Alert>}

      <button
        type="submit"
        disabled={saving || vehicles.length === 0 || !validTimes}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && <LoaderCircle className="size-4 animate-spin" />}
        {saving ? "Reserving…" : "Reserve & continue to payment"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Your space is held for a short time while you pay.
      </p>
    </form>
  );
}

function PriceSummary({
  quote,
  error,
  startLocal,
  hours,
}: {
  quote: PriceQuote | null;
  error: string;
  startLocal: string;
  hours: number;
}) {
  return (
    <Card className="p-4">
      <dl className="space-y-2 text-sm">
        {quote ? (
          quote.lines.map((line, i) => (
            <div key={i} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="font-medium tabular-nums">{formatRwf(line.amount)}</dd>
            </div>
          ))
        ) : (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {hours} {hours === 1 ? "hour" : "hours"} from {startLocal.replace("T", " ")}
            </dt>
            <dd className="text-muted-foreground">{error ? "—" : "Calculating…"}</dd>
          </div>
        )}
        {quote?.dailyCapDiscount ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Daily cap</dt>
            <dd className="font-medium tabular-nums text-success">−{formatRwf(quote.dailyCapDiscount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-display font-bold tabular-nums">{quote ? formatRwf(quote.total) : "—"}</dd>
        </div>
        {quote && (
          <p className="text-xs text-muted-foreground">
            Includes {formatRwf(quote.vatAmount)} VAT ({Math.round(quote.vatRate * 100)}%) · billed for{" "}
            {formatDuration(quote.billedMinutes)}
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </dl>
    </Card>
  );
}

/* ---------- Step 2: payment ---------- */

function PaymentStep({
  reservation,
  defaultPhone,
  onPaid,
}: {
  reservation: Reservation;
  defaultPhone: string;
  onPaid: (r: Reservation) => void;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [method, setMethod] = useState<PaymentMethod>(methodForPhone(defaultPhone) ?? "MTN_MOMO");
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const phoneMethod = methodForPhone(phone);
  const phoneValid = phoneMethod !== null && phone.replace(/\D/g, "").replace(/^250/, "0").length === 10;
  const mismatch = phoneValid && phoneMethod !== method;
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  // While a prompt is pending, poll until the provider answers.
  useEffect(() => {
    if (!payment) return;
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const latest = await paymentApi.getForReservation(reservation.id);
        if (!active) return;
        const status = latest.status?.toUpperCase();
        if (status === "PAID") {
          active = false;
          onPaidRef.current(await reservationApi.get(reservation.id));
        } else if (status === "FAILED" || status === "CANCELLED") {
          setPayment(null);
          setError("The payment was declined or cancelled. Check your balance and try again.");
        }
      } catch {
        /* keep polling */
      }
    }, 2500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [payment, reservation.id]);

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const view = await paymentApi.initiate(reservation.id, { method, phone: phone.replace(/[\s-]/g, "") });
      if (view.status?.toUpperCase() === "PAID") onPaid(await reservationApi.get(reservation.id));
      else setPayment(view);
    } catch (cause) {
      setError(errorMessage(cause, "The payment could not be started."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reservation</span>
          <span className="font-mono font-semibold">{reservation.reservationCode}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-muted-foreground">
            {formatDateTime(reservation.startTime)} · {formatDuration(durationMinutes(reservation))}
          </span>
          <span className="font-display text-lg font-bold">{formatRwf(reservation.totalAmount)}</span>
        </div>
        {reservation.paymentDueBy && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-warning-foreground">
            <Clock className="size-3.5" /> Pay by {formatTime(reservation.paymentDueBy)} or the hold is released.
          </p>
        )}
      </Card>

      {payment ? (
        <Card className="p-6 text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
          <h2 className="mt-4 text-lg font-bold">Approve the payment on your phone</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {payment.instructions ?? `A prompt for ${formatRwf(payment.amount)} was sent to your phone.`}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">This page updates automatically once it's approved.</p>
        </Card>
      ) : (
        <Card className="space-y-4 p-5">
          <p className="text-sm font-semibold">Choose a payment method</p>
          <div className="grid gap-2">
            {PAYMENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setMethod(p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  method === p.id ? "border-primary bg-accent" : "border-border hover:bg-muted",
                )}
              >
                <span className="grid size-10 place-items-center rounded-lg bg-card text-foreground shadow-sm">
                  <Smartphone className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.hint}</span>
                </span>
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border-2",
                    method === p.id ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {method === p.id && <Check className="size-3" />}
                </span>
              </button>
            ))}
          </div>
          <Field
            label="Mobile money number"
            htmlFor="payPhone"
            hint={mismatch ? `That looks like an ${phoneMethod === "MTN_MOMO" ? "MTN" : "Airtel"} number.` : "You'll get a prompt to approve the payment."}
          >
            <Input
              id="payPhone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                const m = methodForPhone(e.target.value);
                if (m) setMethod(m);
              }}
              placeholder="078 000 0000"
            />
          </Field>
        </Card>
      )}

      {error && <Alert>{error}</Alert>}

      {!payment && (
        <div className="flex gap-3">
          <ButtonLink to="/driver/bookings" variant="outline" size="lg" className="flex-1">
            Pay later
          </ButtonLink>
          <button
            type="button"
            disabled={!phoneValid || mismatch || busy}
            onClick={pay}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            Pay {formatRwf(reservation.totalAmount)}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Step 3: confirmed ---------- */

function ConfirmedStep({
  reservation,
  lotName,
  lotAddress,
}: {
  reservation: Reservation;
  lotName: string;
  lotAddress: string;
}) {
  const [qr, setQr] = useState<CurrentQr | null>(null);
  const [qrError, setQrError] = useState("");
  useEffect(() => {
    reservationApi
      .qr(reservation.id)
      .then(setQr)
      .catch((cause) => setQrError(errorMessage(cause, "The QR pass isn't available yet.")));
  }, [reservation.id]);

  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-muted text-success">
          <CircleCheck className="size-8" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Reservation confirmed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paid {formatRwf(reservation.totalAmount)}. Show this pass at the entrance.
        </p>

        {qr ? (
          <QrPass value={qr.token} className="mt-6" />
        ) : (
          <p className="mx-auto mt-6 max-w-xs rounded-xl bg-muted p-4 text-xs text-muted-foreground">
            {qrError || "Loading your QR pass…"} The attendant can also check you in with the code below.
          </p>
        )}
        <p className="mt-3 font-mono text-lg font-semibold tracking-wider">{reservation.reservationCode}</p>
        {qr?.expiresAt && <p className="text-xs text-muted-foreground">Pass valid until {formatDateTime(qr.expiresAt)}</p>}

        <dl className="mt-6 space-y-2.5 rounded-xl bg-secondary/60 p-4 text-left text-sm">
          <Row icon={<MapPin className="size-4" />} label={lotName} value={lotAddress} />
          <Row icon={<Clock className="size-4" />} label="Arrival" value={formatDateTime(reservation.startTime)} />
          <Row label="Until" value={formatDateTime(reservation.endTime)} />
        </dl>
      </Card>
      <div className="flex gap-3">
        <ButtonLink to="/driver/bookings" variant="outline" size="lg" className="flex-1">
          My bookings
        </ButtonLink>
        <ButtonLink to="/driver" size="lg" className="flex-1">
          Done
        </ButtonLink>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
