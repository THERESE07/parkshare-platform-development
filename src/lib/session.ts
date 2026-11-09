import { useEffect, useState } from "react";
import { AUTH_EVENT, authApi, type AuthResponse } from "./api";

/** The signed-in user; re-renders when someone signs in or out. */
export function useSession(): AuthResponse | null {
  const [user, setUser] = useState(() => authApi.currentUser());
  useEffect(() => {
    const sync = () => setUser(authApi.currentUser());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return user;
}

/** Roles may arrive as "OPERATOR" or "ROLE_OPERATOR". */
export function hasRole(user: AuthResponse | null, ...roles: string[]): boolean {
  if (!user) return false;
  return user.roles.some((role) =>
    roles.some((wanted) => role.toUpperCase().endsWith(wanted)),
  );
}

export function isOperator(user: AuthResponse | null): boolean {
  return hasRole(user, "OPERATOR", "ADMIN");
}

/** Where a user lands after signing in. */
export function homeFor(user: AuthResponse | null): string {
  if (!user) return "/";
  if (isOperator(user) && !hasRole(user, "DRIVER")) return "/operator";
  return "/driver";
}

export function initials(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "P";
}
