const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
).replace(/\/$/, "");
const TOKEN_KEY = "parkshare.accessToken";
const USER_KEY = "parkshare.authUser";

export type ApiErrorBody = {
  message?: string;
  error?: string;
  detail?: string;
  timestamp?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(
    message: string,
    status: number,
    body: ApiErrorBody | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Notifies the app (header, layouts) that the signed-in user changed. */
export const AUTH_EVENT = "parkshare:auth";

export const authToken = {
  get(): string | null {
    return window.sessionStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    window.sessionStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const token = authToken.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      "Cannot reach the ParkShare API. Check that Spring Boot is running and VITE_API_BASE_URL is correct.",
      0,
    );
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  let data: unknown = undefined;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!response.ok) {
    const body =
      data && typeof data === "object" ? (data as ApiErrorBody) : null;
    const fallback =
      response.status === 401
        ? "Your session has expired or you are not signed in."
        : response.status === 403
          ? "Your account is not allowed to do this."
          : `Request failed with status ${response.status}`;
    const message =
      body?.message ||
      body?.detail ||
      body?.error ||
      (typeof data === "string" ? data : "") ||
      fallback;
    throw new ApiError(message, response.status, body);
  }

  return data as T;
}

function queryString(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Some list endpoints are paged ({content: [...]}) and some return arrays. */
type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
function items<T>(data: T[] | Page<T> | null | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.content ?? []);
}

/* ---------- Types (mirroring the backend DTOs) ---------- */

export type LoginRequest = { email: string; password: string };
export type AccountType = "DRIVER" | "OPERATOR";
export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
};
export type RegisterResponse = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  role: string;
};
export type AuthResponse = {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
};
export type Profile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
};

export type ParkingLot = {
  id: number;
  operatorId: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  totalCapacity: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export const RWANDA_DISTRICTS = [
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Bugesera",
  "Burera",
  "Gakenke",
  "Gatsibo",
  "Gicumbi",
  "Gisagara",
  "Huye",
  "Kamonyi",
  "Karongi",
  "Kayonza",
  "Kirehe",
  "Muhanga",
  "Musanze",
  "Ngoma",
  "Ngororero",
  "Nyabihu",
  "Nyagatare",
  "Nyamagabe",
  "Nyamasheke",
  "Nyanza",
  "Nyaruguru",
  "Rubavu",
  "Ruhango",
  "Rulindo",
  "Rusizi",
  "Rutsiro",
  "Rwamagana",
] as const;

export type ParkingLotRequest = {
  name: string;
  description?: string;
  address: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  totalCapacity?: number;
};

export type ParkingZone = {
  id: number;
  parkingLotId: number;
  name: string;
  description: string | null;
  capacity: number | null;
  status: string;
};
export type ParkingZoneRequest = {
  name: string;
  description?: string;
  capacity?: number;
  status?: "ACTIVE" | "INACTIVE";
};

export type SpaceStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "MAINTENANCE"
  | "BLOCKED";
export type SpaceType = "STANDARD" | "DISABLED" | "VIP" | "EV" | "MOTORCYCLE";
export type ParkingSpace = {
  id: number;
  parkingZoneId: number;
  spaceCode: string;
  spaceType: SpaceType | string;
  status: SpaceStatus | string;
  floor: string | null;
};
export type ParkingSpaceRequest = {
  spaceCode: string;
  spaceType: SpaceType;
  status?: SpaceStatus;
  floor?: string;
};

export type OperatingHours = {
  id: number;
  parkingLotId: number;
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
  closed: boolean;
};
export type ParkingFeature = {
  id: number;
  parkingLotId: number;
  featureCode: string;
};
export type Review = {
  id: number;
  userId: number;
  parkingLotId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type PricingType = "HOURLY" | "DAILY" | "FLAT";
export type PricingRule = {
  id: number;
  parkingLotId: number;
  name: string;
  pricingType: PricingType | string;
  amount: number;
  currency: string;
  active: boolean;
};
export type PricingRuleRequest = {
  name: string;
  pricingType: PricingType;
  amount: number;
  currency: "RWF";
  active: boolean;
};
export type PriceQuote = {
  parkingLotId: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  billedMinutes: number;
  pricingMethod: string;
  lines: { label: string; minutes: number; hourlyRate: number; amount: number }[];
  dailyCapDiscount: number | null;
  total: number;
  amountExcludingVat: number;
  vatRate: number;
  vatAmount: number;
  vatInclusive: boolean;
  currency: string;
};

export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "BUS" | "OTHER";
export type Vehicle = {
  id: number;
  userId: number;
  plateNumber: string;
  vehicleType: VehicleType | string;
  make: string | null;
  model: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
};
export type VehicleRequest = {
  plateNumber: string;
  vehicleType: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "NO_SHOW";
export type Reservation = {
  id: number;
  reservationCode: string;
  userId: number;
  vehicleId: number;
  parkingLotId: number;
  parkingSpaceId: number | null;
  startTime: string;
  endTime: string;
  status: ReservationStatus | string;
  totalAmount: number;
  currency: string;
  notes: string | null;
  vatAmount: number | null;
  paymentDueBy: string | null;
};
export type CreateReservationInput = {
  vehicleId: number;
  parkingLotId: number;
  parkingSpaceId?: number;
  startTime: string;
  endTime: string;
  notes?: string;
};
export type CancellationResult = {
  reservation: Reservation;
  refundAmount: number | null;
};
export type CurrentQr = {
  token: string;
  expiresAt: string | null;
  usedAt: string | null;
};

export type PaymentMethod = "MTN_MOMO" | "AIRTEL_MONEY";
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentView = {
  id: number;
  reservationId: number;
  paymentReference: string;
  transactionReference: string | null;
  amount: number;
  vatAmount: number | null;
  currency: string;
  method: string;
  status: PaymentStatus | string;
  payerPhone: string | null;
  paidAt: string | null;
  instructions: string | null;
};
export type Payment = {
  id: number;
  reservationId: number;
  paymentReference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus | string;
  transactionReference: string | null;
  paidAt: string | null;
};

export type ParkShareEvent = {
  id: number;
  organizerId: number;
  name: string;
  description: string | null;
  venueName: string | null;
  address: string | null;
  startTime: string;
  endTime: string;
  status: string;
};
export type EventParkingZone = {
  id: number;
  eventId: number;
  parkingLotId: number;
  capacity: number | null;
  reservedCount: number | null;
  occupiedCount: number | null;
  availableCount: number | null;
  price: number | null;
  currency: string | null;
  status: string;
};

export type Notification = {
  id: number;
  title: string | null;
  message: string | null;
  status: string;
  readAt: string | null;
  createdAt: string;
};

/* ---------- Endpoints ---------- */

function saveSession(result: AuthResponse) {
  authToken.set(result.token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(result));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export const authApi = {
  async login(input: LoginRequest): Promise<AuthResponse> {
    const result = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    saveSession(result);
    return result;
  },
  register(input: RegisterRequest): Promise<RegisterResponse> {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  currentUser(): AuthResponse | null {
    if (!authToken.get()) return null;
    const raw = window.sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  },
  logout(): void {
    authToken.clear();
    window.sessionStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  },
};

export const meApi = {
  get(): Promise<Profile> {
    return request("/me");
  },
};

export const parkingApi = {
  list(): Promise<ParkingLot[]> {
    return request<ParkingLot[] | Page<ParkingLot>>("/parking-lots").then(items);
  },
  get(id: number): Promise<ParkingLot> {
    return request(`/parking-lots/${id}`);
  },
  listByOperator(operatorId: number): Promise<ParkingLot[]> {
    return request<ParkingLot[] | Page<ParkingLot>>(
      `/parking-lots/operator/${operatorId}`,
    ).then(items);
  },
  create(operatorId: number, input: ParkingLotRequest): Promise<ParkingLot> {
    return request(`/parking-lots/operator/${operatorId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  hours(lotId: number): Promise<OperatingHours[]> {
    return request<OperatingHours[]>(
      `/parking-operating-hours/parking-lot/${lotId}`,
    ).then(items);
  },
  features(lotId: number): Promise<ParkingFeature[]> {
    return request<ParkingFeature[]>(
      `/parking-features/parking-lot/${lotId}`,
    ).then(items);
  },
  reviews(lotId: number): Promise<Review[]> {
    return request<Review[] | Page<Review>>(
      `/reviews/parking-lot/${lotId}`,
    ).then(items);
  },
};

export const parkingZoneApi = {
  listByParkingLot(parkingLotId: number): Promise<ParkingZone[]> {
    return request<ParkingZone[]>(
      `/parking-zones/parking-lot/${parkingLotId}`,
    ).then(items);
  },
  create(parkingLotId: number, input: ParkingZoneRequest): Promise<ParkingZone> {
    return request(`/parking-zones/parking-lot/${parkingLotId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

const spaceStatusAction: Record<string, string> = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  MAINTENANCE: "maintenance",
};

export const parkingSpaceApi = {
  listByZone(parkingZoneId: number): Promise<ParkingSpace[]> {
    return request<ParkingSpace[]>(
      `/parking-spaces/zone/${parkingZoneId}`,
    ).then(items);
  },
  create(parkingZoneId: number, input: ParkingSpaceRequest): Promise<ParkingSpace> {
    return request(`/parking-spaces/zone/${parkingZoneId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  setStatus(id: number, status: SpaceStatus): Promise<ParkingSpace> {
    const action = spaceStatusAction[status];
    return action
      ? request(`/parking-spaces/${id}/${action}`, { method: "PATCH" })
      : request(`/parking-spaces/${id}/status${queryString({ status })}`, {
          method: "PATCH",
        });
  },
};

/** Loads a lot's zones and every space inside them in one call. */
export async function loadLotLayout(
  lotId: number,
): Promise<{ zones: ParkingZone[]; spaces: ParkingSpace[] }> {
  const zones = await parkingZoneApi.listByParkingLot(lotId);
  const spaces = (
    await Promise.all(zones.map((zone) => parkingSpaceApi.listByZone(zone.id)))
  ).flat();
  return { zones, spaces };
}

export const pricingApi = {
  quote(parkingLotId: number, startTime: string, endTime: string): Promise<PriceQuote> {
    return request(
      `/pricing/quote${queryString({ parkingLotId, startTime, endTime })}`,
    );
  },
  activeRules(parkingLotId: number): Promise<PricingRule[]> {
    return request<PricingRule[]>(
      `/pricing-rules/parking-lot/${parkingLotId}/active`,
    ).then(items);
  },
  createRule(parkingLotId: number, input: PricingRuleRequest): Promise<PricingRule> {
    return request(`/pricing-rules/parking-lot/${parkingLotId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};

export const vehicleApi = {
  listByUser(userId: number): Promise<Vehicle[]> {
    return request<Vehicle[]>(`/vehicles/user/${userId}`).then(items);
  },
  create(userId: number, input: VehicleRequest): Promise<Vehicle> {
    return request(`/vehicles/user/${userId}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  setDefault(id: number): Promise<Vehicle> {
    return request(`/vehicles/${id}/default`, { method: "PATCH" });
  },
};

export const reservationApi = {
  listByUser(userId: number): Promise<Reservation[]> {
    return request<Reservation[] | Page<Reservation>>(
      `/reservations/user/${userId}${queryString({ page: 0, size: 100 })}`,
    ).then(items);
  },
  listByParkingLot(parkingLotId: number): Promise<Reservation[]> {
    return request<Reservation[] | Page<Reservation>>(
      `/reservations/parking-lot/${parkingLotId}`,
    ).then(items);
  },
  get(id: number): Promise<Reservation> {
    return request(`/reservations/${id}`);
  },
  /** The server sets the price, status and code; the client sends times only. */
  create(input: CreateReservationInput): Promise<Reservation> {
    const params = queryString({
      vehicleId: input.vehicleId,
      parkingLotId: input.parkingLotId,
      parkingSpaceId: input.parkingSpaceId,
    });
    return request(`/reservations${params}`, {
      method: "POST",
      body: JSON.stringify({
        startTime: input.startTime,
        endTime: input.endTime,
        currency: "RWF",
        notes: input.notes,
      }),
    });
  },
  async cancel(id: number): Promise<CancellationResult> {
    const result = await request<CancellationResult | Reservation>(
      `/reservations/${id}/cancel`,
      { method: "PATCH" },
    );
    return "reservation" in result
      ? result
      : { reservation: result, refundAmount: null };
  },
  qr(id: number): Promise<CurrentQr> {
    return request(`/reservations/${id}/qr`);
  },
};

export const paymentApi = {
  initiate(
    reservationId: number,
    input: { method: PaymentMethod; phone: string },
  ): Promise<PaymentView> {
    return request(`/payments/reservation/${reservationId}/initiate`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  getForReservation(reservationId: number): Promise<Payment> {
    return request(`/payments/reservation/${reservationId}`);
  },
};

export const eventApi = {
  list(): Promise<ParkShareEvent[]> {
    return request<ParkShareEvent[]>("/events").then(items);
  },
  get(id: number): Promise<ParkShareEvent> {
    return request(`/events/${id}`);
  },
  zones(eventId: number): Promise<EventParkingZone[]> {
    return request<EventParkingZone[]>(
      `/event-parking-zones/event/${eventId}`,
    ).then(items);
  },
  linkReservation(
    eventId: number,
    eventParkingZoneId: number,
    reservationId: number,
  ): Promise<unknown> {
    return request(
      `/event-reservations${queryString({ eventId, eventParkingZoneId, reservationId })}`,
      { method: "POST" },
    );
  },
};

export const notificationApi = {
  unread(userId: number): Promise<Notification[]> {
    return request<Notification[]>(`/notifications/user/${userId}/unread`).then(
      items,
    );
  },
};
