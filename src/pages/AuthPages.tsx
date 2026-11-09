import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CarFront, Check, CircleCheck, LoaderCircle, Mail, ParkingCircle, Smartphone } from "lucide-react";
import { ApiError, authApi, meApi, type AccountType, type Profile } from "../api";
import { RWANDA_MOBILE, errorMessage, passwordProblem } from "../lib/format";
import { homeFor, useSession } from "../lib/session";
import { Alert, Field, Input, Loading, Logo, buttonClass, cn } from "../components/ui";

/** Only follow in-app redirects (never an absolute URL from the query string). */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function AuthCard({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <main className="grid min-h-[calc(100vh-72px)] place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{intro}</p>
        {children}
      </section>
    </main>
  );
}

function SubmitButton({ busy, children, busyLabel, disabled }: { busy: boolean; children: string; busyLabel: string; disabled?: boolean }) {
  return (
    <button disabled={busy || disabled} className={buttonClass("primary", "md", "w-full")}>
      {busy && <LoaderCircle className="size-4 animate-spin" />}
      {busy ? busyLabel : children}
    </button>
  );
}

/* ---------- Sign in ---------- */

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
      const user = await authApi.login(email.trim(), password);
      navigate(next ?? homeFor(user), { replace: true });
    } catch (cause) {
      setError(errorMessage(cause, "Sign-in failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Welcome back" intro="Sign in to find and reserve parking, or to manage your lots.">
      {params.get("expired") ? (
        <Alert tone="info" className="mt-5">
          Your session ended (sessions last 24 hours). Please sign in again.
        </Alert>
      ) : (
        next && (
          <Alert tone="info" className="mt-5">
            Please sign in to continue.
          </Alert>
        )
      )}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
        <div className="-mt-1 text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && <Alert>{error}</Alert>}
        <SubmitButton busy={busy} busyLabel="Signing in…">
          Sign in
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to ParkShare?{" "}
        <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

/* ---------- Sign up ---------- */

export function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [accountType, setAccountType] = useState<AccountType>(params.get("as") === "operator" ? "OPERATOR" : "DRIVER");
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
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await authApi.register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: cleanPhone, password, accountType });
      const user = await authApi.login(email.trim(), password);
      // The backend has just sent verification codes by SMS and email.
      navigate(`/verify?next=${encodeURIComponent(next ?? homeFor(user))}&new=1`, { replace: true });
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
  const pwProblem = password ? passwordProblem(password) : null;

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
                  className={cn("relative rounded-xl border p-3 text-left transition-colors", selected ? "border-primary bg-accent" : "border-input hover:bg-muted")}
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
            <Input id="firstName" required maxLength={100} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <Input id="lastName" required maxLength={100} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <Field label="Email" htmlFor="signupEmail">
          <Input id="signupEmail" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Mobile number" htmlFor="phone" hint="MTN (078/079) or Airtel (072/073). We'll text you a verification code.">
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
          <Field label="Password" htmlFor="newPassword" hint={pwProblem ?? "8+ characters with a letter and a number."}>
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
            <Input id="confirmPassword" required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        </div>
        {error && <Alert>{error}</Alert>}
        <SubmitButton busy={busy} busyLabel="Creating account…">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

/* ---------- Verification codes (OTP) ---------- */

const RESEND_SECONDS = 60;

function useCooldown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  return [left, setLeft] as const;
}

function CodeForm({
  channel,
  verified,
  justSent,
  onVerified,
}: {
  channel: "phone" | "email";
  verified: boolean;
  justSent: boolean;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useCooldown(justSent ? RESEND_SECONDS : 0);
  const Icon = channel === "phone" ? Smartphone : Mail;

  if (verified) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-muted p-4 text-sm text-success">
        <CircleCheck className="size-5" /> Your {channel} is verified.
      </div>
    );
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await (channel === "phone" ? meApi.confirmPhone(code.trim()) : meApi.confirmEmail(code.trim()));
      onVerified();
    } catch (cause) {
      setError(errorMessage(cause, "That code didn't work."));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setNotice("");
    try {
      await (channel === "phone" ? meApi.sendPhoneCode() : meApi.sendEmailCode());
      setNotice(`We sent a new code to your ${channel}.`);
      setCooldown(RESEND_SECONDS);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 429) setCooldown(RESEND_SECONDS);
      setError(errorMessage(cause, "We couldn't send a new code."));
    }
  }

  return (
    <form onSubmit={confirm} className="space-y-3 rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {channel === "phone" ? "Phone (SMS) code" : "Email code"}
      </p>
      <div className="flex gap-2">
        <Input
          aria-label={`${channel} verification code`}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="font-mono tracking-[0.3em]"
        />
        <button disabled={busy || code.length !== 6} className={buttonClass("primary", "md", "shrink-0")}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : "Verify"}
        </button>
      </div>
      {error && <p className="whitespace-pre-line text-xs text-destructive">{error}</p>}
      {notice && <p className="text-xs text-success">{notice}</p>}
      <button type="button" onClick={resend} disabled={cooldown > 0} className="text-xs font-semibold text-primary disabled:text-muted-foreground">
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </button>
    </form>
  );
}

export function VerifyPage() {
  const user = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next")) ?? homeFor(user);
  const justSent = params.get("new") === "1";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  const reload = () =>
    meApi
      .get()
      .then(setProfile)
      .catch((cause) => setError(errorMessage(cause, "Couldn't load your account.")));
  useEffect(() => {
    void reload();
  }, []);

  const done = profile?.phoneVerified && profile?.emailVerified;
  useEffect(() => {
    if (done) {
      const t = window.setTimeout(() => navigate(next, { replace: true }), 1200);
      return () => window.clearTimeout(t);
    }
  }, [done, next, navigate]);

  return (
    <AuthCard
      title="Verify your account"
      intro="We sent a 6-digit code by SMS and another by email. Codes expire after 10 minutes."
    >
      <div className="mt-6 space-y-3">
        {error && <Alert>{error}</Alert>}
        {!profile && !error && <Loading>Loading…</Loading>}
        {profile && (
          <>
            <CodeForm channel="phone" verified={!!profile.phoneVerified} justSent={justSent} onVerified={reload} />
            <CodeForm channel="email" verified={!!profile.emailVerified} justSent={justSent} onVerified={reload} />
          </>
        )}
        {done && <Alert tone="success">All set! Taking you to ParkShare…</Alert>}
      </div>
      <Link to={next} className="mt-6 block text-center text-sm font-medium text-muted-foreground hover:text-foreground">
        {done ? "Continue" : "I'll do this later"}
      </Link>
    </AuthCard>
  );
}

/* ---------- Forgot / reset password ---------- */

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useCooldown();

  async function request(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.forgotPassword(identifier.trim());
      setStep("reset");
      setCooldown(RESEND_SECONDS);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 429) setCooldown(RESEND_SECONDS);
      setError(errorMessage(cause, "We couldn't send a code."));
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent) {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authApi.resetPassword(identifier.trim(), code.trim(), password);
      setStep("done");
    } catch (cause) {
      setError(errorMessage(cause, "We couldn't reset your password."));
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <AuthCard title="Password changed" intro="You can now sign in with your new password.">
        <button type="button" onClick={() => navigate("/login")} className={buttonClass("primary", "md", "mt-6 w-full")}>
          Sign in
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      intro={step === "request" ? "Enter the email or phone number on your account and we'll send you a code." : "If an account exists, we sent a 6-digit code. Enter it with your new password."}
    >
      {step === "request" ? (
        <form onSubmit={request} className="mt-6 space-y-4">
          <Field label="Email or phone number" htmlFor="identifier">
            <Input id="identifier" required autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <SubmitButton busy={busy} busyLabel="Sending…">
            Send code
          </SubmitButton>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-6 space-y-4">
          <Field label="Code" htmlFor="resetCode">
            <Input
              id="resetCode"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="font-mono tracking-[0.3em]"
            />
          </Field>
          <Field label="New password" htmlFor="resetPassword" hint="8+ characters with a letter and a number.">
            <Input id="resetPassword" required type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <Alert>{error}</Alert>}
          <SubmitButton busy={busy} busyLabel="Saving…" disabled={code.length !== 6}>
            Set new password
          </SubmitButton>
          <button type="button" disabled={cooldown > 0} onClick={() => request()} className="w-full text-center text-xs font-semibold text-primary disabled:text-muted-foreground">
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
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
