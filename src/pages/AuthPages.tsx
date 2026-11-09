import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CarFront, Check, LoaderCircle, ParkingCircle } from "lucide-react";
import { authApi, type AccountType, type AuthResponse } from "../lib/api";
import { errorMessage } from "../lib/format";
import { homeFor } from "../lib/session";
import { Alert, Field, Input, Logo, cn } from "../components/ui";

/** Only follow in-app redirects (never an absolute URL from the query string). */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function AuthCard({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-[calc(100vh-72px)] place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl shadow-[#234b46]/5 sm:p-8">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{intro}</p>
        {children}
      </section>
    </main>
  );
}

function SubmitButton({ busy, children, busyLabel }: { busy: boolean; children: string; busyLabel: string }) {
  return (
    <button
      disabled={busy}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
    >
      {busy && <LoaderCircle className="size-4 animate-spin" />}
      {busy ? busyLabel : children}
    </button>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user: AuthResponse = await authApi.login({ email: email.trim(), password });
      navigate(next ?? homeFor(user), { replace: true });
    } catch (cause) {
      setError(errorMessage(cause, "Sign-in failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      intro="Sign in to find and reserve parking, or to manage your lots as an operator."
    >
      {next && (
        <Alert tone="info" className="mt-5">
          Please sign in to continue.
        </Alert>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <SubmitButton busy={busy} busyLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to ParkShare?{" "}
        <Link
          to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

const RWANDA_MOBILE = /^(?:\+?250|0)?7[2389]\d{7}$/;

export function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [accountType, setAccountType] = useState<AccountType>(
    params.get("as") === "operator" ? "OPERATOR" : "DRIVER",
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!RWANDA_MOBILE.test(cleanPhone)) {
      setError("Enter a Rwandan mobile number, e.g. 078 123 4567 (MTN) or 073 123 4567 (Airtel).");
      return;
    }
    if (password.length < 8) {
      setError("Your password needs at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await authApi.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: cleanPhone,
        password,
        accountType,
      });
      const user = await authApi.login({ email: email.trim(), password });
      navigate(next ?? homeFor(user), { replace: true });
    } catch (cause) {
      setError(errorMessage(cause, "We couldn't create your account."));
    } finally {
      setBusy(false);
    }
  }

  const types: { value: AccountType; label: string; desc: string; icon: typeof CarFront }[] = [
    { value: "DRIVER", label: "Driver", desc: "Find and reserve parking", icon: CarFront },
    { value: "OPERATOR", label: "Parking operator", desc: "List and manage your lots", icon: ParkingCircle },
  ];

  return (
    <AuthCard title="Create your account" intro="Join ParkShare with your email and Rwandan mobile number.">
      <form onSubmit={submit} className="mt-6 space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold">I want to</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {types.map((t) => {
              const selected = accountType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAccountType(t.value)}
                  className={cn(
                    "relative rounded-xl border p-3 text-left transition-colors",
                    selected ? "border-primary bg-accent" : "border-input hover:bg-muted",
                  )}
                >
                  <t.icon className="size-5 text-primary" />
                  <span className="mt-2 block text-sm font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.desc}</span>
                  {selected && (
                    <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="firstName">
            <Input
              id="firstName"
              required
              maxLength={100}
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input
              id="lastName"
              required
              maxLength={100}
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Email" htmlFor="signupEmail">
          <Input
            id="signupEmail"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Mobile number"
          htmlFor="phone"
          hint="MTN (078/079) or Airtel (072/073). Used for MoMo / Airtel Money payments."
        >
          <Input
            id="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="078 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Password" htmlFor="newPassword" hint="At least 8 characters.">
            <Input
              id="newPassword"
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              required
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
        </div>
        {error && <Alert>{error}</Alert>}
        <SubmitButton busy={busy} busyLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">We couldn't find that page.</p>
      <Link to="/" className="mt-5 inline-block font-semibold text-primary">
        Return home
      </Link>
    </main>
  );
}
