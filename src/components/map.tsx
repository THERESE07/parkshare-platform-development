import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents, CircleMarker } from "react-leaflet";
import type { ParkingLot } from "../api";
import { KIGALI_CENTER, RWANDA_BOUNDS, hasLocation, insideRwanda, type LatLng } from "../lib/geo";
import { cn } from "./ui";

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function pinIcon(active: boolean, open: boolean) {
  const bg = open ? "var(--color-primary)" : "var(--color-muted-foreground)";
  const size = active ? 38 : 30;
  return L.divIcon({
    className: "ps-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:3px solid var(--color-card);box-shadow:0 4px 10px rgb(0 0 0 / .3);display:grid;place-items:center">
      <span style="transform:rotate(45deg);color:var(--color-primary-foreground);font:700 ${active ? 15 : 13}px/1 Inter,sans-serif">P</span></div>`,
  });
}

/** Keeps the view framed around the important points. */
function FitTo({ points, padding = 40 }: { points: LatLng[]; padding?: number }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], Math.max(map.getZoom(), 15));
    else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [padding, padding], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function FlyTo({ target }: { target?: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [target, map]);
  return null;
}

function UserDot({ position }: { position: LatLng }) {
  return (
    <>
      <CircleMarker center={[position.lat, position.lng]} radius={16} pathOptions={{ color: "#1d6fb8", weight: 0, fillOpacity: 0.15 }} />
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={7}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#1d6fb8", fillOpacity: 1 }}
      >
        <Popup>You are here</Popup>
      </CircleMarker>
    </>
  );
}

function BaseMap({ className, children, center = KIGALI_CENTER, zoom = 13 }: { className?: string; children: React.ReactNode; center?: LatLng; zoom?: number }) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-2xl border border-border", className)}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        maxBounds={[
          [RWANDA_BOUNDS.south - 0.5, RWANDA_BOUNDS.west - 0.5],
          [RWANDA_BOUNDS.north + 0.5, RWANDA_BOUNDS.east + 0.5],
        ]}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} className="ps-map-tiles" />
        {children}
      </MapContainer>
    </div>
  );
}

/** Map of parking lots with the driver's position and (optionally) a driving route. */
export function ParkingMap({
  lots,
  activeId,
  onSelect,
  user,
  route,
  className,
  linkToDetails = true,
}: {
  lots: ParkingLot[];
  activeId?: number;
  onSelect?: (id: number) => void;
  user?: LatLng | null;
  route?: LatLng[] | null;
  className?: string;
  linkToDetails?: boolean;
}) {
  const located = useMemo(() => lots.filter(hasLocation), [lots]);
  const fitPoints = useMemo(() => {
    const pts: LatLng[] = route?.length ? route : located.map((l) => ({ lat: l.latitude, lng: l.longitude }));
    return user && !route?.length ? [...pts, user] : pts;
  }, [located, user, route]);
  const active = located.find((l) => l.id === activeId);

  return (
    <BaseMap className={className}>
      <FitTo points={fitPoints} />
      {active && !route?.length && <FlyTo target={{ lat: active.latitude, lng: active.longitude }} />}
      {route && route.length > 1 && (
        <>
          <Polyline positions={route.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9 }} />
          <Polyline positions={route.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#1d6fb8", weight: 5 }} />
        </>
      )}
      {located.map((lot) => (
        <Marker
          key={lot.id}
          position={[lot.latitude, lot.longitude]}
          icon={pinIcon(lot.id === activeId, lot.status?.toUpperCase() === "ACTIVE")}
          eventHandlers={{ click: () => onSelect?.(lot.id) }}
        >
          <Popup>
            <p className="m-0 font-semibold">{lot.name}</p>
            <p className="m-0 text-xs opacity-75">{lot.address}</p>
            {linkToDetails && (
              <Link to={`/driver/parking/${lot.id}`} className="mt-1 inline-block text-xs font-semibold text-primary">
                View details →
              </Link>
            )}
          </Popup>
        </Marker>
      ))}
      {user && <UserDot position={user} />}
    </BaseMap>
  );
}

function PickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Tap the map to place a lot (operators). Only points inside Rwanda are accepted. */
export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  className?: string;
}) {
  return (
    <BaseMap className={className} center={value ?? KIGALI_CENTER} zoom={value ? 16 : 13}>
      <PickHandler onPick={(p) => insideRwanda(p) && onChange(p)} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon(true, true)}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              if (insideRwanda({ lat: ll.lat, lng: ll.lng })) onChange({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
    </BaseMap>
  );
}
