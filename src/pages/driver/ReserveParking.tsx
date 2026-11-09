import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, CircleCheck, Clock, FlaskConical, LoaderCircle, MapPin, Receipt, Smartphone, Sun } from "lucide-react";
import {
  eventApi,
  loadLotLayout,
  meApi,
  parkingApi,
  paymentApi,
  pricingApi,
  reservationApi,
  vehicleApi,
  waitForPayment,
  type CurrentQr,
  type ParkingSpace,
  type PaymentMethod,
  type PaymentView,
  type PriceQuote,
  type Reservation,
  type Vehicle,
} from "../../api";
import {
  BOOKING_RULES,
  PAYMENTS_SANDBOX,
  countdown,
  durationMinutes,
  errorMessage,
  formatDateTime,
  formatDuration,
  formatRwf,
  networkFor,
  toLocalInput,
} from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, BackLink, ButtonLink, Card, Field, Input, Loading, QrPass, Select, Textarea, cn } from "../../components/ui";

/** Durations in minutes, within the API's 30 min – 7 day rule. */
const DURATIONS = [30, 60, 120, 180, 240, 360, 480, 720, 1440, 2880, 4320, 10080];
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
function defaultStart(): string {
  const d = new Date(Date.now() + 15 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return toLocalInput(d);
}

/** Re-renders every second; used for countdowns. */
function useNow(active = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return now;
}

export default function ReserveParking() {
  const lotId = Number(useParams().id);
  const [params] = useSearchParams();
  const user = useSession()!;
  const resumeId = params.get("reservation");
  const eventId = params.get("eventId");
  const zoneId = params.get("zoneId");
  const presetMinutes = Number(params.get("minutes")) || 0;
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
  const closed = reservation && !["PENDING", "CONFIRMED", "CHECKED_IN"].includes(reservation.status);

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
            <span className={cn("text-sm font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < steps.length - 1 && <span className="ml-auto hidden h-px flex-1 bg-border sm:block" />}
          </li>
        ))}
      </ol>

      {closed ? (
        <Alert tone="warning" title="This booking can't be paid any more">
          Reservation {reservation!.reservationCode} has {reservation!.status === "EXPIRED" ? "expired" : `status ${reservation!.status.toLowerCase()}`}.{" "}
          <Link to={`/driver/parking/${lot.id}/reserve`} className="font-semibold underline">
            Book again
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
          presetMinutes={presetMinutes}
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
          accountPhone={localPhone(data.profile?.phone)}
          onPaid={(updated) => {
            setReservation(updated);
            setStep(2);
          }}
          onExpired={(updated) => setReservation(updated)}
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
  presetMinutes,
  onCreated,
}: {
  lotId: number;
  lotOpen: boolean;
  vehicles: Vehicle[];
  spaces: ParkingSpace[];
  presetStart: string | null;
  presetMinutes: number;
  onCreated: (r: Reservation) => Promise<void>;
}) {
  const [vehicleId, setVehicleId] = useState(() => String((vehicles.find((v) => v.isDefault) ?? vehicles[0])?.id ?? ""));
  const [spaceId, setSpaceId] = useState("");
  const [startLocal, setStartLocal] = useState(() => {
    const preset = presetStart ? new Date(presetStart) : null;
    return preset && preset.getTime() > Date.now() ? toLocalInput(preset) : defaultStart();
  });
  const clampedPreset = presetMinutes ? Math.min(Math.max(presetMinutes, BOOKING_RULES.minMinutes), BOOKING_RULES.maxMinutes) : 0;
  const [minutes, setMinutes] = useState(clampedPreset || 120);
  const [notes, setNotes] = useState("");
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const durations = useMemo(() => [...new Set([...DURATIONS, minutes])].sort((a, b) => a - b), [minutes]);
  const start = new Date(startLocal);
  const end = new Date(start.getTime() + minutes * 60000);
  const latestStart = new Date(Date.now() + BOOKING_RULES.maxDaysAhead * 86400000);
  const timeProblem = !Number.isFinite(start.getTime())
    ? "Choose a start time."
    : start.getTime() <= Date.now()
      ? "The start time can't be in the past."
      : start > latestStart
        ? `You can book at most ${BOOKING_RULES.maxDaysAhead} days ahead.`
        : null;

  useEffect(() => {
    setQuote(null);
    setQuoteError("");
    if (timeProblem) return;
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
  }, [lotId, startLocal, minutes]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (timeProblem) {
      setError(timeProblem);
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
        The lot hasn't been approved yet or is temporarily closed.
      </Alert>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Arrival" htmlFor="arrival" hint={timeProblem && startLocal ? timeProblem : undefined}>
            <Input
              id="arrival"
              type="datetime-local"
              required
              min={toLocalInput(new Date())}
              max={toLocalInput(latestStart)}
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </Field>
          <Field label="Duration" htmlFor="duration" hint={!timeProblem ? `Until ${formatDateTime(end.toISOString())}` : undefined}>
            <Select id="duration" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {durations.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
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
          <Textarea id="notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrival details or accessibility needs" />
        </Field>
      </Card>

      <PriceSummary quote={quote} error={quoteError} pending={!timeProblem} />

      {error && <Alert>{error}</Alert>}

      <button
        type="submit"
        disabled={saving || vehicles.length === 0 || !!timeProblem || !quote}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && <LoaderCircle className="size-4 animate-spin" />}
        {saving ? "Reserving…" : quote ? `Reserve · ${formatRwf(quote.total)}` : "Reserve & continue to payment"}
      </button>
      <p className="text-center text-xs text-muted-foreground">Your space is held for 15 minutes while you pay.</p>
    </form>
  );
}

/** Shows the server's quote exactly: total big, then the lines and the note (guide §9). */
function PriceSummary({ quote, error, pending }: { quote: PriceQuote | null; error: string; pending: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-semibold">Total to pay</span>
        <span className="font-display text-3xl font-bold tabular-nums">
          {quote ? formatRwf(quote.total) : error ? "—" : pending ? <LoaderCircle className="size-6 animate-spin text-muted-foreground" /> : "—"}
        </span>
      </div>
      {quote && (
        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          {(quote.lines ?? []).map((line, i) => (
            <div key={i} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="font-medium tabular-nums">{formatRwf(line.amount)}</dd>
            </div>
          ))}
          {quote.dailyCapDiscount ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Daily cap</dt>
              <dd className="font-medium tabular-nums text-success">−{formatRwf(quote.dailyCapDiscount)}</dd>
            </div>
          ) : null}
        </dl>
      )}
      {quote?.note && <p className="mt-2 text-xs text-muted-foreground">{quote.note}</p>}
      {error && <p className="mt-2 whitespace-pre-line text-xs text-destructive">{error}</p>}
    </Card>
  );
}

function SandboxNotice() {
  if (!PAYMENTS_SANDBOX) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-info/20 bg-info-muted p-3 text-xs leading-5 text-info">
      <FlaskConical className="mt-0.5 size-4 shrink-0" />
      <span>
        <strong>Test mode: no real money.</strong> The test phone approves automatically after a few seconds. Use a number ending in 000
        to test a declined payment, or 999 for no answer.
      </span>
    </p>
  );
}

/* ---------- Step 2: payment ---------- */

function PaymentStep({
  reservation,
  accountPhone,
  onPaid,
  onExpired,
}: {
  reservation: Reservation;
  accountPhone: string;
  onPaid: (r: Reservation) => void;
  onExpired: (r: Reservation) => void;
}) {
  const [phone, setPhone] = useState(accountPhone);
  const [method, setMethod] = useState<PaymentMethod>(networkFor(accountPhone) ?? "MTN_MOMO");
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const now = useNow();
  const dueMs = reservation.paymentDueBy ? new Date(reservation.paymentDueBy).getTime() - now : null;
  const expired = dueMs !== null && dueMs <= 0;

  const phoneNetwork = networkFor(phone);
  const phoneValid = phoneNetwork !== null && phone.replace(/\D/g, "").replace(/^250/, "0").length === 10;
  const mismatch = phoneValid && phoneNetwork !== method;

  // Poll until paid / failed / expired (guide §9).
  useEffect(() => {
    if (!payment) return;
    let cancelled = false;
    void waitForPayment(reservation.id, reservation.paymentDueBy, () => cancelled).then(async (result) => {
      if (cancelled) return;
      if (result === "paid") onPaid(await reservationApi.get(reservation.id));
      else if (result === "failed") {
        setPayment(null);
        setError("The payment was declined or cancelled on the phone. Check your balance and try again.");
      } else if (result === "expired") {
        onExpired(await reservationApi.get(reservation.id).catch(() => ({ ...reservation, status: "EXPIRED" })));
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, reservation.id]);

  async function pay() {
    setBusy(true);
    setError("");
    try {
      const view = await paymentApi.initiate(reservation.id, method, phone.replace(/[\s-]/g, "") || undefined);
      if (view.status?.toUpperCase() === "PAID") onPaid(await reservationApi.get(reservation.id));
      else setPayment(view);
    } catch (cause) {
      setError(errorMessage(cause, "The payment could not be started."));
    } finally {
      setBusy(false);
    }
  }

  if (expired && !payment) {
    return (
      <Alert tone="warning" title="Time's up">
        The 15-minute hold on reservation {reservation.reservationCode} has ended and the space was released.{" "}
        <Link to={`/driver/parking/${reservation.parkingLotId}/reserve`} className="font-semibold underline">
          Book again
        </Link>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reservation</span>
          <span className="font-mono font-semibold">{reservation.reservationCode}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            {formatDateTime(reservation.startTime)} · {formatDuration(durationMinutes(reservation))}
          </span>
          <span className="font-display text-2xl font-bold">{formatRwf(reservation.totalAmount)}</span>
        </div>
        {dueMs !== null && (
          <p
            className={cn(
              "mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              dueMs < 3 * 60000 ? "bg-danger-muted text-destructive" : "bg-warning-muted text-warning-foreground",
            )}
          >
            <Clock className="size-3.5" /> Pay within <span className="font-mono tabular-nums">{countdown(dueMs)}</span> or the space is released.
          </p>
        )}
      </Card>

      <SandboxNotice />

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
                className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition-colors", method === p.id ? "border-primary bg-accent" : "border-border hover:bg-muted")}
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
            hint={
              mismatch
                ? `That's an ${phoneNetwork === "MTN_MOMO" ? "MTN" : "Airtel"} number — pick ${phoneNetwork === "MTN_MOMO" ? "MTN MoMo" : "Airtel Money"} or use another number.`
                : "Defaults to your account number. You'll get a prompt to approve the payment."
            }
          >
            <Input
              id="payPhone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                const n = networkFor(e.target.value);
                if (n) setMethod(n);
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

function ConfirmedStep({ reservation, lotName, lotAddress }: { reservation: Reservation; lotName: string; lotAddress: string }) {
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
        <h1 className="mt-4 text-xl font-bold">Paid · reservation confirmed</h1>
        <p className="mt-1 text-sm text-muted-foreground">Show this pass at the entrance.</p>

        {qr ? (
          <>
            <QrPass value={qr.token} className="mt-6" />
            <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Sun className="size-3.5" /> Turn your screen brightness up at the gate.
            </p>
          </>
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
          <Row label="Paid" value={formatRwf(reservation.totalAmount)} />
        </dl>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <ButtonLink to={`/driver/bookings/${reservation.id}/receipt`} variant="outline" size="lg">
          <Receipt className="size-4" /> Receipt
        </ButtonLink>
        <ButtonLink to={`/driver/parking/${reservation.parkingLotId}`} variant="outline" size="lg">
          <MapPin className="size-4" /> Directions
        </ButtonLink>
        <ButtonLink to="/driver/bookings" size="lg" className="col-span-2">
          My bookings
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
