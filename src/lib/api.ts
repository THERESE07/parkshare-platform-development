const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, '')
const TOKEN_KEY = 'parkshare.accessToken'

export type ApiErrorBody = {
  message?: string
  error?: string
  detail?: string
  timestamp?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(message: string, status: number, body: ApiErrorBody | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export const authToken = {
  get(): string | null {
    return window.sessionStorage.getItem(TOKEN_KEY)
  },
  set(token: string): void {
    window.sessionStorage.setItem(TOKEN_KEY, token)
  },
  clear(): void {
    window.sessionStorage.removeItem(TOKEN_KEY)
  },
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = authToken.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      'Cannot reach the ParkShare API. Check that Spring Boot is running and VITE_API_BASE_URL is correct.',
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const raw = await response.text()
  let data: unknown = undefined
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      data = raw
    }
  }

  if (!response.ok) {
    const body = data && typeof data === 'object' ? (data as ApiErrorBody) : null
    const message =
      body?.message ||
      body?.detail ||
      body?.error ||
      (typeof data === 'string' ? data : '') ||
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, body)
  }

  return data as T
}

function queryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export type LoginRequest = { email: string; password: string }
export type RegisterRequest = {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}
export type AuthResponse = {
  token: string
  tokenType: string
  userId: number
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export type ParkingLot = {
  id: number
  operatorId: number
  name: string
  description: string | null
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  contactPhone: string | null
  totalCapacity: number | null
  status: string
  createdAt: string
  updatedAt: string
}

export type ParkingLotRequest = {
  name: string
  description?: string
  address: string
  district?: string
  city: string
  latitude?: number
  longitude?: number
  contactPhone?: string
  totalCapacity?: number
  status?: string
}

export type ParkingZone = {
  id: number
  parkingLotId: number
  name: string
  description: string | null
  capacity: number | null
  status: string
}

export type ParkingSpace = {
  id: number
  parkingZoneId: number
  spaceCode: string
  spaceType: string
  status: string
  floor: string | null
}

export type Vehicle = {
  id: number
  userId: number
  plateNumber: string
  vehicleType: string
  make: string | null
  model: string | null
  color: string | null
  isDefault: boolean
  isActive: boolean
}
export type VehicleRequest = {
  plateNumber: string
  vehicleType: string
  make?: string
  model?: string
  color?: string
  isDefault?: boolean
  isActive?: boolean
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' | string
export type Reservation = {
  id: number
  reservationCode: string
  userId: number
  vehicleId: number
  parkingLotId: number
  parkingSpaceId: number | null
  startTime: string
  endTime: string
  status: ReservationStatus
  totalAmount: number
  currency: string
  notes: string | null
}
export type ReservationRequest = {
  reservationCode?: string
  startTime: string
  endTime: string
  status?: ReservationStatus
  totalAmount: number
  currency?: string
  notes?: string
}
export type CreateReservationInput = {
  userId: number
  vehicleId: number
  parkingLotId: number
  parkingSpaceId?: number
  reservation: ReservationRequest
}

export type Payment = {
  id: number
  reservationId: number
  paymentReference: string
  amount: number
  currency: string
  paymentMethod: string
  status: string
  transactionReference: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}
export type PaymentRequest = {
  paymentReference: string
  amount: number
  currency: string
  paymentMethod: string
  status?: string
  transactionReference?: string
}
export type ParkShareEvent = {
  id: number
  name: string
  description?: string | null
  venue?: string | null
  startTime?: string
  endTime?: string
  status?: string
  organizerId?: number
}

export const authApi = {
  async login(input: LoginRequest): Promise<AuthResponse> {
    const result = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    authToken.set(result.token)
    window.sessionStorage.setItem('parkshare.authUser', JSON.stringify(result))
    return result
  },
  async register(input: RegisterRequest): Promise<unknown> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(input) })
  },
  logout(): void {
    authToken.clear()
  },
}

export const parkingApi = {
  list(): Promise<ParkingLot[]> {
    return request('/parking-lots')
  },
  get(id: number): Promise<ParkingLot> {
    return request(`/parking-lots/${id}`)
  },
  listByCity(city: string): Promise<ParkingLot[]> {
    return request(`/parking-lots/city${queryString({ city })}`)
  },
  search(name: string): Promise<ParkingLot[]> {
    return request(`/parking-lots/search${queryString({ name })}`)
  },
  listByOperator(operatorId: number): Promise<ParkingLot[]> {
    return request(`/parking-lots/operator/${operatorId}`)
  },
  create(operatorId: number, input: ParkingLotRequest): Promise<ParkingLot> {
    return request(`/parking-lots/operator/${operatorId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  update(id: number, input: ParkingLotRequest): Promise<ParkingLot> {
    return request(`/parking-lots/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  },
}

export const parkingZoneApi = {
  listByParkingLot(parkingLotId: number): Promise<ParkingZone[]> {
    return request(`/parking-zones/parking-lot/${parkingLotId}`)
  },
}

export const parkingSpaceApi = {
  listByZone(parkingZoneId: number): Promise<ParkingSpace[]> {
    return request(`/parking-spaces/zone/${parkingZoneId}`)
  },
}

export const vehicleApi = {
  listByUser(userId: number): Promise<Vehicle[]> {
    return request(`/vehicles/user/${userId}`)
  },
  create(userId: number, input: VehicleRequest): Promise<Vehicle> {
    return request(`/vehicles/user/${userId}`, { method: 'POST', body: JSON.stringify(input) })
  },
  update(id: number, input: VehicleRequest): Promise<Vehicle> {
    return request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(input) })
  },
  setDefault(id: number): Promise<Vehicle> {
    return request(`/vehicles/${id}/default`, { method: 'PATCH' })
  },
  delete(id: number): Promise<void> {
    return request(`/vehicles/${id}`, { method: 'DELETE' })
  },
}

export const reservationApi = {
  listByUser(userId: number): Promise<Reservation[]> {
    return request(`/reservations/user/${userId}`)
  },
  get(id: number): Promise<Reservation> {
    return request(`/reservations/${id}`)
  },
  create(input: CreateReservationInput): Promise<Reservation> {
    const params = queryString({
      userId: input.userId,
      vehicleId: input.vehicleId,
      parkingLotId: input.parkingLotId,
      parkingSpaceId: input.parkingSpaceId,
    })
    return request(`/reservations${params}`, {
      method: 'POST',
      body: JSON.stringify(input.reservation),
    })
  },
  cancel(id: number): Promise<Reservation> {
    return request(`/reservations/${id}/cancel`, { method: 'PATCH' })
  },
}

export const paymentApi = {
  createForReservation(reservationId: number, input: PaymentRequest): Promise<Payment> {
    return request(`/payments/reservation/${reservationId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  getForReservation(reservationId: number): Promise<Payment> {
    return request(`/payments/reservation/${reservationId}`)
  },
}

export const eventApi = {
  list(): Promise<ParkShareEvent[]> {
    return request('/events')
  },
  get(id: number): Promise<ParkShareEvent> {
    return request(`/events/${id}`)
  },
}
