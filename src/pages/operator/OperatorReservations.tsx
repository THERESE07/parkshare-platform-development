import { useState } from "react";
import { Search } from "lucide-react";
import { durationMinutes, formatDateTime, formatDuration, formatRwf, RESERVATION_META } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, Input, Loading, PageHeader, Select, cn } from "../../components/ui";
import { ReservationStatusPill } from "../../components/parking";
import { loadOperatorLots } from "./data";

const filters = ["all", "PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

export default function OperatorReservations() {
  const user = useSession()!;
  const { data, loading, error } = useLoad(() => loadOperatorLots(user.userId), [user.userId]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [lotFilter, setLotFilter] = useState("all");
  const [query, setQuery] = useState("");

  const lots = data ?? [];
  const rows = lots
    .flatMap((l) => l.reservations.map((r) => ({ r, lotName: l.lot.name })))
    .filter(({ r }) => {
      const q = query.trim().toLowerCase();
      return (
        (filter === "all" || r.status === filter) &&
        (lotFilter === "all" || String(r.parkingLotId) === lotFilter) &&
        (!q || r.reservationCode.toLowerCase().includes(q) || String(r.vehicleId).includes(q))
      );
    })
    .sort((a, b) => b.r.startTime.localeCompare(a.r.startTime));

  return (
    <div>
      <PageHeader title="Reservations" description="Every booking across your lots." />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reservation code"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {lots.length > 1 && (
            <Select value={lotFilter} onChange={(e) => setLotFilter(e.target.value)} className="sm:w-56">
              <option value="all">All lots</option>
              {lots.map(({ lot }) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </Select>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
              )}
            >
              {f === "all" ? "All" : RESERVATION_META[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {loading && <Loading>Loading reservations…</Loading>}
      {error && <Alert title="Reservations could not be loaded">{error}</Alert>}

      {!loading && !error && (
        <>
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Lot</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Arrival</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ r, lotName }) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{r.reservationCode}</td>
                    <td className="px-4 py-3 font-medium">{lotName}</td>
                    <td className="px-4 py-3 text-muted-foreground">#{r.vehicleId}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(r.startTime)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDuration(durationMinutes(r))}</td>
                    <td className="px-4 py-3">
                      <ReservationStatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRwf(r.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No reservations match.</p>}
          </Card>

          <div className="space-y-3 md:hidden">
            {rows.map(({ r, lotName }) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-medium">{r.reservationCode}</p>
                    <p className="text-xs text-muted-foreground">{lotName}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatRwf(r.totalAmount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(r.startTime)} · {formatDuration(durationMinutes(r))}
                  </span>
                  <ReservationStatusPill status={r.status} />
                </div>
              </Card>
            ))}
            {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No reservations match.</p>}
          </div>
        </>
      )}
    </div>
  );
}
