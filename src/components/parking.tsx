import { Link } from "react-router-dom";
import { Building2, MapPin, Phone } from "lucide-react";
import type { ParkingLot } from "../lib/api";
import { LOT_STATUS_META, RESERVATION_META, SPACE_STATUS_META, metaFor } from "../lib/format";
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

export function LotCard({ lot, className }: { lot: ParkingLot; className?: string }) {
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
        <LotStatusPill status={lot.status} />
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

export function LotCardCompact({ lot }: { lot: ParkingLot }) {
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
      <LotStatusPill status={lot.status} />
    </Link>
  );
}

/**
 * Schematic map: plots lots that have coordinates relative to each other.
 * Hidden when no lot has coordinates.
 */
export function MapSurface({
  lots,
  activeId,
  onSelect,
  className,
}: {
  lots: ParkingLot[];
  activeId?: number;
  onSelect?: (id: number) => void;
  className?: string;
}) {
  const located = lots.filter((l) => l.latitude != null && l.longitude != null);
  if (located.length === 0) return null;

  const lats = located.map((l) => l.latitude!);
  const lngs = located.map((l) => l.longitude!);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const pos = (v: number, min: number, max: number) => (max - min < 1e-6 ? 50 : 10 + ((v - min) / (max - min)) * 80);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-secondary", className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, #dfe8e5 1px, transparent 1px), linear-gradient(to bottom, #dfe8e5 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute left-0 right-0 top-[52%] h-2 -translate-y-1/2 bg-white/70" />
        <div className="absolute bottom-0 top-0 left-[46%] w-2 -translate-x-1/2 bg-white/70" />
      </div>
      <span className="absolute left-3 top-3 rounded-md bg-card/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        Schematic view · {located.length} of {lots.length} lots have a location
      </span>
      {located.map((lot) => {
        const active = lot.id === activeId;
        const open = lot.status?.toUpperCase() === "ACTIVE";
        return (
          <button
            key={lot.id}
            type="button"
            onClick={() => onSelect?.(lot.id)}
            style={{
              left: `${pos(lot.longitude!, minLng, maxLng)}%`,
              top: `${100 - pos(lot.latitude!, minLat, maxLat)}%`,
            }}
            className="group absolute z-10 -translate-x-1/2 -translate-y-full focus:outline-none"
            aria-label={lot.name}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full text-xs font-bold shadow-md ring-2 ring-card transition-transform",
                open ? "bg-primary text-primary-foreground" : "bg-muted-foreground text-white",
                active ? "scale-125" : "group-hover:scale-110",
              )}
            >
              P
            </span>
            {active && (
              <span className="absolute left-1/2 top-full mt-1 w-max max-w-[160px] -translate-x-1/2 rounded-lg bg-foreground px-2 py-1 text-[11px] font-medium text-white shadow-lg">
                {lot.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
