import { useMemo, useState } from "react";
import { List, LoaderCircle, LocateFixed, Map as MapIcon, Search, X } from "lucide-react";
import { parkingApi } from "../../api";
import { distanceKm, hasLocation, useGeolocation } from "../../lib/geo";
import { useLoad } from "../../lib/useLoad";
import { Alert, EmptyState, Input, Loading, PageHeader, Pill, Select, buttonClass, cn } from "../../components/ui";
import { LotCard } from "../../components/parking";
import { ParkingMap } from "../../components/map";

type SortKey = "distance" | "name" | "capacity";

export default function FindParking() {
  // Approved lots only: /parking-lots also returns lots awaiting approval (guide §9).
  const { data: lots, loading, error } = useLoad(() => parkingApi.list().then((lots) => lots.filter((l) => l.status?.toUpperCase() === "ACTIVE")));
  const geo = useGeolocation(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("distance");
  const [city, setCity] = useState("all");
  const [activeId, setActiveId] = useState<number | undefined>();
  const [view, setView] = useState<"split" | "list">("split");

  const cities = useMemo(() => [...new Set((lots ?? []).map((l) => l.city).filter(Boolean))].sort(), [lots]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (lots ?? [])
      .filter((l) => !q || `${l.name} ${l.address} ${l.city} ${l.description ?? ""}`.toLowerCase().includes(q))
      .filter((l) => city === "all" || l.city === city)
      .map((lot) => ({
        lot,
        distance: geo.position && hasLocation(lot) ? distanceKm(geo.position, { lat: lot.latitude, lng: lot.longitude }) : null,
      }));
    return list.sort((a, b) => {
      if (sort === "distance" && (a.distance !== null || b.distance !== null))
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      if (sort === "capacity") return (b.lot.totalCapacity ?? 0) - (a.lot.totalCapacity ?? 0);
      return a.lot.name.localeCompare(b.lot.name);
    });
  }, [lots, query, city, sort, geo.position]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Find parking"
        description="Approved parking lots near you."
        action={
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(["split", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
                  view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {v === "split" ? <MapIcon className="size-4" /> : <List className="size-4" />}
                {v === "split" ? "Map" : "List"}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Lot name, street or city" className="pl-10" aria-label="Search parking" />
        </div>
        <div className="flex gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort by" className="sm:w-44">
            <option value="distance">Nearest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="capacity">Largest</option>
          </Select>
          {cities.length > 1 && (
            <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" className="sm:w-40">
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
          {!geo.position && (
            <button type="button" onClick={geo.request} className={buttonClass("outline", "md", "shrink-0")} title="Use my location">
              {geo.loading ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
              <span className="hidden sm:inline">Near me</span>
            </button>
          )}
        </div>
      </div>

      {(city !== "all" || query) && (
        <div className="flex flex-wrap gap-2">
          {query && (
            <button type="button" onClick={() => setQuery("")}>
              <Pill tone="primary">
                “{query}” <X className="size-3" />
              </Pill>
            </button>
          )}
          {city !== "all" && (
            <button type="button" onClick={() => setCity("all")}>
              <Pill tone="primary">
                {city} <X className="size-3" />
              </Pill>
            </button>
          )}
        </div>
      )}
      {geo.error && <p className="text-xs text-muted-foreground">{geo.error} Distances are hidden.</p>}

      {loading && <Loading>Loading parking…</Loading>}
      {error && <Alert title="Parking could not be loaded">{error}</Alert>}

      {!loading && !error && (
        <div className={cn(view === "split" && "grid gap-4 lg:grid-cols-[1fr_1.1fr]")}>
          {view === "split" && (
            <ParkingMap
              lots={results.map((r) => r.lot)}
              activeId={activeId}
              onSelect={setActiveId}
              user={geo.position}
              className="h-72 sm:h-96 lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)]"
            />
          )}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {results.length} {results.length === 1 ? "lot" : "lots"}
              {results.some((r) => !hasLocation(r.lot)) && " · some lots aren't pinned on the map yet"}
            </p>
            {results.length === 0 ? (
              <EmptyState icon={<Search className="size-6" />} title="No parking matches your search" description="Try another name, street or city." />
            ) : (
              <div className={cn("grid gap-3", view === "list" && "sm:grid-cols-2")}>
                {results.map(({ lot, distance }) => (
                  <div
                    key={lot.id}
                    onMouseEnter={() => setActiveId(lot.id)}
                    className={cn(activeId === lot.id && "rounded-2xl ring-2 ring-primary/40")}
                  >
                    <LotCard lot={lot} distance={distance} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
