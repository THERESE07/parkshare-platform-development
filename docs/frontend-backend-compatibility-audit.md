# ParkShare frontend/backend compatibility audit

Audit source:
- Frontend: THERESE07/parkshare-platform-development, original main branch source.
- Backend: THERESE07/parkshare-backend, original main branch source.
- Work in progress: feature/vite-api-integration and feature/vite-cors-public-discovery.

## Current status

The original v0 frontend is a Next.js 16 App Router project. The requested target is React + TypeScript + Vite. The Vite migration branch now has a Vite entry point, React Router, a typed API service, login flow, API-backed parking discovery, driver vehicle management, a driver reservation form/history/cancellation flow, and an operator parking-lot creation/list screen. A GitHub Actions workflow was added for type-check and production-build validation; its latest run is still in progress. Existing Next.js routes/components remain as a design reference and are not yet all ported to the Vite router.

## Backend contracts confirmed in source

| Feature | Backend contract | Compatibility notes |
|---|---|---|
| Authentication | POST /api/auth/register, POST /api/auth/login | Login returns token, token type, user ID, email, names and roles. Frontend API client stores the token for the browser session and sends it as a Bearer token. |
| Parking lots | GET /api/parking-lots, GET /api/parking-lots/{id}, GET /api/parking-lots/city?city=..., GET /api/parking-lots/search?name=... | Response includes ID, operator ID, name, description, address, city, coordinates, contact phone, total capacity, status and timestamps. It does not include price, available-space count, freshness timestamp or verification status. |
| Parking zones/spaces | /api/parking-zones, /api/parking-spaces | Separate requests are required to fetch zone/space-level data. Space status can support occupancy views, but it should not be treated as a trusted aggregate without checking the service logic. |
| Vehicles | POST /api/vehicles/user/{userId}, GET /api/vehicles/user/{userId}, PUT /api/vehicles/{id}, default/activate/deactivate actions | Request uses plateNumber, vehicleType, make, model, color, isDefault, isActive. Endpoints are restricted to DRIVER role in current security configuration. |
| Reservations | POST /api/reservations?userId=...&vehicleId=...&parkingLotId=...&parkingSpaceId=... | IDs are query parameters; reservation times, amount, currency, notes and optional status are in the JSON body. Response fields include reservation code, IDs, start/end time, status and total amount. |
| Payments | POST /api/payments/reservation/{reservationId} | This creates a backend payment record. The endpoint alone does not prove that an MTN MoMo or Airtel Money provider checkout/confirmation is integrated. |
| Events | GET /api/events, GET /api/events/{id}, plus event-zone and event-reservation controllers | Event screens must be mapped to the actual event DTOs and role rules before claiming full integration. |
| Check-in/out | /api/check-ins, /api/check-outs | Suitable endpoint families exist; attendant UI still needs to be ported and connected to these request/response DTOs. |
| Administration/support | verification, audit, notifications, dispute and support controllers exist | Presence of controllers is not the same as complete role-specific UX or tested end-to-end behavior. |

## Issues found

1. Framework mismatch: original project uses Next.js routes, imports next/link and next/navigation, and scripts use next dev/build/start. The Vite branch adds Vite and React Router and limits its TypeScript include to src/ while migration proceeds.
2. Mock data: original lib/parkshare-data.ts contains demo parking lots, bookings, events and operator reservations. Those cannot be used as production API truth.
3. Availability contract gap: the current parking-lot DTO has total capacity and status only. UI claims like spaces free, last-updated time, operator verified, hourly price and reviews cannot be sourced from that DTO. Need map spaces/occupancy, verification and pricing endpoints or extend backend read DTOs.
4. Role routes incomplete in original tree: the landing page links to Driver, Operator, Attendant, Event Organizer and Admin, but original tracked route tree contains driver and operator pages only. Attendant, organizer and admin workspaces must be implemented before those role links can be considered complete.
5. Reservation creation, history, and cancellation now use the API. The booking form requires an active saved vehicle and a user-entered amount confirmed with the operator because the current parking-lot DTO does not supply a verified quote. The UI clearly states that creating a reservation record does not process or confirm payment.
6. Payment confirmation risk: a local payment record is not the same as successful mobile-money checkout. Payment UI must display pending/failed/success only according to backend/provider state.
7. CORS missing: no dedicated CORS configuration class was found in the backend tree. The backend compatibility branch adds configurable local Vite origins.
8. Discovery security mismatch: SecurityConfig's comment labels parking discovery public, but original rules require DRIVER/OPERATOR/ADMIN roles. The backend compatibility branch changes GET discovery/detail routes to permitAll, leaving management requests role-protected.
9. Runtime validation still required: source review cannot prove the local application builds or that live requests pass CORS, JWT validation and database/service logic. Run the frontend build and test against the running backend before merging.

## Branches

- Frontend: feature/vite-api-integration
- Backend: feature/vite-cors-public-discovery

Neither branch changes main. Review and merge only after running the build and verifying the endpoints against the local backend.