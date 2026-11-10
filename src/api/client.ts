/**
 * The one HTTP client for the ParkShare API (integration guide §4).
 * Adds the access token, refreshes it when it expires, normalises errors
 * and sends the user to login when the session can't be renewed.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
if (!API_URL) {
  console.error("VITE_API_URL is not set. Add it to .env.local (e.g. VITE_API_URL=http://localhost:8080).");
}

const REFRESH_KEY = "ps_refresh";
// Clean up keys left by the earlier single-token version.
try {
  window.localStorage.removeItem("ps_token");
  window.localStorage.removeItem("ps_user");
} catch {
  /* ignore */
}

/** Fired when the signed-in user changes (login, logout, failed refresh). */
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
    /* storage unavailable (private mode): the session lasts until reload */
  }
}

/** Shape shared by /api/auth/login and /api/auth/refresh. */
export type LoginResult = { token: string; refreshToken: string } & Record<string, unknown>;

/* Access token: short-lived (30 min), kept in memory only.
   Refresh token: 30 days, replaced on every refresh, kept in localStorage. */
let accessToken: string | null = null;
let currentUser: LoginResult | null = null;
let restoring = !!storageGet(REFRESH_KEY);
const notify = () => window.dispatchEvent(new Event(AUTH_EVENT));

export const session = {
  token: () => accessToken,
  refreshToken: () => storageGet(REFRESH_KEY),
  user: <T>() => currentUser as T | null,
  /** True while the stored refresh token is being exchanged on app start. */
  restoring: () => restoring,
  save(login: LoginResult) {
    accessToken = login.token;
    currentUser = login;
    storageSet(REFRESH_KEY, login.refreshToken);
    notify();
  },
  updateUser(changes: Record<string, unknown>) {
    if (currentUser) currentUser = { ...currentUser, ...changes };
    notify();
  },
  clear() {
    accessToken = null;
    currentUser = null;
    storageSet(REFRESH_KEY, null);
    notify();
  },
};

// Only ONE refresh may run at a time: the old refresh token stops working the
// moment it is used, so two parallel refreshes would log the user out.
let refreshing: Promise<boolean> | null = null;
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = storageGet(REFRESH_KEY);
    if (!refreshToken) return false;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      return false; // offline: keep the refresh token for later
    }
    if (!res.ok) {
      session.clear();
      return false;
    }
    session.save((await res.json()) as LoginResult);
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Called once on app start to restore the login from the stored refresh token. */
export async function restoreSession(): Promise<void> {
  if (storageGet(REFRESH_KEY)) await refreshSession();
  restoring = false;
  notify();
}

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

export async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const done = trackSlow();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach ParkShare right now. Check your connection and try again.");
  } finally {
    done();
  }

  // Login answers 401 for a wrong password, so auth routes never refresh or redirect.
  const authRoute = path.startsWith("/api/auth/");
  if (res.status === 401 && !authRoute && !retried && (await refreshSession())) {
    return api<T>(path, init, true); // access token expired: refreshed, try once more
  }
  if (res.status === 401 && !authRoute) {
    session.clear();
    if (!window.location.pathname.startsWith("/login")) {
      const here = window.location.pathname + window.location.search;
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
