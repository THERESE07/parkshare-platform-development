import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, CameraOff, CircleCheck, LogIn, LogOut, Wallet } from "lucide-react";
import { gateApi, paymentApi, reservationApi, type GateResult, type Reservation } from "../../api";
import { errorMessage, formatDateTime, formatRwf } from "../../lib/format";
import { Alert, Card, Field, Input, PageHeader, buttonClass, cn } from "../../components/ui";
import { ReservationStatusPill } from "../../components/parking";

type Mode = "in" | "out";

/** Gate app for attendants and operators (guide §11). */
export default function Gate() {
  const [mode, setMode] = useState<Mode>("in");
  const [result, setResult] = useState<GateResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<GateResult>) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await action());
    } catch (cause) {
      // 409 messages ("Too early", "Already used", "Not paid") are written for attendants.
      setError(errorMessage(cause, "That didn't work."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Gate" description="Check drivers in and out." />

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
        {(["in", "out"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setResult(null);
              setError("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {m === "in" ? <LogIn className="size-4" /> : <LogOut className="size-4" />}
            {m === "in" ? "Entry (check in)" : "Exit (check out)"}
          </button>
        ))}
      </div>

      {mode === "in" ? (
        <CheckIn busy={busy} onScan={(token) => run(() => gateApi.scan(token))} onCode={(code) => run(() => gateApi.byCode(code))} />
      ) : (
        <CheckOut busy={busy} onCheckOut={(id) => run(() => gateApi.checkOut(id))} />
      )}

      {error && (
        <Alert className="mt-4" title="Not allowed">
          {error}
        </Alert>
      )}
      {result && <ResultCard result={result} mode={mode} onDone={() => setResult(null)} />}
    </div>
  );
}

function Scanner({ onScan, disabled }: { onScan: (text: string) => void; disabled: boolean }) {
  const [on, setOn] = useState(false);
  const [error, setError] = useState("");
  const scanner = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!on) return;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const qr = new Html5Qrcode("gate-scanner");
      scanner.current = qr;
      try {
        await qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => {
            setOn(false);
            onScanRef.current(text);
          },
          () => undefined,
        );
      } catch {
        setError("Couldn't open the camera. Allow camera access, or type the code instead.");
        setOn(false);
      }
    })();
    return () => {
      cancelled = true;
      const qr = scanner.current;
      scanner.current = null;
      qr?.stop().then(() => qr.clear()).catch(() => undefined);
    };
  }, [on]);

  return (
    <div>
      <div id="gate-scanner" className={cn("overflow-hidden rounded-xl bg-black", !on && "hidden")} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setError("");
          setOn((o) => !o);
        }}
        className={buttonClass(on ? "outline" : "primary", "lg", "mt-3 w-full")}
      >
        {on ? <CameraOff className="size-5" /> : <Camera className="size-5" />}
        {on ? "Stop camera" : "Scan QR pass"}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CheckIn({ busy, onScan, onCode }: { busy: boolean; onScan: (t: string) => void; onCode: (c: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Scanner onScan={onScan} disabled={busy} />
      </Card>
      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCode(code.trim().toUpperCase());
          }}
          className="space-y-3"
        >
          <Field label="No QR? Type the reservation code" htmlFor="gateCode">
            <Input id="gateCode" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="PS-261110-ABC123" className="font-mono uppercase" />
          </Field>
          <button disabled={busy || !code.trim()} className={buttonClass("outline", "md", "w-full")}>
            Check in with code
          </button>
        </form>
      </Card>
      <CashAtGate />
    </div>
  );
}

/** Find a reservation by code (for cash payments and exits). */
function useLookup() {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function lookup(code: string) {
    setBusy(true);
    setError("");
    setReservation(null);
    try {
      setReservation(await reservationApi.byCode(code.trim().toUpperCase()));
    } catch (cause) {
      setError(errorMessage(cause, "No reservation with that code."));
    } finally {
      setBusy(false);
    }
  }
  return { reservation, setReservation, error, busy, lookup };
}

function LookupForm({ label, onLookup, busy }: { label: string; onLookup: (code: string) => void; busy: boolean }) {
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onLookup(code);
      }}
      className="flex gap-2"
    >
      <Input aria-label={label} required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Reservation code" className="font-mono uppercase" />
      <button disabled={busy} className={buttonClass("outline", "md", "shrink-0")}>
        Find
      </button>
    </form>
  );
}

function CashAtGate() {
  const { reservation, setReservation, error, busy, lookup } = useLookup();
  const [done, setDone] = useState("");
  const [payError, setPayError] = useState("");

  async function recordCash() {
    if (!reservation) return;
    setPayError("");
    try {
      await paymentApi.cash(reservation.id);
      setDone(`Cash payment of ${formatRwf(reservation.totalAmount)} recorded for ${reservation.reservationCode}. You can now check the driver in.`);
      setReservation(null);
    } catch (cause) {
      setPayError(errorMessage(cause, "The cash payment couldn't be recorded."));
    }
  }

  return (
    <Card className="p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Wallet className="size-4 text-primary" /> Cash at the gate
      </p>
      <LookupForm label="Reservation code for cash payment" onLookup={(c) => (setDone(""), lookup(c))} busy={busy} />
      {error && <p className="mt-2 whitespace-pre-line text-xs text-destructive">{error}</p>}
      {done && <p className="mt-2 text-xs text-success">{done}</p>}
      {reservation && (
        <div className="mt-3 rounded-xl border border-border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold">{reservation.reservationCode}</span>
            <ReservationStatusPill status={reservation.status} />
          </div>
          <p className="mt-1 text-muted-foreground">
            {formatDateTime(reservation.startTime)} · {formatRwf(reservation.totalAmount)}
          </p>
          {reservation.status === "PENDING" ? (
            <button type="button" onClick={recordCash} className={buttonClass("primary", "sm", "mt-3 w-full")}>
              I collected {formatRwf(reservation.totalAmount)} in cash
            </button>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Only unpaid (awaiting payment) reservations can be paid in cash.</p>
          )}
          {payError && <p className="mt-2 whitespace-pre-line text-xs text-destructive">{payError}</p>}
        </div>
      )}
    </Card>
  );
}

function CheckOut({ busy, onCheckOut }: { busy: boolean; onCheckOut: (id: number) => void }) {
  const { reservation, error, busy: finding, lookup } = useLookup();
  return (
    <Card className="space-y-3 p-5">
      <p className="text-sm font-semibold">Find the reservation</p>
      <LookupForm label="Reservation code for check-out" onLookup={lookup} busy={finding} />
      {error && <p className="whitespace-pre-line text-xs text-destructive">{error}</p>}
      {reservation && (
        <div className="rounded-xl border border-border p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold">{reservation.reservationCode}</span>
            <ReservationStatusPill status={reservation.status} />
          </div>
          <p className="mt-1 text-muted-foreground">Booked until {formatDateTime(reservation.endTime)}</p>
          <button type="button" disabled={busy} onClick={() => onCheckOut(reservation.id)} className={buttonClass("primary", "md", "mt-3 w-full")}>
            Check out
          </button>
        </div>
      )}
    </Card>
  );
}

function ResultCard({ result, mode, onDone }: { result: GateResult; mode: Mode; onDone: () => void }) {
  const owes = (result.overstayAmount ?? 0) > 0;
  const [collected, setCollected] = useState(false);
  return (
    <Card className="mt-4 overflow-hidden">
      <div className={cn("flex items-center gap-2 px-5 py-3 text-sm font-semibold", owes ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground")}>
        <CircleCheck className="size-5" />
        {mode === "in" ? "Checked in" : owes ? "Overstay to collect" : "Checked out"}
      </div>
      <div className="space-y-3 p-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Vehicle</dt>
            <dd className="font-mono text-lg font-bold">{result.vehiclePlate || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Space</dt>
            <dd className="font-mono text-lg font-bold">{result.spaceCode || "Any free space"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Reservation</dt>
            <dd className="font-mono">{result.reservationCode}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time</dt>
            <dd>{formatDateTime(result.at)}</dd>
          </div>
        </dl>
        {result.instruction && <Alert tone={owes ? "warning" : "info"}>{result.instruction}</Alert>}
        {owes && (
          <label className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-muted p-3 text-sm text-warning-foreground">
            <input type="checkbox" checked={collected} onChange={(e) => setCollected(e.target.checked)} className="mt-1" />
            <span>
              I collected <strong>{formatRwf(result.overstayAmount)}</strong> for {result.overstayMinutes} minutes of overstay.
            </span>
          </label>
        )}
        <button type="button" disabled={owes && !collected} onClick={onDone} className={buttonClass("primary", "lg", "w-full")}>
          Done
        </button>
      </div>
    </Card>
  );
}
