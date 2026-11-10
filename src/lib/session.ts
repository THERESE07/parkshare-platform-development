import { useEffect, useState } from "react";
import { AUTH_EVENT, authApi, session, type AuthResponse } from "../api";

/** The signed-in user; re-renders when someone signs in or out (or the token expires). */
export function useSession(): AuthResponse | null {
  const [user, setUser] = useState(() => authApi.currentUser());
  useEffect(() => {
    const sync = () => setUser(authApi.currentUser());
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);
  return user;
}

/** True while the login is being restored from the refresh token on app start. */
export function useSessionRestoring(): boolean {
  const [restoring, setRestoring] = useState(() => session.restoring());
  useEffect(() => {
    const sync = () => setRestoring(session.restoring());
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);
  return restoring;
}

export type Role = "DRIVER" | "OPERATOR" | "ATTENDANT" | "EVENT_ORGANIZER" | "ADMIN";

/** Roles may arrive as "OPERATOR" or "ROLE_OPERATOR". */
export function hasRole(user: AuthResponse | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return (user.roles ?? []).some((r) => roles.includes(r.toUpperCase().replace(/^ROLE_/, "") as Role));
}

export const isAdmin = (u: AuthResponse | null) => hasRole(u, "ADMIN");
export const isOperator = (u: AuthResponse | null) => hasRole(u, "OPERATOR", "ADMIN");
/** Anyone who can work the gate (check-in / check-out). */
export const isGateStaff = (u: AuthResponse | null) => hasRole(u, "OPERATOR", "ATTENDANT", "ADMIN");
export const canUseConsole = isGateStaff;

/** Where a user lands after signing in, based on their roles. */
export function homeFor(user: AuthResponse | null): string {
  if (!user) return "/";
  if (hasRole(user, "ADMIN")) return "/operator/admin";
  if (hasRole(user, "OPERATOR")) return "/operator";
  if (hasRole(user, "ATTENDANT")) return "/operator/gate";
  return "/driver";
}

export function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "P";
}
