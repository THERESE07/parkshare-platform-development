import type { Reservation } from "../api";

/** RWF, whole francs (guide §7): rwf(3000) -> "3,000 RWF". */
export function formatRwf(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "—";
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(Number(amount)) + " RWF";
}

const KIGALI = "Africa/Kigali";

/** Kigali time, e.g. "10 Nov 2026, 14:30". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { timeZone: KIGALI, dateStyle: "medium", timeStyle: "short" });
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
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: KIGALI, hour: "2-digit", minute: "2-digit" });
}

export function formatDuration(minutes: number): string {
  if (minutes >= 24 * 60 && minutes % (24 * 60) === 0) {
    const d = minutes / (24 * 60);
    return `${d} ${d === 1 ? "day" : "days"}`;
  }
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function durationMinutes(r: Pick<Reservation, "startTime" | "endTime">): number {
  return (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
}

/** "mm:ss" (or "h:mm:ss") countdown text. */
export function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Value for <input type="datetime-local"> in the browser's local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Error text for display; 400 validation messages ("a: x; b: y") become one line each. */
export function errorMessage(cause: unknown, fallback: string): string {
  const message = cause instanceof Error && cause.message ? cause.message : fallback;
  return message.split("; ").join("\n");
}

/** Booking rules the UI enforces (the API enforces them too, guide §7). */
export const BOOKING_RULES = { minMinutes: 30, maxMinutes: 7 * 24 * 60, maxDaysAhead: 30 };

/** Password rule (guide §5): 8+ characters with a letter and a number. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use at least one letter and one number.";
  return null;
}

export const RWANDA_MOBILE = /^(?:\+?250|0)?7[2389]\d{7}$/;
/** MTN starts 078/079, Airtel 072/073 (guide §7). */
export function networkFor(phone: string): "MTN_MOMO" | "AIRTEL_MONEY" | null {
  const d = phone.replace(/\D/g, "").replace(/^250/, "0");
  if (/^07[89]/.test(d)) return "MTN_MOMO";
  if (/^07[23]/.test(d)) return "AIRTEL_MONEY";
  return null;
}

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

/** Reservation statuses as the guide asks them to be shown (§9). */
export const RESERVATION_META: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Awaiting payment", tone: "warning" },
  CONFIRMED: { label: "Paid", tone: "info" },
  CHECKED_IN: { label: "Parked", tone: "success" },
  COMPLETED: { label: "Done", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  NO_SHOW: { label: "No-show", tone: "neutral" },
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

export const PAYMENTS_SANDBOX = import.meta.env.VITE_PAYMENTS_SANDBOX !== "false";

/** Refund policy wording (guide §9), shown before a driver cancels. */
export const CANCEL_POLICY =
  "Full refund if you cancel 60+ minutes before the start, 50% if later, and no refund once your booking has started.";
