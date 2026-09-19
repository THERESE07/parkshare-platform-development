import { cn } from '@/lib/utils'

// Deterministic decorative QR-style matrix generated from a string.
// Not a scannable code — a realistic visual stand-in for the booking pass.
function hashToBits(input: string, cells: number): boolean[] {
  const total = cells * cells
  const bits: boolean[] = new Array(total).fill(false)
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  for (let i = 0; i < total; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    bits[i] = ((h >>> 0) & 7) < 3
  }
  return bits
}

export function QRCode({ value, className }: { value: string; className?: string }) {
  const cells = 21
  const bits = hashToBits(value, cells)
  const size = 100
  const unit = size / cells

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7
    return inBox(0, 0) || inBox(0, cells - 7) || inBox(cells - 7, 0)
  }

  const finder = (x: number, y: number, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={unit * 7} height={unit * 7} fill="currentColor" />
      <rect x={x + unit} y={y + unit} width={unit * 5} height={unit * 5} fill="var(--card)" />
      <rect x={x + unit * 2} y={y + unit * 2} width={unit * 3} height={unit * 3} fill="currentColor" />
    </g>
  )

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn('text-foreground', className)}
      role="img"
      aria-label="Booking QR pass"
    >
      <rect x={0} y={0} width={size} height={size} fill="var(--card)" />
      {bits.map((on, i) => {
        const r = Math.floor(i / cells)
        const c = i % cells
        if (isFinder(r, c) || !on) return null
        return (
          <rect
            key={i}
            x={c * unit}
            y={r * unit}
            width={unit}
            height={unit}
            fill="currentColor"
          />
        )
      })}
      {finder(0, 0, 'tl')}
      {finder(unit * (cells - 7), 0, 'tr')}
      {finder(0, unit * (cells - 7), 'bl')}
    </svg>
  )
}
