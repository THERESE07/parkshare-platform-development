import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { parkingApi } from "../../lib/api";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, EmptyState, Input, Loading, PageHeader, Pill, Select, cn } from "../../components/ui";
import { LotCard, MapSurface } from "../../components/parking";

type SortKey = "name" | "capacity" | "newest";

export default function FindParking() {
  const { data: lots, loading, error } = useLoad(() => parkingApi.list());
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [openOnly, setOpenOnly] = useState(true);
  const [city, setCity] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState<number | undefined>();

  const cities = useMemo(
    () => [...new Set((lots ?? []).map((l) => l.city).filter(Boolean))].sort(),
    [lots],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (lots ?? []).filter((l) => {
      const matchesQuery =
        !q || `${l.name} ${l.address} ${l.city} ${l.description ?? ""}`.toLowerCase().includes(q);
      const matchesOpen = !openOnly || l.status?.toUpperCase() === "ACTIVE";
      const matchesCity = city === "all" || l.city === city;
      return matchesQuery && matchesOpen && matchesCity;
    });
    return [...list].sort((a, b) => {
      if (sort === "capacity") return (b.totalCapacity ?? 0) - (a.totalCapacity ?? 0);
      if (sort === "newest") return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      return a.name.localeCompare(b.name);
    });
  }, [lots, query, sort, openOnly, city]);

  const activeCount = (openOnly ? 0 : 1) + (city !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Find parking" description="Parking lots registered on ParkShare, straight from the operators." />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lot name, street or city"
            className="pl-10"
            aria-label="Search parking"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted",
            showFilters && "border-primary/40 bg-accent text-accent-foreground",
          )}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <Card className="grid gap-4 p-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Sort by</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="name">Name (A–Z)</option>
              <option value="capacity">Largest capacity</option>
              <option value="newest">Newest on ParkShare</option>
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Status</span>
            <Select value={openOnly ? "open" : "all"} onChange={(e) => setOpenOnly(e.target.value === "open")}>
              <option value="open">Open for booking only</option>
              <option value="all">Show all lots</option>
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">City</span>
            <Select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
        </Card>
      )}

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {!openOnly && (
            <button type="button" onClick={() => setOpenOnly(true)}>
              <Pill tone="primary">
                Including closed lots <X className="size-3" />
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

      {loading && <Loading>Loading parking…</Loading>}
      {error && <Alert title="Parking could not be loaded">{error}</Alert>}

      {!loading && !error && (
        <>
          <MapSurface lots={results} activeId={activeId} onSelect={setActiveId} className="h-56 sm:h-72" />
          <p className="text-sm font-medium text-muted-foreground">
            {results.length} {results.length === 1 ? "result" : "results"}
          </p>
          {results.length === 0 ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No parking matches your search"
              description={
                openOnly
                  ? "Try another search, or include lots that are not open for booking yet."
                  : "Try another search or clear your filters."
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((lot) => (
                <div
                  key={lot.id}
                  onMouseEnter={() => setActiveId(lot.id)}
                  className={cn(activeId === lot.id && "rounded-2xl ring-2 ring-primary/40")}
                >
                  <LotCard lot={lot} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
