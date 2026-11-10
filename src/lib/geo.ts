import { useCallback, useEffect, useRef, useState } from "react";

export type LatLng = { lat: number; lng: number };

export const KIGALI_CENTER: LatLng = { lat: -1.9441, lng: 30.0619 };
/** Rough bounding box of Rwanda; lots must be inside it (guide §10). */
export const RWANDA_BOUNDS = { south: -2.84, north: -1.05, west: 28.86, east: 30.9 };

export function insideRwanda(p: LatLng): boolean {
  return p.lat >= RWANDA_BOUNDS.south && p.lat <= RWANDA_BOUNDS.north && p.lng >= RWANDA_BOUNDS.west && p.lng <= RWANDA_BOUNDS.east;
}

export function hasLocation<T extends { latitude?: number | null; longitude?: number | null }>(
  x: T,
): x is T & { latitude: number; longitude: number } {
  return typeof x.latitude === "number" && typeof x.longitude === "number";
}

/** Straight-line distance in km (map/distance search isn't in the API yet, so we sort client-side). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** Hand off to the phone's navigation apps. */
export function googleMapsDirections(to: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=driving`;
}
export function wazeDirections(to: LatLng): string {
  return `https://waze.com/ul?ll=${to.lat},${to.lng}&navigate=yes`;
}

/* ---------- Device location ---------- */

type GeoState = { position: LatLng | null; error: string; loading: boolean };

/**
 * The driver's live position. Only asks for permission when `request()` is called
 * (or immediately when `auto` is true and permission was granted before).
 */
export function useGeolocation(auto = false) {
  const [state, setState] = useState<GeoState>({ position: null, error: "", loading: false });
  const watchId = useRef<number | null>(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, error: "Location isn't available in this browser." }));
      return;
    }
    if (watchId.current !== null) return;
    setState((s) => ({ ...s, loading: true, error: "" }));
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setState({ position: { lat: pos.coords.latitude, lng: pos.coords.longitude }, error: "", loading: false }),
      (err) => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setState((s) => ({
          ...s,
          loading: false,
          error: err.code === err.PERMISSION_DENIED ? "Location permission was denied." : "We couldn't find your location.",
        }));
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
  }, []);

  useEffect(() => {
    if (auto) {
      navigator.permissions
        ?.query({ name: "geolocation" as PermissionName })
        .then((p) => p.state === "granted" && request())
        .catch(() => undefined);
    }
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [auto, request]);

  return { ...state, request };
}

/* ---------- Driving route (OSRM) ---------- */

const ROUTING_URL = (import.meta.env.VITE_ROUTING_URL || "https://router.project-osrm.org").replace(/\/+$/, "");

export type RouteStep = { instruction: string; distanceM: number };
export type Route = { path: LatLng[]; distanceKm: number; durationMin: number; steps: RouteStep[] };

type OsrmStep = {
  distance: number;
  name: string;
  maneuver: { type: string; modifier?: string; exit?: number };
};

function describe(step: OsrmStep): string {
  const { type, modifier, exit } = step.maneuver;
  const road = step.name ? ` onto ${step.name}` : "";
  const dir = modifier ? modifier.replace("uturn", "U-turn") : "";
  switch (type) {
    case "depart":
      return `Head out${step.name ? ` on ${step.name}` : ""}`;
    case "arrive":
      return "Arrive at the parking";
    case "roundabout":
    case "rotary":
      return `At the roundabout, take exit ${exit ?? ""}${road}`.replace("exit  ", "the exit ");
    case "merge":
      return `Merge ${dir}${road}`.trim();
    case "fork":
      return `Keep ${dir} at the fork${road}`;
    case "end of road":
      return `At the end of the road, turn ${dir}${road}`;
    case "continue":
    case "new name":
      return `Continue${dir && dir !== "straight" ? ` ${dir}` : ""}${road}`;
    default:
      return dir === "straight" ? `Go straight${road}` : `Turn ${dir}${road}`;
  }
}

export async function fetchRoute(from: LatLng, to: LatLng, signal?: AbortSignal): Promise<Route> {
  const url = `${ROUTING_URL}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Route service unavailable");
  const data = (await res.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { steps: OsrmStep[] }[] }[];
  };
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) throw new Error("No driving route found");
  return {
    path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    steps: route.legs.flatMap((leg) => leg.steps).map((s) => ({ instruction: describe(s), distanceM: s.distance })),
  };
}
