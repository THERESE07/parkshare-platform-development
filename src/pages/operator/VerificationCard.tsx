import { useState, type FormEvent } from "react";
import { BadgeCheck, ChevronDown } from "lucide-react";
import { ApiError, verificationApi, type OperatorVerification } from "../../api";
import { errorMessage, formatDateTime } from "../../lib/format";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, Field, Input, Pill, buttonClass } from "../../components/ui";

/** Business / VAT verification for operators (guide §10). */
export function VerificationCard({ userId }: { userId: number }) {
  const { data, setData, loading } = useLoad<OperatorVerification | null>(
    // "Not submitted yet" currently comes back as 400 (not 404) from the backend.
    () =>
      verificationApi
        .forUser(userId)
        .catch((e) => (e instanceof ApiError && (e.status === 404 || e.status === 400) ? null : Promise.reject(e))),
    [userId],
  );
  const [open, setOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [registration, setRegistration] = useState("");
  const [tin, setTin] = useState("");
  const [vatRegistered, setVatRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) return null;
  const status = (data?.verificationStatus ?? "").toUpperCase();
  if (status === "VERIFIED") {
    return (
      <p className="mb-6 flex items-center gap-2 text-sm text-success">
        <BadgeCheck className="size-4" /> {data!.businessName} is a verified operator
        {data!.vatRegistered ? " (VAT registered)" : ""}.
      </p>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setData(
        await verificationApi.submit(userId, {
          businessName: businessName.trim(),
          businessRegistrationNumber: registration.trim(),
          tin: tin.trim(),
          vatRegistered,
        }),
      );
      setOpen(false);
    } catch (cause) {
      setError(errorMessage(cause, "Your details couldn't be submitted."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <BadgeCheck className="size-4 text-primary" /> Business verification
            {status === "PENDING" && <Pill tone="warning">under review</Pill>}
            {status === "REJECTED" && <Pill tone="danger">rejected</Pill>}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {status === "PENDING"
              ? `Submitted ${formatDateTime(data!.submittedAt)}. An admin will review your business and VAT details.`
              : status === "REJECTED"
                ? `Reason: ${data!.rejectionReason || "not given"}. Update your details and submit again.`
                : "Verified operators earn drivers' trust. Your VAT status also decides how VAT appears on receipts."}
          </p>
        </div>
        {status !== "PENDING" && (
          <button type="button" onClick={() => setOpen((o) => !o)} className={buttonClass("outline", "sm")}>
            {status === "REJECTED" ? "Resubmit" : "Get verified"} <ChevronDown className="size-4" />
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Business name" htmlFor="vName">
            <Input id="vName" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </Field>
          <Field label="RDB registration no." htmlFor="vReg">
            <Input id="vReg" required value={registration} onChange={(e) => setRegistration(e.target.value)} />
          </Field>
          <Field label="TIN" htmlFor="vTin">
            <Input id="vTin" required inputMode="numeric" value={tin} onChange={(e) => setTin(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" checked={vatRegistered} onChange={(e) => setVatRegistered(e.target.checked)} />
            My business is registered for VAT with RRA
          </label>
          {error && <Alert className="sm:col-span-3">{error}</Alert>}
          <button disabled={busy} className={buttonClass("primary", "md", "sm:col-span-3")}>
            {busy ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      )}
    </Card>
  );
}
