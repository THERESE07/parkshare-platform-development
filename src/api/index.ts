/**
 * ParkShare API endpoints. Types come from the generated OpenAPI schema
 * (src/api/schema.d.ts, regenerate with `pnpm api:types`), never by hand.
 */
import type { components } from "./schema";
import { api, json, query, session, type LoginResult } from "./client";

export { ApiError, AUTH_EVENT, WAKING_EVENT, isServerWaking, restoreSession, session } from "./client";

type S = components["schemas"];
/**
 * The spec marks every response field optional; the API always sends them
 * (nullable ones may be null), so responses are typed with required keys.
 */
type Dto<T> = { [K in keyof T]-?: T[K] };
type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean };

/* ---------- Types ---------- */

export type AuthResponse = Dto<S["LoginResponseDto"]>;
export type RegisterRequest = S["RegisterRequestDto"];
export type AccountType = NonNullable<RegisterRequest["accountType"]>;
export type Profile = Dto<S["Profile"]>;
export type ParkingLot = Dto<S["ParkingLotResponseDto"]>;
export type ParkingLotRequest = S["ParkingLotRequestDto"];
export type ParkingZone = Dto<S["ParkingZoneResponseDto"]>;
export type ParkingSpace = Dto<S["ParkingSpaceResponseDto"]>;
export type OperatingHours = Dto<S["ParkingOperatingHoursResponseDto"]>;
export type ParkingFeature = Dto<S["ParkingFeatureResponseDto"]>;
export type Review = Dto<S["ReviewResponseDto"]>;
export type PricingRule = Dto<S["PricingRuleResponseDto"]>;
export type PriceQuote = Dto<S["DriverQuote"]>;
export type OperatorPreview = Dto<S["OperatorPreview"]>;
export type Vehicle = Dto<S["VehicleResponseDto"]>;
export type Reservation = Dto<S["ReservationResponseDto"]>;
export type CancellationResult = Omit<Dto<S["CancellationResult"]>, "reservation"> & { reservation: Reservation };
export type CurrentQr = Dto<S["CurrentQr"]>;
export type PaymentView = Dto<S["PaymentView"]>;
export type Payment = Dto<S["PaymentResponseDto"]>;
export type Receipt = Dto<S["Receipt"]>;
export type ParkShareEvent = Dto<S["EventResponseDto"]>;
export type EventParkingZone = Dto<S["EventParkingZoneResponseDto"]>;
export type Notification = Dto<S["NotificationResponseDto"]>;
export type GateResult = Dto<S["GateResult"]>;
export type OperatorVerification = Dto<S["OperatorVerificationResponseDto"]>;
export type OperatorVerificationRequest = S["OperatorVerificationRequestDto"];
export type User = Dto<S["UserResponseDto"]>;

export type PaymentMethod = S["InitiatePaymentRequest"]["method"];
/** UI choices; the backend validates these values. */
export type VehicleType = "CAR" | "MOTORCYCLE" | "TRUCK" | "BUS" | "OTHER";
export type SpaceStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "BLOCKED";
export type SpaceType = "STANDARD" | "DISABLED" | "VIP" | "EV" | "MOTORCYCLE";

export const RWANDA_DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge", "Bugesera", "Burera", "Gakenke", "Gatsibo", "Gicumbi", "Gisagara", "Huye",
  "Kamonyi", "Karongi", "Kayonza", "Kirehe", "Muhanga", "Musanze", "Ngoma", "Ngororero", "Nyabihu", "Nyagatare",
  "Nyamagabe", "Nyamasheke", "Nyanza", "Nyaruguru", "Rubavu", "Ruhango", "Rulindo", "Rusizi", "Rutsiro", "Rwamagana",
] as const;

/* ---------- Auth & current user (guide §5) ---------- */

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await api<AuthResponse>("/api/auth/login", json("POST", { email, password }));
    session.save(result as unknown as LoginResult);
    return result;
  },
  register(input: RegisterRequest) {
    return api<Dto<S["RegisterResponseDto"]>>("/api/auth/register", json("POST", input));
  },
  currentUser: () => session.user<AuthResponse>(),
  /** Revokes the refresh token on the server, then forgets the session locally. */
  async logout() {
    const refreshToken = session.refreshToken();
    session.clear();
    if (refreshToken) await api("/api/auth/logout", json("POST", { refreshToken })).catch(() => undefined);
  },
  forgotPassword: (identifier: string) => api("/api/auth/password/forgot", json("POST", { identifier })),
  resetPassword: (identifier: string, code: string, newPassword: string) =>
    api("/api/auth/password/reset", json("POST", { identifier, code, newPassword })),
};

export const meApi = {
  get: () => api<Profile>("/api/me"),
  async update(changes: { firstName?: string; lastName?: string; phone?: string }): Promise<Profile> {
    const profile = await api<Profile>("/api/me", json("PATCH", changes));
    session.updateUser({ firstName: profile.firstName, lastName: profile.lastName });
    return profile;
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    api("/api/me/password", json("POST", { currentPassword, newPassword })),
  sendPhoneCode: () => api("/api/me/verify/phone", json("POST")),
  confirmPhone: (code: string) => api("/api/me/verify/phone/confirm", json("POST", { code })),
  sendEmailCode: () => api("/api/me/verify/email", json("POST")),
  confirmEmail: (code: string) => api("/api/me/verify/email/confirm", json("POST", { code })),
};

/* ---------- Parking ---------- */

export const parkingApi = {
  /** Drivers only receive approved lots; operators also see their own pending lots (guide §9). */
  list: () => api<ParkingLot[]>("/api/parking-lots"),
  listByStatus: (status: string) => api<ParkingLot[]>(`/api/parking-lots/status/${status}`),
  get: (id: number) => api<ParkingLot>(`/api/parking-lots/${id}`),
  listByOperator: (operatorId: number) => api<ParkingLot[]>(`/api/parking-lots/operator/${operatorId}`),
  create: (operatorId: number, input: ParkingLotRequest) =>
    api<ParkingLot>(`/api/parking-lots/operator/${operatorId}`, json("POST", input)),
  /** Admin only. */
  setStatus: (id: number, status: string) =>
    api<ParkingLot>(`/api/parking-lots/${id}/status${query({ status })}`, json("PATCH")),
  hours: (lotId: number) => api<OperatingHours[]>(`/api/parking-operating-hours/parking-lot/${lotId}`),
  features: (lotId: number) => api<ParkingFeature[]>(`/api/parking-features/parking-lot/${lotId}`),
  reviews: (lotId: number) => api<Review[]>(`/api/reviews/parking-lot/${lotId}`),
};

/** Lots by id, cached for the page lifetime (used to name lots on reservations). */
const lotCache = new Map<number, Promise<ParkingLot | null>>();
export function lotById(id: number): Promise<ParkingLot | null> {
  if (!lotCache.has(id)) lotCache.set(id, parkingApi.get(id).catch(() => null));
  return lotCache.get(id)!;
}
export async function lotsById(ids: number[]): Promise<Map<number, ParkingLot>> {
  const unique = [...new Set(ids)];
  const lots = await Promise.all(unique.map(lotById));
  return new Map(lots.filter((l): l is ParkingLot => !!l).map((l) => [l.id, l]));
}

export const parkingZoneApi = {
  listByParkingLot: (lotId: number) => api<ParkingZone[]>(`/api/parking-zones/parking-lot/${lotId}`),
  create: (lotId: number, input: S["ParkingZoneRequestDto"]) =>
    api<ParkingZone>(`/api/parking-zones/parking-lot/${lotId}`, json("POST", input)),
};

const spaceStatusAction: Record<string, string> = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  MAINTENANCE: "maintenance",
};
export const parkingSpaceApi = {
  listByZone: (zoneId: number) => api<ParkingSpace[]>(`/api/parking-spaces/zone/${zoneId}`),
  create: (zoneId: number, input: S["ParkingSpaceRequestDto"]) =>
    api<ParkingSpace>(`/api/parking-spaces/zone/${zoneId}`, json("POST", input)),
  setStatus: (id: number, status: SpaceStatus) =>
    spaceStatusAction[status]
      ? api<ParkingSpace>(`/api/parking-spaces/${id}/${spaceStatusAction[status]}`, json("PATCH"))
      : api<ParkingSpace>(`/api/parking-spaces/${id}/status${query({ status })}`, json("PATCH")),
};

export async function loadLotLayout(lotId: number): Promise<{ zones: ParkingZone[]; spaces: ParkingSpace[] }> {
  const zones = await parkingZoneApi.listByParkingLot(lotId);
  const spaces = (await Promise.all(zones.map((z) => parkingSpaceApi.listByZone(z.id)))).flat();
  return { zones, spaces };
}

/* ---------- Pricing (server is the only source of truth) ---------- */

export const pricingApi = {
  quote: (parkingLotId: number, startTime: string, endTime: string) =>
    api<PriceQuote>(`/api/pricing/quote${query({ parkingLotId, startTime, endTime })}`),
  activeRules: (lotId: number) => api<PricingRule[]>(`/api/pricing-rules/parking-lot/${lotId}/active`),
  createRule: (lotId: number, input: S["PricingRuleRequestDto"]) =>
    api<PricingRule>(`/api/pricing-rules/parking-lot/${lotId}`, json("POST", input)),
  operatorPreview: (parkingLotId: number, hourlyRate?: number, paymentMethod?: PaymentMethod) =>
    api<OperatorPreview>(`/api/pricing/operator-preview${query({ parkingLotId, hourlyRate, paymentMethod })}`),
};

/* ---------- Vehicles ---------- */

export const vehicleApi = {
  listByUser: (userId: number) => api<Vehicle[]>(`/api/vehicles/user/${userId}`),
  create: (userId: number, input: S["VehicleRequestDto"]) =>
    api<Vehicle>(`/api/vehicles/user/${userId}`, json("POST", input)),
  setDefault: (id: number) => api<Vehicle>(`/api/vehicles/${id}/default`, json("PATCH")),
};

/* ---------- Reservations ---------- */

export const reservationApi = {
  async listByUser(userId: number): Promise<Reservation[]> {
    const all: Reservation[] = [];
    for (let page = 0; page < 20; page++) {
      const res = await api<Page<Reservation>>(`/api/reservations/user/${userId}${query({ page, size: 100 })}`);
      all.push(...res.content);
      if (res.last) break;
    }
    return all;
  },
  listByParkingLot: (lotId: number) => api<Reservation[]>(`/api/reservations/parking-lot/${lotId}`),
  get: (id: number) => api<Reservation>(`/api/reservations/${id}`),
  byCode: (code: string) => api<Reservation>(`/api/reservations/code/${encodeURIComponent(code)}`),
  /** The server sets userId, price, status and code: send times (and notes) only. */
  create: (input: { vehicleId: number; parkingLotId: number; parkingSpaceId?: number; startTime: string; endTime: string; notes?: string }) =>
    api<Reservation>(
      `/api/reservations${query({ vehicleId: input.vehicleId, parkingLotId: input.parkingLotId, parkingSpaceId: input.parkingSpaceId })}`,
      json("POST", { startTime: input.startTime, endTime: input.endTime, notes: input.notes }),
    ),
  cancel: (id: number) => api<CancellationResult>(`/api/reservations/${id}/cancel`, json("PATCH")),
  qr: (id: number) => api<CurrentQr>(`/api/reservations/${id}/qr`),
};

/* ---------- Payments ---------- */

export const paymentApi = {
  initiate: (reservationId: number, method: PaymentMethod, phone?: string) =>
    api<PaymentView>(`/api/payments/reservation/${reservationId}/initiate`, json("POST", { method, phone: phone || undefined })),
  getForReservation: (reservationId: number) => api<Payment>(`/api/payments/reservation/${reservationId}`),
  receipt: (paymentId: number) => api<Receipt>(`/api/payments/${paymentId}/receipt`),
  /** Staff record cash taken at the gate. */
  cash: (reservationId: number) => api<PaymentView>(`/api/payments/reservation/${reservationId}/cash`, json("POST")),
};

/**
 * Polls until the reservation is paid, the payment fails or the hold expires (guide §9).
 * `isCancelled` lets a component stop polling when it unmounts.
 */
export async function waitForPayment(
  reservationId: number,
  dueBy: string | null | undefined,
  isCancelled: () => boolean,
): Promise<"paid" | "failed" | "expired" | "cancelled"> {
  const deadline = dueBy ? new Date(dueBy).getTime() : Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    if (isCancelled()) return "cancelled";
    const r = await reservationApi.get(reservationId).catch(() => null);
    if (r?.status === "CONFIRMED") return "paid";
    if (r && ["EXPIRED", "CANCELLED"].includes(r.status)) return "expired";
    const p = await paymentApi.getForReservation(reservationId).catch(() => null);
    if (p?.status === "FAILED") return "failed";
    await new Promise((res) => setTimeout(res, 3000));
  }
  return "expired";
}

/* ---------- Reviews ---------- */

export const reviewApi = {
  byUser: (userId: number) => api<Review[]>(`/api/reviews/user/${userId}`),
  create: (userId: number, parkingLotId: number, reservationId: number, rating: number, comment?: string) =>
    api<Review>(`/api/reviews${query({ userId, parkingLotId, reservationId })}`, json("POST", { rating, comment })),
};

/* ---------- Events ---------- */

export const eventApi = {
  list: () => api<ParkShareEvent[]>("/api/events"),
  get: (id: number) => api<ParkShareEvent>(`/api/events/${id}`),
  zones: (eventId: number) => api<EventParkingZone[]>(`/api/event-parking-zones/event/${eventId}`),
  linkReservation: (eventId: number, eventParkingZoneId: number, reservationId: number) =>
    api(`/api/event-reservations${query({ eventId, eventParkingZoneId, reservationId })}`, json("POST")),
};

/* ---------- Notifications (paged; poll, no push yet) ---------- */

export const notificationApi = {
  list: (userId: number, page = 0) =>
    api<Page<Notification>>(`/api/notifications/user/${userId}${query({ page, size: 20 })}`),
  markRead: (id: number) => api<Notification>(`/api/notifications/${id}/read`, json("PATCH")),
};

/* ---------- Gate: check-in / check-out (guide §11) ---------- */

export const gateApi = {
  scan: (token: string) => api<GateResult>("/api/check-ins/scan", json("POST", { token })),
  byCode: (reservationCode: string) => api<GateResult>("/api/check-ins/code", json("POST", { reservationCode })),
  checkOut: (reservationId: number) => api<GateResult>(`/api/check-outs/reservation/${reservationId}`, json("POST")),
};

/* ---------- Operator verification & admin (guide §10, §12) ---------- */

export const verificationApi = {
  forUser: (userId: number) => api<OperatorVerification>(`/api/operator-verifications/user/${userId}`),
  submit: (userId: number, input: OperatorVerificationRequest) =>
    api<OperatorVerification>(`/api/operator-verifications${query({ userId })}`, json("POST", input)),
  listAll: () => api<OperatorVerification[]>("/api/operator-verifications"),
  review: (id: number, reviewerId: number, input: OperatorVerificationRequest) =>
    api<OperatorVerification>(`/api/operator-verifications/${id}/review${query({ reviewerId })}`, json("PATCH", input)),
};

export const userApi = {
  list: (page = 0) => api<Page<User>>(`/api/users${query({ page, size: 50 })}`),
};
