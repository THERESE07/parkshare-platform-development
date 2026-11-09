import type { Reservation } from "./api";

export function formatRwf(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount)))
    return "—";
  return `${Math.round(Number(amount)).toLocaleString("en-US")} RWF`;
}

const KIGALI = "Africa/Kigali";

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: KIGALI,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: KIGALI,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: KIGALI,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function durationMinutes(r: Pick<Reservation, "startTime" | "endTime">): number {
  return (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
}

/** Value for <input type="datetime-local"> in the browser's local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

export const RESERVATION_META: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Awaiting payment", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  CHECKED_IN: { label: "Parked", tone: "success" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  NO_SHOW: { label: "No-show", tone: "danger" },
};

export const LOT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Open", tone: "success" },
  PENDING: { label: "Awaiting approval", tone: "warning" },
  INACTIVE: { label: "Closed", tone: "neutral" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const SPACE_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  AVAILABLE: { label: "Available", tone: "success" },
  RESERVED: { label: "Reserved", tone: "info" },
  OCCUPIED: { label: "Occupied", tone: "danger" },
  MAINTENANCE: { label: "Maintenance", tone: "warning" },
  BLOCKED: { label: "Blocked", tone: "neutral" },
};

export function metaFor(
  table: Record<string, { label: string; tone: Tone }>,
  status: string | null | undefined,
): { label: string; tone: Tone } {
  const key = (status ?? "").toUpperCase();
  return table[key] ?? { label: key ? key.replace(/_/g, " ").toLowerCase() : "unknown", tone: "neutral" };
}

export const UPCOMING_STATUSES = ["PENDING", "CONFIRMED"];
export const CLOSED_STATUSES = ["CANCELLED", "EXPIRED", "NO_SHOW"];
