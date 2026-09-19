// Central mock data + domain types for the ParkShare network.
// Content is Kigali-first and intentionally realistic.

export type AvailabilityStatus = 'confirmed' | 'likely' | 'full' | 'unavailable'

export const AVAILABILITY_META: Record<
  AvailabilityStatus,
  { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; description: string }
> = {
  confirmed: {
    label: 'Confirmed available',
    tone: 'success',
    description: 'Verified by the operator or an attendant recently.',
  },
  likely: {
    label: 'Likely available',
    tone: 'warning',
    description: 'Based on recent occupancy — not freshly confirmed.',
  },
  full: {
    label: 'Full',
    tone: 'danger',
    description: 'No free spaces reported right now.',
  },
  unavailable: {
    label: 'Temporarily unavailable',
    tone: 'neutral',
    description: 'Closed or paused by the operator.',
  },
}

export type VehicleType = 'Sedan' | 'SUV / 4x4' | 'Pickup' | 'Motorcycle' | 'Minibus'

export type ParkingLot = {
  id: string
  name: string
  operator: string
  operatorId: string
  area: string
  address: string
  distanceKm: number
  priceHour: number
  priceDay: number
  availability: AvailabilityStatus
  availableSpaces: number
  totalSpaces: number
  updatedMinutesAgo: number
  verified: boolean
  rating: number
  reviews: number
  security: string[]
  accessible: number
  vehicleTypes: VehicleType[]
  hours: string
  open24: boolean
  entrance: string
  cancellation: string
  covered: boolean
  // relative map position (0-100) inside the Kigali schematic map
  map: { x: number; y: number }
}

export const CURRENCY = 'RWF'

export function formatRwf(amount: number): string {
  return new Intl.NumberFormat('en-RW', { maximumFractionDigits: 0 }).format(amount) + ' RWF'
}

export function updatedLabel(min: number): string {
  if (min < 1) return 'just now'
  if (min === 1) return '1 min ago'
  if (min < 60) return `${min} min ago`
  const h = Math.round(min / 60)
  return h === 1 ? '1 hour ago' : `${h} hours ago`
}

export const PARKING_LOTS: ParkingLot[] = [
  {
    id: 'kct-cbd',
    name: 'Kigali City Tower Basement',
    operator: 'KCT Facilities',
    operatorId: 'op-kct',
    area: 'City Centre',
    address: 'KN 2 Ave, City Centre',
    distanceKm: 0.4,
    priceHour: 500,
    priceDay: 3500,
    availability: 'confirmed',
    availableSpaces: 34,
    totalSpaces: 220,
    updatedMinutesAgo: 3,
    verified: true,
    rating: 4.6,
    reviews: 312,
    security: ['CCTV', 'Security guards', 'Well lit', 'Barrier gate'],
    accessible: 6,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Pickup', 'Motorcycle'],
    hours: 'Mon–Sun · 06:00–22:00',
    open24: false,
    entrance: 'Enter from KN 2 Ave, ramp beside the ATM lobby. Attendant booth at level B1.',
    cancellation: 'Free cancellation up to 1 hour before arrival.',
    covered: true,
    map: { x: 46, y: 52 },
  },
  {
    id: 'kigali-heights',
    name: 'Kigali Heights Parking',
    operator: 'Century Real Estate',
    operatorId: 'op-century',
    area: 'Kimihurura',
    address: 'KG 7 Ave, opposite Convention Centre',
    distanceKm: 1.2,
    priceHour: 700,
    priceDay: 5000,
    availability: 'confirmed',
    availableSpaces: 61,
    totalSpaces: 300,
    updatedMinutesAgo: 6,
    verified: true,
    rating: 4.8,
    reviews: 540,
    security: ['CCTV', 'Security guards', 'Well lit', 'Barrier gate', 'Covered'],
    accessible: 10,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Pickup', 'Motorcycle', 'Minibus'],
    hours: 'Open 24 hours',
    open24: true,
    entrance: 'Main ramp on KG 7 Ave. Level P1 reserved for ParkShare bookings.',
    cancellation: 'Free cancellation up to 2 hours before arrival.',
    covered: true,
    map: { x: 58, y: 40 },
  },
  {
    id: 'utc-plaza',
    name: 'Union Trade Centre (UTC)',
    operator: 'UTC Management',
    operatorId: 'op-utc',
    area: 'City Centre',
    address: 'KN 4 Ave, City Centre',
    distanceKm: 0.7,
    priceHour: 500,
    priceDay: 3000,
    availability: 'likely',
    availableSpaces: 12,
    totalSpaces: 180,
    updatedMinutesAgo: 41,
    verified: true,
    rating: 4.3,
    reviews: 208,
    security: ['CCTV', 'Security guards', 'Barrier gate'],
    accessible: 4,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Motorcycle'],
    hours: 'Mon–Sun · 07:00–21:00',
    open24: false,
    entrance: 'Rooftop parking, ramp access from the rear courtyard off KN 4 Ave.',
    cancellation: 'Free cancellation up to 1 hour before arrival.',
    covered: false,
    map: { x: 42, y: 58 },
  },
  {
    id: 'convention-centre',
    name: 'Kigali Convention Centre',
    operator: 'KCC Events',
    operatorId: 'op-kcc',
    area: 'Kimihurura',
    address: 'KG 2 Roundabout, Kimihurura',
    distanceKm: 1.5,
    priceHour: 800,
    priceDay: 6000,
    availability: 'confirmed',
    availableSpaces: 140,
    totalSpaces: 500,
    updatedMinutesAgo: 2,
    verified: true,
    rating: 4.7,
    reviews: 421,
    security: ['CCTV', 'Security guards', 'Well lit', 'Barrier gate', 'Patrols'],
    accessible: 18,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Pickup', 'Minibus'],
    hours: 'Open 24 hours',
    open24: true,
    entrance: 'Gate 3 for general parking. Event zones signposted on arrival.',
    cancellation: 'Free cancellation up to 3 hours before arrival.',
    covered: false,
    map: { x: 62, y: 34 },
  },
  {
    id: 'remera-taxi',
    name: 'Remera Central Lot',
    operator: 'Remera Parking Co-op',
    operatorId: 'op-remera',
    area: 'Remera',
    address: 'KG 11 Ave, near Amahoro Stadium',
    distanceKm: 3.4,
    priceHour: 400,
    priceDay: 2500,
    availability: 'likely',
    availableSpaces: 8,
    totalSpaces: 120,
    updatedMinutesAgo: 52,
    verified: true,
    rating: 4.1,
    reviews: 96,
    security: ['Security guards', 'Well lit'],
    accessible: 2,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Pickup', 'Motorcycle', 'Minibus'],
    hours: 'Mon–Sun · 05:00–23:00',
    open24: false,
    entrance: 'Open lot, entrance off KG 11 Ave. Attendant assigns a bay on arrival.',
    cancellation: 'Free cancellation up to 1 hour before arrival.',
    covered: false,
    map: { x: 74, y: 30 },
  },
  {
    id: 'kimironko-market',
    name: 'Kimironko Market Parking',
    operator: 'Kimironko Traders Assoc.',
    operatorId: 'op-kimironko',
    area: 'Kimironko',
    address: 'KG 17 Ave, Kimironko',
    distanceKm: 5.1,
    priceHour: 300,
    priceDay: 2000,
    availability: 'full',
    availableSpaces: 0,
    totalSpaces: 90,
    updatedMinutesAgo: 4,
    verified: true,
    rating: 3.9,
    reviews: 64,
    security: ['Security guards'],
    accessible: 1,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Motorcycle'],
    hours: 'Mon–Sun · 06:00–20:00',
    open24: false,
    entrance: 'Enter beside the market main gate on KG 17 Ave.',
    cancellation: 'Free cancellation up to 30 minutes before arrival.',
    covered: false,
    map: { x: 82, y: 44 },
  },
  {
    id: 'chuk-hospital',
    name: 'CHUK Hospital Visitor Parking',
    operator: 'CHUK Facilities',
    operatorId: 'op-chuk',
    area: 'City Centre',
    address: 'KN 4 Ave, Muhima',
    distanceKm: 1.1,
    priceHour: 300,
    priceDay: 2000,
    availability: 'confirmed',
    availableSpaces: 22,
    totalSpaces: 110,
    updatedMinutesAgo: 9,
    verified: true,
    rating: 4.2,
    reviews: 145,
    security: ['CCTV', 'Security guards', 'Well lit'],
    accessible: 12,
    vehicleTypes: ['Sedan', 'SUV / 4x4', 'Pickup', 'Motorcycle'],
    hours: 'Open 24 hours',
    open24: true,
    entrance: 'Visitor gate on KN 4 Ave. Priority accessible bays near the main entrance.',
    cancellation: 'Free cancellation up to 1 hour before arrival.',
    covered: false,
    map: { x: 36, y: 46 },
  },
  {
    id: 'nyarutarama-plaza',
    name: 'Nyarutarama Plaza',
    operator: 'MK Group',
    operatorId: 'op-mk',
    area: 'Nyarutarama',
    address: 'KG 9 Ave, Nyarutarama',
    distanceKm: 4.2,
    priceHour: 600,
    priceDay: 4000,
    availability: 'unavailable',
    availableSpaces: 0,
    totalSpaces: 80,
    updatedMinutesAgo: 18,
    verified: false,
    rating: 4.0,
    reviews: 38,
    security: ['CCTV', 'Barrier gate'],
    accessible: 3,
    vehicleTypes: ['Sedan', 'SUV / 4x4'],
    hours: 'Mon–Sat · 08:00–20:00',
    open24: false,
    entrance: 'Ramp entrance beside the pharmacy. Currently closed for resurfacing.',
    cancellation: 'Free cancellation up to 1 hour before arrival.',
    covered: true,
    map: { x: 70, y: 22 },
  },
]

export function getLot(id: string): ParkingLot | undefined {
  return PARKING_LOTS.find((l) => l.id === id)
}

export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'

export type Booking = {
  id: string
  ref: string
  lotId: string
  lotName: string
  area: string
  date: string
  arrival: string
  departure: string
  plate: string
  vehicle: VehicleType
  status: BookingStatus
  amount: number
  paymentMethod: 'MTN MoMo' | 'Airtel Money' | 'Card'
  paymentStatus: 'paid' | 'pending' | 'refunded'
  entrance: string
}

export const BOOKINGS: Booking[] = [
  {
    id: 'bk-1',
    ref: 'PS-4KX92',
    lotId: 'kigali-heights',
    lotName: 'Kigali Heights Parking',
    area: 'Kimihurura',
    date: 'Today',
    arrival: '14:30',
    departure: '17:30',
    plate: 'RAD 421 C',
    vehicle: 'SUV / 4x4',
    status: 'upcoming',
    amount: 2100,
    paymentMethod: 'MTN MoMo',
    paymentStatus: 'paid',
    entrance: 'Main ramp, KG 7 Ave · Level P1',
  },
  {
    id: 'bk-2',
    ref: 'PS-7MB18',
    lotId: 'kct-cbd',
    lotName: 'Kigali City Tower Basement',
    area: 'City Centre',
    date: 'Today',
    arrival: '09:05',
    departure: '—',
    plate: 'RAD 421 C',
    vehicle: 'SUV / 4x4',
    status: 'active',
    amount: 1500,
    paymentMethod: 'MTN MoMo',
    paymentStatus: 'paid',
    entrance: 'KN 2 Ave ramp · Level B1',
  },
  {
    id: 'bk-3',
    ref: 'PS-2QP55',
    lotId: 'convention-centre',
    lotName: 'Kigali Convention Centre',
    area: 'Kimihurura',
    date: '12 Sep 2026',
    arrival: '18:00',
    departure: '22:15',
    plate: 'RAD 421 C',
    vehicle: 'SUV / 4x4',
    status: 'completed',
    amount: 3400,
    paymentMethod: 'Airtel Money',
    paymentStatus: 'paid',
    entrance: 'Gate 3',
  },
  {
    id: 'bk-4',
    ref: 'PS-9RT03',
    lotId: 'utc-plaza',
    lotName: 'Union Trade Centre (UTC)',
    area: 'City Centre',
    date: '5 Sep 2026',
    arrival: '11:00',
    departure: '13:00',
    plate: 'RAD 421 C',
    vehicle: 'SUV / 4x4',
    status: 'cancelled',
    amount: 1000,
    paymentMethod: 'MTN MoMo',
    paymentStatus: 'refunded',
    entrance: 'Rooftop ramp',
  },
]

export type ParkingEvent = {
  id: string
  name: string
  venue: string
  area: string
  date: string
  time: string
  organizer: string
  zones: { id: string; name: string; capacity: number; occupied: number; price: number; status: AvailabilityStatus }[]
}

export const EVENTS: ParkingEvent[] = [
  {
    id: 'ev-amahoro',
    name: 'Rwanda vs. Nigeria — AFCON Qualifier',
    venue: 'Amahoro Stadium',
    area: 'Remera',
    date: 'Sat 26 Sep 2026',
    time: 'Gates 15:00 · Kickoff 17:00',
    organizer: 'FERWAFA Events',
    zones: [
      { id: 'a', name: 'Zone A — North Gate', capacity: 400, occupied: 328, price: 2000, status: 'likely' },
      { id: 'b', name: 'Zone B — East Gate', capacity: 350, occupied: 150, price: 1500, status: 'confirmed' },
      { id: 'c', name: 'Zone C — VIP', capacity: 120, occupied: 120, price: 5000, status: 'full' },
    ],
  },
  {
    id: 'ev-bkarena',
    name: 'BAL Playoffs — Kigali Finals',
    venue: 'BK Arena',
    area: 'Remera',
    date: 'Fri 2 Oct 2026',
    time: 'Doors 17:30 · Tip-off 19:00',
    organizer: 'BAL Operations',
    zones: [
      { id: 'a', name: 'Zone A — Main Lot', capacity: 300, occupied: 96, price: 2500, status: 'confirmed' },
      { id: 'b', name: 'Zone B — Overflow', capacity: 250, occupied: 60, price: 1500, status: 'confirmed' },
    ],
  },
  {
    id: 'ev-kcc',
    name: 'Kigali Tech & Business Summit',
    venue: 'Kigali Convention Centre',
    area: 'Kimihurura',
    date: 'Wed 14 Oct 2026',
    time: 'All day · 08:00–18:00',
    organizer: 'RDB Events',
    zones: [
      { id: 'a', name: 'Zone A — Delegates', capacity: 500, occupied: 210, price: 3000, status: 'confirmed' },
      { id: 'b', name: 'Zone B — General', capacity: 300, occupied: 240, price: 2000, status: 'likely' },
    ],
  },
]

export function getEvent(id: string) {
  return EVENTS.find((e) => e.id === id)
}

// ---- Operator-facing reservations feed ----
export type OperatorReservation = {
  ref: string
  driver: string
  plate: string
  arrival: string
  duration: string
  status: 'reserved' | 'checked-in' | 'completed' | 'no-show'
  payment: 'paid' | 'pending'
  amount: number
}

export const OPERATOR_RESERVATIONS: OperatorReservation[] = [
  { ref: 'PS-4KX92', driver: 'Aline U.', plate: 'RAD 421 C', arrival: 'Today 14:30', duration: '3 hrs', status: 'reserved', payment: 'paid', amount: 2100 },
  { ref: 'PS-8LM27', driver: 'Jean-Paul H.', plate: 'RAB 908 D', arrival: 'Today 15:00', duration: '2 hrs', status: 'reserved', payment: 'paid', amount: 1400 },
  { ref: 'PS-1WZ44', driver: 'Claudine M.', plate: 'RAD 112 A', arrival: 'Today 09:15', duration: 'Open', status: 'checked-in', payment: 'paid', amount: 1500 },
  { ref: 'PS-3TY67', driver: 'Eric N.', plate: 'RAC 550 B', arrival: 'Today 08:40', duration: 'Open', status: 'checked-in', payment: 'paid', amount: 1500 },
  { ref: 'PS-6QN19', driver: 'Sandrine K.', plate: 'RAD 771 E', arrival: 'Today 16:30', duration: '4 hrs', status: 'reserved', payment: 'pending', amount: 2800 },
  { ref: 'PS-5HD82', driver: 'Patrick R.', plate: 'RAB 233 F', arrival: 'Today 07:00', duration: '1.5 hrs', status: 'completed', payment: 'paid', amount: 1050 },
  { ref: 'PS-0FG31', driver: 'Diane I.', plate: 'RAD 019 G', arrival: 'Today 10:00', duration: '2 hrs', status: 'no-show', payment: 'paid', amount: 1400 },
]

export type ActiveVehicle = {
  ref: string
  plate: string
  bay: string
  since: string
  driver: string
}

export const ACTIVE_VEHICLES: ActiveVehicle[] = [
  { ref: 'PS-1WZ44', plate: 'RAD 112 A', bay: 'B1-014', since: '09:15', driver: 'Claudine M.' },
  { ref: 'PS-3TY67', plate: 'RAC 550 B', bay: 'B1-022', since: '08:40', driver: 'Eric N.' },
  { ref: 'PS-7MB18', plate: 'RAD 421 C', bay: 'B1-031', since: '09:05', driver: 'Aline U.' },
]

// ---- Admin ----
export type OperatorAccount = {
  id: string
  name: string
  contact: string
  lots: number
  area: string
  status: 'verified' | 'pending' | 'suspended'
  joined: string
}

export const OPERATOR_ACCOUNTS: OperatorAccount[] = [
  { id: 'op-kct', name: 'KCT Facilities', contact: 'ops@kct.rw', lots: 1, area: 'City Centre', status: 'verified', joined: 'Jan 2026' },
  { id: 'op-century', name: 'Century Real Estate', contact: 'parking@centuryrw.com', lots: 3, area: 'Kimihurura', status: 'verified', joined: 'Feb 2026' },
  { id: 'op-remera', name: 'Remera Parking Co-op', contact: 'coop@remera.rw', lots: 2, area: 'Remera', status: 'pending', joined: 'Sep 2026' },
  { id: 'op-mk', name: 'MK Group', contact: 'facilities@mkgroup.rw', lots: 1, area: 'Nyarutarama', status: 'pending', joined: 'Sep 2026' },
  { id: 'op-kimironko', name: 'Kimironko Traders Assoc.', contact: 'admin@kimironko.rw', lots: 1, area: 'Kimironko', status: 'suspended', joined: 'Mar 2026' },
]

export type Dispute = {
  id: string
  ref: string
  driver: string
  lot: string
  issue: string
  amount: number
  status: 'open' | 'reviewing' | 'resolved'
  opened: string
}

export const DISPUTES: Dispute[] = [
  { id: 'd1', ref: 'PS-9RT03', driver: 'Aline U.', lot: 'Union Trade Centre (UTC)', issue: 'Reserved bay was full on arrival', amount: 1000, status: 'reviewing', opened: '2 hours ago' },
  { id: 'd2', ref: 'PS-2XA11', driver: 'Kevin B.', lot: 'Remera Central Lot', issue: 'Charged twice — MoMo double debit', amount: 800, status: 'open', opened: '5 hours ago' },
  { id: 'd3', ref: 'PS-4KP90', driver: 'Grace M.', lot: 'Nyarutarama Plaza', issue: 'Lot closed but listed as available', amount: 600, status: 'open', opened: '1 day ago' },
  { id: 'd4', ref: 'PS-7YU23', driver: 'Olivier T.', lot: 'Kigali City Tower Basement', issue: 'Overcharged for extra hour', amount: 500, status: 'resolved', opened: '2 days ago' },
]

export type AuditEntry = {
  id: string
  actor: string
  action: string
  target: string
  time: string
}

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'a1', actor: 'admin@parkshare.rw', action: 'Verified operator', target: 'Century Real Estate', time: 'Today 08:12' },
  { id: 'a2', actor: 'admin@parkshare.rw', action: 'Issued refund', target: 'PS-7YU23 · 500 RWF', time: 'Today 07:48' },
  { id: 'a3', actor: 'system', action: 'Flagged stale availability', target: 'Nyarutarama Plaza', time: 'Yesterday 19:30' },
  { id: 'a4', actor: 'ops@kct.rw', action: 'Updated pricing', target: 'Kigali City Tower Basement', time: 'Yesterday 16:02' },
  { id: 'a5', actor: 'admin@parkshare.rw', action: 'Suspended operator', target: 'Kimironko Traders Assoc.', time: '2 days ago' },
]

export const KIGALI_DESTINATIONS = [
  'Kigali City Centre',
  'Kacyiru',
  'Kimihurura',
  'Remera',
  'Kimironko',
  'Nyarutarama',
  'Amahoro Stadium',
  'BK Arena',
  'Kigali Convention Centre',
  'CHUK Hospital',
  'University of Rwanda — Gikondo',
  'Kigali Heights',
]
