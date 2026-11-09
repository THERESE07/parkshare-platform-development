import { useEffect, useState } from "react";
import { CornerUpRight, ExternalLink, LoaderCircle, LocateFixed, Navigation } from "lucide-react";
import type { ParkingLot } from "../api";
import { fetchRoute, formatKm, googleMapsDirections, hasLocation, useGeolocation, wazeDirections, type Route } from "../lib/geo";
import { ParkingMap } from "./map";
import { Card, buttonClass } from "./ui";

/**
 * Map + in-app driving route to a lot, with turn-by-turn steps and a hand-off
 * to Google Maps / Waze for voice navigation.
 */
export function Directions({ lot, className }: { lot: ParkingLot; className?: string }) {
  const geo = useGeolocation(true);
  const [route, setRoute] = useState<Route | null>(null);
  const [routeError, setRouteError] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const located = hasLocation(lot);
  const destination = located ? { lat: lot.latitude, lng: lot.longitude } : null;
  // Re-route only when the driver has moved ~100 m, not on every GPS tick.
  const origin = geo.position && { lat: +geo.position.lat.toFixed(3), lng: +geo.position.lng.toFixed(3) };

  useEffect(() => {
    if (!origin || !destination) return;
    const controller = new AbortController();
    setRouteError("");
    fetchRoute(origin, destination, controller.signal)
      .then(setRoute)
      .catch((e: Error) => e.name !== "AbortError" && setRouteError("Couldn't plan a driving route right now."));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  if (!destination) {
    return (
      <Card className={className ?? "p-4"}>
        <h2 className="font-sans font-semibold tracking-normal">Directions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The operator hasn't pinned this lot on the map yet. Address: {lot.address}, {lot.city}.
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lot.address}, ${lot.city}, Rwanda`)}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClass("outline", "sm", "mt-3")}
        >
          Search the address in Google Maps <ExternalLink className="size-3.5" />
        </a>
      </Card>
    );
  }

  return (
    <Card className={className ?? "overflow-hidden"}>
      <ParkingMap lots={[lot]} activeId={lot.id} user={geo.position} route={route?.path} linkToDetails={false} className="h-72 rounded-none border-0 border-b sm:h-80" />
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-sans font-semibold tracking-normal">Directions</h2>
            {route ? (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{Math.max(1, Math.round(route.durationMin))} min</span> drive ·{" "}
                {formatKm(route.distanceKm)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {geo.loading ? "Finding your location…" : geo.error || routeError || (geo.position ? "Planning route…" : "Share your location to see the route.")}
              </p>
            )}
          </div>
          {!geo.position && (
            <button type="button" onClick={geo.request} className={buttonClass("outline", "sm")}>
              {geo.loading ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
              Use my location
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={googleMapsDirections(destination)} target="_blank" rel="noreferrer" className={buttonClass("primary", "sm")}>
            <Navigation className="size-4" /> Google Maps
          </a>
          <a href={wazeDirections(destination)} target="_blank" rel="noreferrer" className={buttonClass("outline", "sm")}>
            <Navigation className="size-4" /> Waze
          </a>
        </div>

        {route && route.steps.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowSteps((s) => !s)} className="text-sm font-semibold text-primary">
              {showSteps ? "Hide" : "Show"} turn-by-turn ({route.steps.length} steps)
            </button>
            {showSteps && (
              <ol className="mt-2 divide-y divide-border rounded-xl border border-border text-sm">
                {route.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 px-3 py-2">
                    <CornerUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{s.instruction}</span>
                    {s.distanceM > 0 && <span className="shrink-0 text-xs text-muted-foreground">{formatKm(s.distanceM / 1000)}</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Route preview from OpenStreetMap data. Use Google Maps or Waze for live traffic and voice guidance.
        </p>
      </div>
    </Card>
  );
}
