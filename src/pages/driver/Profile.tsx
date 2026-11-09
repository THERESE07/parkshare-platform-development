import { Link, useNavigate } from "react-router-dom";
import { Car, ChevronRight, LayoutDashboard, LogOut, Mail, Phone, Shield, Smartphone } from "lucide-react";
import { authApi, meApi, reservationApi, vehicleApi } from "../../lib/api";
import { formatRwf } from "../../lib/format";
import { initials, isOperator, useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, Loading, Pill } from "../../components/ui";

const PAID_STATUSES = ["CONFIRMED", "CHECKED_IN", "COMPLETED"];

export default function Profile() {
  const user = useSession()!;
  const navigate = useNavigate();
  const { data, loading, error } = useLoad(async () => {
    const [profile, vehicles, reservations] = await Promise.all([
      meApi.get().catch(() => null),
      vehicleApi.listByUser(user.userId).catch(() => []),
      reservationApi.listByUser(user.userId).catch(() => []),
    ]);
    return { profile, vehicles, reservations };
  }, [user.userId]);

  if (loading) return <Loading>Loading your profile…</Loading>;

  const profile = data?.profile;
  const firstName = profile?.firstName ?? user.firstName;
  const lastName = profile?.lastName ?? user.lastName;
  const vehicles = data?.vehicles ?? [];
  const reservations = data?.reservations ?? [];
  const completed = reservations.filter((r) => r.status === "COMPLETED").length;
  const totalSpent = reservations
    .filter((r) => PAID_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

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
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">
              {firstName} {lastName}
            </h1>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {profile?.email ?? user.email}
            </p>
            {profile?.phone && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" /> {profile.phone}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(profile?.roles ?? user.roles).map((role) => (
                <Pill key={role} tone="info">
                  <Shield className="size-3" /> {role.replace(/^ROLE_/, "").toLowerCase()}
                </Pill>
              ))}
            </div>
          </div>
        </div>
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
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          My vehicles
        </h2>
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
          <Link
            to="/driver/vehicles"
            className="flex w-full items-center justify-between p-4 text-sm font-medium text-primary hover:bg-muted"
          >
            {vehicles.length ? "Manage vehicles" : "Add a vehicle"}
            <ChevronRight className="size-4" />
          </Link>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Payment methods
        </h2>
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

      {isOperator(user) && (
        <Link
          to="/operator"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm font-medium hover:bg-muted"
        >
          <span className="flex items-center gap-3">
            <LayoutDashboard className="size-5 text-muted-foreground" /> Operator console
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
