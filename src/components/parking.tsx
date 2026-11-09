import { Link } from "react-router-dom";
import { Building2, MapPin, Navigation, Phone } from "lucide-react";
import type { ParkingLot } from "../api";
import { LOT_STATUS_META, RESERVATION_META, SPACE_STATUS_META, metaFor } from "../lib/format";
import { formatKm } from "../lib/geo";
import { Pill, cn } from "./ui";

export function LotStatusPill({ status }: { status: string }) {
  const meta = metaFor(LOT_STATUS_META, status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function ReservationStatusPill({ status }: { status: string }) {
  const meta = metaFor(RESERVATION_META, status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function SpaceStatusPill({ status }: { status: string }) {
  const meta = metaFor(SPACE_STATUS_META, status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function LotCard({ lot, distance, className }: { lot: ParkingLot; distance?: number | null; className?: string }) {
  return (
    <Link
      to={`/driver/parking/${lot.id}`}
      className={cn(
        "block h-full rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-sans font-semibold leading-tight tracking-normal">{lot.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {lot.address}, {lot.city}
            </span>
          </p>
        </div>
        {distance != null ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            <Navigation className="size-3" /> {formatKm(distance)}
          </span>
        ) : (
          <LotStatusPill status={lot.status} />
        )}
      </div>
      {lot.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{lot.description}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Building2 className="size-3.5" />
          {lot.totalCapacity ? `${lot.totalCapacity} spaces` : "Capacity not set"}
        </span>
        {lot.contactPhone && (
          <span className="flex items-center gap-1">
            <Phone className="size-3.5" />
            {lot.contactPhone}
          </span>
        )}
      </div>
    </Link>
  );
}

export function LotCardCompact({ lot, distance }: { lot: ParkingLot; distance?: number | null }) {
  return (
    <Link
      to={`/driver/parking/${lot.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{lot.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lot.address}, {lot.city}
        </p>
      </div>
      {distance != null ? (
        <span className="shrink-0 text-xs font-semibold text-primary">{formatKm(distance)}</span>
      ) : (
        <LotStatusPill status={lot.status} />
      )}
    </Link>
  );
}
