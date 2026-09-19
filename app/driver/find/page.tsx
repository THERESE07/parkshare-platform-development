'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { MapSurface } from '@/components/parkshare/map-surface'
import { ParkingCard } from '@/components/parkshare/parking-card'
import { Card, Input, Select, EmptyState } from '@/components/parkshare/ui'
import { Pill } from '@/components/parkshare/badges'
import { PARKING_LOTS, type AvailabilityStatus } from '@/lib/parkshare-data'
import { cn } from '@/lib/utils'

type SortKey = 'distance' | 'price' | 'availability'
type AvailFilter = 'all' | 'available'

export default function FindParkingPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('distance')
  const [avail, setAvail] = useState<AvailFilter>('all')
  const [maxPrice, setMaxPrice] = useState(1000)
  const [activeId, setActiveId] = useState<string | undefined>(PARKING_LOTS[0]?.id)
  const [showFilters, setShowFilters] = useState(false)

  const availRank: Record<AvailabilityStatus, number> = {
    confirmed: 0,
    likely: 1,
    full: 2,
    unavailable: 3,
  }

  const lots = useMemo(() => {
    let list = PARKING_LOTS.filter((l) => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q)
      const matchesAvail = avail === 'all' || (l.availability === 'confirmed' || l.availability === 'likely')
      const matchesPrice = l.priceHour <= maxPrice
      return matchesQuery && matchesAvail && matchesPrice
    })
    list = [...list].sort((a, b) => {
      if (sort === 'price') return a.priceHour - b.priceHour
      if (sort === 'availability') return availRank[a.availability] - availRank[b.availability]
      return a.distanceKm - b.distanceKm
    })
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sort, avail, maxPrice])

  const activeCount = (avail !== 'all' ? 1 : 0) + (maxPrice < 1000 ? 1 : 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find parking</h1>
        <p className="text-sm text-muted-foreground">Verified spaces across Kigali, updated in real time.</p>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Destination, area or lot name"
            className="pl-10"
            aria-label="Search parking"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted',
            showFilters && 'border-primary/40 bg-accent text-accent-foreground',
          )}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="grid gap-4 p-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Sort by</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="distance">Closest first</option>
              <option value="price">Lowest price</option>
              <option value="availability">Best availability</option>
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Availability</span>
            <Select value={avail} onChange={(e) => setAvail(e.target.value as AvailFilter)}>
              <option value="all">Show all</option>
              <option value="available">Available only</option>
            </Select>
          </label>
          <label className="space-y-1.5">
            <span className="flex items-center justify-between text-sm font-medium">
              Max price/hr <span className="text-muted-foreground">{maxPrice} RWF</span>
            </span>
            <input
              type="range"
              min={300}
              max={1000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="h-11 w-full accent-primary"
              aria-label="Maximum price per hour"
            />
          </label>
        </Card>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {avail === 'available' && (
            <button type="button" onClick={() => setAvail('all')}>
              <Pill tone="primary">Available only <X className="size-3" /></Pill>
            </button>
          )}
          {maxPrice < 1000 && (
            <button type="button" onClick={() => setMaxPrice(1000)}>
              <Pill tone="primary">Under {maxPrice} RWF <X className="size-3" /></Pill>
            </button>
          )}
        </div>
      )}

      {/* Map */}
      <MapSurface
        lots={lots}
        activeId={activeId}
        onSelect={setActiveId}
        className="h-56 sm:h-72"
      />

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {lots.length} {lots.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {lots.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" />}
          title="No parking matches your filters"
          description="Try widening your price range or turning off the availability filter."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lots.map((lot) => (
            <div
              key={lot.id}
              onMouseEnter={() => setActiveId(lot.id)}
              className={cn(activeId === lot.id && 'rounded-2xl ring-2 ring-primary/40')}
            >
              <ParkingCard lot={lot} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
