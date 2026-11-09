/**
 * The one HTTP client for the ParkShare API (integration guide §4).
 * Adds the token, normalises errors and sends the user to login on 401.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
if (!API_URL) {
  console.error("VITE_API_URL is not set. Add it to .env.local (e.g. VITE_API_URL=http://localhost:8080).");
}

const TOKEN_KEY = "ps_token";
const USER_KEY = "ps_user";

/** Fired when the signed-in user changes (login, logout, expired token). */
export const AUTH_EVENT = "parkshare:auth";
/** Fired when a request is slow, e.g. the trial server waking up. */
export const WAKING_EVENT = "parkshare:waking";

export class ApiError extends Error {
  readonly status: number;
  /** For 400s: "field: message; field2: message" split into a map. */
  readonly fieldErrors: Record<string, string>;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = {};
    if (status === 400) {
      for (const part of message.split("; ")) {
        const i = part.indexOf(": ");
        if (i > 0) this.fieldErrors[part.slice(0, i)] = part.slice(i + 2);
      }
    }
  }
}

function storageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode): session lasts until reload */
  }
}

let token: string | null = storageGet(TOKEN_KEY);

export const session = {
  token: () => token,
  user<T>(): T | null {
    if (!token) return null;
    const raw = storageGet(USER_KEY);
    try {
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(newToken: string | null, user?: unknown) {
    token = newToken;
    storageSet(TOKEN_KEY, newToken);
    storageSet(USER_KEY, newToken && user ? JSON.stringify(user) : null);
    window.dispatchEvent(new Event(AUTH_EVENT));
  },
};

/* ---------- "Waking up the server…" tracking ---------- */

const SLOW_AFTER_MS = 4000;
let slowRequests = 0;
export const isServerWaking = () => slowRequests > 0;
function trackSlow(): () => void {
  let slow = false;
  const timer = window.setTimeout(() => {
    slow = true;
    slowRequests++;
    window.dispatchEvent(new Event(WAKING_EVENT));
  }, SLOW_AFTER_MS);
  return () => {
    window.clearTimeout(timer);
    if (slow) {
      slowRequests--;
      window.dispatchEvent(new Event(WAKING_EVENT));
    }
  };
}

/* ---------- Requests ---------- */

const DEFAULT_MESSAGES: Record<number, string> = {
  403: "You don't have access to this.",
  404: "We couldn't find that.",
  429: "Too many attempts. Please wait a moment and try again.",
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const done = trackSlow();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach ParkShare right now. Check your connection and try again.");
  } finally {
    done();
  }

  // Token missing or expired (24h). Login itself answers 401 for a wrong password, so skip auth routes.
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    session.set(null);
    const here = window.location.pathname + window.location.search;
    if (!window.location.pathname.startsWith("/login")) {
      window.location.assign(`/login?expired=1&next=${encodeURIComponent(here)}`);
    }
    throw new ApiError(401, "Please log in again.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    const message =
      res.status >= 500
        ? "Something went wrong on our side. Please try again; if it keeps happening, tell the ParkShare team."
        : body.message || DEFAULT_MESSAGES[res.status] || "Something went wrong.";
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function query(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});
