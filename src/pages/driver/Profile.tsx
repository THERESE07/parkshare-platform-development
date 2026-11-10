import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Car, ChevronRight, CircleAlert, KeyRound, LayoutDashboard, LogOut, Mail, Pencil, Phone, Shield, Smartphone } from "lucide-react";
import { authApi, meApi, reservationApi, vehicleApi, type Profile as ProfileT } from "../../api";
import { RWANDA_MOBILE, errorMessage, formatRwf, passwordProblem } from "../../lib/format";
import { canUseConsole, homeFor, initials, useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, Field, Input, Loading, Pill, buttonClass } from "../../components/ui";

const PAID_STATUSES = ["CONFIRMED", "CHECKED_IN", "COMPLETED"];

export default function Profile() {
  const user = useSession()!;
  const navigate = useNavigate();
  const { data, setData, loading, error } = useLoad(async () => {
    const [profile, vehicles, reservations] = await Promise.all([
      meApi.get().catch(() => null),
      vehicleApi.listByUser(user.userId).catch(() => []),
      reservationApi.listByUser(user.userId).catch(() => []),
    ]);
    return { profile, vehicles, reservations };
  }, [user.userId]);
  const [editing, setEditing] = useState<"details" | "password" | null>(null);

  if (loading) return <Loading>Loading your profile…</Loading>;

  const profile = data?.profile;
  const firstName = profile?.firstName ?? user.firstName;
  const lastName = profile?.lastName ?? user.lastName;
  const vehicles = data?.vehicles ?? [];
  const reservations = data?.reservations ?? [];
  const completed = reservations.filter((r) => r.status === "COMPLETED").length;
  const totalSpent = reservations.filter((r) => PAID_STATUSES.includes(r.status)).reduce((s, r) => s + Number(r.totalAmount || 0), 0);

  function signOut() {
    authApi.logout();
    navigate("/");
  }

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {initials(firstName, lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">
              {firstName} {lastName}
            </h1>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {profile?.email ?? user.email}
              {profile && <VerifiedMark ok={!!profile.emailVerified} />}
            </p>
            {profile?.phone && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" /> {profile.phone}
                <VerifiedMark ok={!!profile.phoneVerified} />
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(profile?.roles ?? user.roles).map((role) => (
                <Pill key={role} tone="info">
                  <Shield className="size-3" /> {role.replace(/^ROLE_/, "").replace("_", " ").toLowerCase()}
                </Pill>
              ))}
            </div>
          </div>
        </div>
        {profile && (!profile.phoneVerified || !profile.emailVerified) && (
          <Link to="/verify?next=/driver/profile" className={buttonClass("outline", "sm", "mt-4 w-full")}>
            Verify your {!profile.phoneVerified && !profile.emailVerified ? "phone and email" : !profile.phoneVerified ? "phone" : "email"}
          </Link>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <div>
            <p className="font-display text-xl font-bold">{completed}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{formatRwf(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Spent</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{vehicles.length}</p>
            <p className="text-xs text-muted-foreground">Vehicles</p>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">Account</h2>
        <Card className="divide-y divide-border">
          <button type="button" onClick={() => setEditing(editing === "details" ? null : "details")} className="flex w-full items-center gap-3 p-4 text-left text-sm font-medium hover:bg-muted">
            <Pencil className="size-5 text-muted-foreground" /> <span className="flex-1">Edit name and phone</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          {editing === "details" && profile && (
            <DetailsForm
              profile={profile}
              onSaved={(p) => {
                setData((d) => (d ? { ...d, profile: p } : d));
                setEditing(null);
              }}
            />
          )}
          <button type="button" onClick={() => setEditing(editing === "password" ? null : "password")} className="flex w-full items-center gap-3 p-4 text-left text-sm font-medium hover:bg-muted">
            <KeyRound className="size-5 text-muted-foreground" /> <span className="flex-1">Change password</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          {editing === "password" && <PasswordForm email={profile?.email ?? user.email} onDone={() => setEditing(null)} />}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">My vehicles</h2>
        <Card className="divide-y divide-border">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Car className="size-5" />
              </span>
              <div className="flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {v.plateNumber}
                  {v.isDefault && <Pill tone="primary">Default</Pill>}
                  {!v.isActive && <Pill>Inactive</Pill>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[v.make, v.model, v.color].filter(Boolean).join(" · ") || "No details"} · {v.vehicleType.toLowerCase()}
                </p>
              </div>
            </div>
          ))}
          <Link to="/driver/vehicles" className="flex w-full items-center justify-between p-4 text-sm font-medium text-primary hover:bg-muted">
            {vehicles.length ? "Manage vehicles" : "Add a vehicle"}
            <ChevronRight className="size-4" />
          </Link>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payment methods</h2>
        <Card className="divide-y divide-border">
          {[
            { label: "MTN MoMo", detail: "078 / 079 numbers" },
            { label: "Airtel Money", detail: "072 / 073 numbers" },
          ].map((p) => (
            <div key={p.label} className="flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-foreground">
                <Smartphone className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-medium">{p.label}</p>
                <p className="text-sm text-muted-foreground">{p.detail} · you approve each payment on your phone</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      {canUseConsole(user) && (
        <Link to={homeFor(user)} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm font-medium hover:bg-muted">
          <span className="flex items-center gap-3">
            <LayoutDashboard className="size-5 text-muted-foreground" /> Console
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      )}

      <button
        type="button"
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-destructive hover:bg-danger-muted"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </div>
  );
}

function VerifiedMark({ ok }: { ok: boolean }) {
  return ok ? (
    <BadgeCheck className="size-4 text-success" aria-label="Verified" />
  ) : (
    <CircleAlert className="size-4 text-warning" aria-label="Not verified" />
  );
}

function DetailsForm({ profile, onSaved }: { profile: ProfileT; onSaved: (p: ProfileT) => void }) {
  const toLocal = (p: string | null | undefined) => (p ? p.replace(/^\+250/, "0") : "");
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [phone, setPhone] = useState(toLocal(profile.phone));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!RWANDA_MOBILE.test(cleanPhone)) {
      setError("Enter a Rwandan mobile number, e.g. 078 123 4567.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const changes: { firstName?: string; lastName?: string; phone?: string } = {};
      if (firstName.trim() !== profile.firstName) changes.firstName = firstName.trim();
      if (lastName.trim() !== profile.lastName) changes.lastName = lastName.trim();
      if (cleanPhone !== toLocal(profile.phone)) changes.phone = cleanPhone;
      onSaved(Object.keys(changes).length ? await meApi.update(changes) : profile);
    } catch (cause) {
      setError(errorMessage(cause, "Your details couldn't be saved."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" htmlFor="pfFirst">
          <Input id="pfFirst" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Last name" htmlFor="pfLast">
          <Input id="pfLast" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      </div>
      <Field label="Mobile number" htmlFor="pfPhone" hint="Changing it means verifying the new number.">
        <Input id="pfPhone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      {error && <Alert>{error}</Alert>}
      <button disabled={busy} className={buttonClass("primary", "sm")}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function PasswordForm({ email, onDone }: { email: string; onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(next);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await meApi.changePassword(current, next);
      // Changing the password signs out every device, this one included: sign straight back in.
      await authApi.login(email, next);
      setOk(true);
      window.setTimeout(onDone, 1500);
    } catch (cause) {
      setError(errorMessage(cause, "Your password couldn't be changed."));
    } finally {
      setBusy(false);
    }
  }

  if (ok) return <p className="p-4 text-sm text-success">Password changed. Your other devices have been signed out.</p>;
  return (
    <form onSubmit={save} className="space-y-3 p-4">
      <Field label="Current password" htmlFor="pwCurrent">
        <Input id="pwCurrent" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" htmlFor="pwNew" hint="8+ characters with a letter and a number.">
        <Input id="pwNew" type="password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      {error && <Alert>{error}</Alert>}
      <button disabled={busy} className={buttonClass("primary", "sm")}>
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
