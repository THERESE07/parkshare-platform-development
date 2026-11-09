import { useState } from "react";
import { BadgeCheck, Building2, Users } from "lucide-react";
import { parkingApi, userApi, verificationApi, type OperatorVerification, type ParkingLot } from "../../api";
import { errorMessage, formatDateTime } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, EmptyState, Input, Loading, PageHeader, Pill, buttonClass, cn } from "../../components/ui";
import { LotStatusPill } from "../../components/parking";

type Tab = "lots" | "operators" | "users";

/** Admin console (guide §12): approve lots, review operators, list users. */
export default function Admin() {
  const [tab, setTab] = useState<Tab>("lots");
  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "lots", label: "Lot approvals", icon: Building2 },
    { key: "operators", label: "Operator verification", icon: BadgeCheck },
    { key: "users", label: "Users", icon: Users },
  ];
  return (
    <div>
      <PageHeader title="Admin" description="Approve parking lots, verify operators and see who's on ParkShare." />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === "lots" && <LotApprovals />}
      {tab === "operators" && <OperatorReviews />}
      {tab === "users" && <UsersList />}
    </div>
  );
}

function LotApprovals() {
  const { data, setData, loading, error } = useLoad(async () => {
    const [pending, active] = await Promise.all([parkingApi.listByStatus("PENDING"), parkingApi.listByStatus("ACTIVE")]);
    return { pending, active };
  });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  async function setStatus(lot: ParkingLot, status: string) {
    setBusyId(lot.id);
    setActionError("");
    try {
      const updated = await parkingApi.setStatus(lot.id, status);
      setData((d) => {
        if (!d) return d;
        const pending = d.pending.filter((l) => l.id !== lot.id);
        const active = d.active.filter((l) => l.id !== lot.id);
        if (updated.status === "ACTIVE") active.unshift(updated);
        else if (updated.status === "PENDING") pending.unshift(updated);
        return { pending, active };
      });
    } catch (cause) {
      setActionError(errorMessage(cause, "The lot status couldn't be changed."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loading>Loading lots…</Loading>;
  if (error) return <Alert>{error}</Alert>;

  const row = (lot: ParkingLot, actions: React.ReactNode) => (
    <Card key={lot.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{lot.name}</p>
          <LotStatusPill status={lot.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {lot.address}, {lot.city} · operator #{lot.operatorId} · {lot.totalCapacity ?? "?"} spaces
          {lot.latitude == null && " · not pinned on map"}
        </p>
        <p className="text-xs text-muted-foreground">Submitted {formatDateTime(lot.createdAt)}</p>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {actionError && <Alert>{actionError}</Alert>}
      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Awaiting approval ({data?.pending.length ?? 0})
        </h2>
        {data?.pending.length ? (
          <div className="space-y-2">
            {data.pending.map((lot) =>
              row(
                lot,
                <button type="button" disabled={busyId === lot.id} onClick={() => setStatus(lot, "ACTIVE")} className={buttonClass("primary", "sm")}>
                  Approve
                </button>,
              ),
            )}
          </div>
        ) : (
          <EmptyState title="Nothing to approve" description="New lots appear here after operators submit them." />
        )}
      </section>
      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold uppercase tracking-wide text-muted-foreground">Open lots ({data?.active.length ?? 0})</h2>
        <div className="space-y-2">
          {data?.active.map((lot) =>
            row(
              lot,
              <button type="button" disabled={busyId === lot.id} onClick={() => setStatus(lot, "SUSPENDED")} className={buttonClass("danger", "sm")}>
                Suspend
              </button>,
            ),
          )}
        </div>
      </section>
    </div>
  );
}

function OperatorReviews() {
  const admin = useSession()!;
  const { data, setData, loading, error } = useLoad(() => verificationApi.listAll());
  const [showAll, setShowAll] = useState(false);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  async function review(v: OperatorVerification, verificationStatus: "VERIFIED" | "REJECTED") {
    if (verificationStatus === "REJECTED" && !reasons[v.id]?.trim()) {
      setActionError("Give the operator a reason before rejecting.");
      return;
    }
    setBusyId(v.id);
    setActionError("");
    try {
      const updated = await verificationApi.review(v.id, admin.userId, {
        verificationStatus,
        vatRegistered: v.vatRegistered,
        rejectionReason: verificationStatus === "REJECTED" ? reasons[v.id].trim() : undefined,
      });
      setData((list) => (list ?? []).map((x) => (x.id === v.id ? updated : x)));
    } catch (cause) {
      setActionError(errorMessage(cause, "The review couldn't be saved."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loading>Loading verifications…</Loading>;
  if (error) return <Alert>{error}</Alert>;
  const list = (data ?? []).filter((v) => showAll || (v.verificationStatus ?? "PENDING").toUpperCase() === "PENDING");

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show already reviewed
      </label>
      {actionError && <Alert>{actionError}</Alert>}
      {list.length === 0 && <EmptyState title="No verifications waiting" description="Operators submit their business and VAT details from their console." />}
      {list.map((v) => {
        const pending = (v.verificationStatus ?? "PENDING").toUpperCase() === "PENDING";
        return (
          <Card key={v.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{v.businessName}</p>
                <p className="text-sm text-muted-foreground">
                  Reg. no. {v.businessRegistrationNumber || "—"} · TIN {v.tin || "—"} · {v.vatRegistered ? "VAT registered" : "not VAT registered"}
                </p>
                <p className="text-xs text-muted-foreground">
                  User #{v.userId} · submitted {formatDateTime(v.submittedAt)}
                </p>
              </div>
              <Pill tone={pending ? "warning" : v.verificationStatus === "VERIFIED" ? "success" : "danger"}>{(v.verificationStatus ?? "PENDING").toLowerCase()}</Pill>
            </div>
            {v.rejectionReason && <p className="mt-2 text-sm text-destructive">Reason: {v.rejectionReason}</p>}
            {pending && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  aria-label="Rejection reason"
                  placeholder="Reason (required to reject)"
                  value={reasons[v.id] ?? ""}
                  onChange={(e) => setReasons((r) => ({ ...r, [v.id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button type="button" disabled={busyId === v.id} onClick={() => review(v, "VERIFIED")} className={buttonClass("primary", "md")}>
                    Verify
                  </button>
                  <button type="button" disabled={busyId === v.id} onClick={() => review(v, "REJECTED")} className={buttonClass("danger", "md")}>
                    Reject
                  </button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function UsersList() {
  const [page, setPage] = useState(0);
  const { data, loading, error } = useLoad(() => userApi.list(page), [page]);
  if (loading && !data) return <Loading>Loading users…</Loading>;
  if (error) return <Alert>{error}</Alert>;
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.content.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
                <td className="px-4 py-3">
                  <Pill tone={u.status === "ACTIVE" ? "success" : "neutral"}>{u.status?.toLowerCase()}</Pill>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          {data?.totalElements ?? 0} users · page {page + 1} of {Math.max(1, data?.totalPages ?? 1)}
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={buttonClass("outline", "sm")}>
            Previous
          </button>
          <button type="button" disabled={data?.last ?? true} onClick={() => setPage((p) => p + 1)} className={buttonClass("outline", "sm")}>
            Next
          </button>
        </div>
      </div>
    </Card>
  );
}
