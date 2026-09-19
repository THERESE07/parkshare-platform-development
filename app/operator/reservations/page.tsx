'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Card, Input } from '@/components/parkshare/ui'
import { PageHeader } from '@/components/parkshare/console-shell'
import { Pill } from '@/components/parkshare/badges'
import { OPERATOR_RESERVATIONS, formatRwf, type OperatorReservation } from '@/lib/parkshare-data'
import { cn } from '@/lib/utils'

const statusTone: Record<OperatorReservation['status'], 'info' | 'success' | 'neutral' | 'danger'> = {
  reserved: 'info',
  'checked-in': 'success',
  completed: 'neutral',
  'no-show': 'danger',
}

const filters = ['all', 'reserved', 'checked-in', 'completed', 'no-show'] as const

export default function OperatorReservations() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('all')
  const [query, setQuery] = useState('')

  const rows = OPERATOR_RESERVATIONS.filter((r) => {
    const matchStatus = filter === 'all' || r.status === filter
    const q = query.trim().toLowerCase()
    const matchQuery = !q || r.driver.toLowerCase().includes(q) || r.plate.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q)
    return matchStatus && matchQuery
  })

  return (
    <div>
      <PageHeader title="Reservations" description="Every booking across your lots today." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plate, driver or reference"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                filter === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted',
              )}
            >
              {f === 'all' ? 'All' : f.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Driver</th>
              <th className="px-4 py-3 font-medium">Plate</th>
              <th className="px-4 py-3 font-medium">Arrival</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.ref} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-mono text-xs">{r.ref}</td>
                <td className="px-4 py-3 font-medium">{r.driver}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.plate}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.arrival}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.duration}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Pill tone={statusTone[r.status]}>{r.status.replace('-', ' ')}</Pill>
                    {r.payment === 'pending' && <Pill tone="warning">unpaid</Pill>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRwf(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No reservations match.</p>}
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Card key={r.ref} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{r.driver}</p>
                <p className="font-mono text-xs text-muted-foreground">{r.plate} · {r.ref}</p>
              </div>
              <p className="font-semibold tabular-nums">{formatRwf(r.amount)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{r.arrival} · {r.duration}</span>
              <Pill tone={statusTone[r.status]}>{r.status.replace('-', ' ')}</Pill>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No reservations match.</p>}
      </div>
    </div>
  )
}
