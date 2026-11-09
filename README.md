# ParkShare frontend

React + TypeScript + Vite frontend for the ParkShare Spring Boot API.

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm (the repository's package manager)
- ParkShare backend running locally on port 8080 for API-backed screens

## Setup

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open http://localhost:5173.

Set `VITE_API_URL=http://localhost:8080` (no `/api`) in `.env.local` for the local Spring Boot backend; use the deployed API URL in other environments. Never put database passwords, JWT signing secrets, or other server secrets in Vite environment variables: `VITE_*` values are included in browser code.

## Available commands

- `pnpm dev` — Vite development server
- `pnpm typecheck` — TypeScript validation
- `pnpm build` — TypeScript validation and production build
- `pnpm preview` — preview the production build
- `pnpm api:types` — regenerate `src/api/schema.d.ts` from `$VITE_API_URL/v3/api-docs` (run after every backend change; the compiler then shows what broke)

## API layer

Follows the backend's *Frontend Integration Guide*:

- `src/api/client.ts` is the only place that calls `fetch`: it adds the Bearer token (kept in `localStorage`, 24 h), sends users to `/login` on `401`, turns error bodies into readable messages, and shows "Waking up the server…" when the trial server is slow.
- `src/api/schema.d.ts` is generated (`pnpm api:types`); `src/api/index.ts` derives every type from it and lists the endpoints.
- Prices, VAT and fees always come from the API (`/api/pricing/quote`, reservation `totalAmount`).
- Times are sent as ISO-8601 and shown in Kigali time.

## Maps and dark mode

- Maps use Leaflet with OpenStreetMap tiles (no API key). Driving routes come from the public OSRM demo router and are a preview only; "Google Maps" / "Waze" buttons hand off to the phone for live navigation. Override with `VITE_MAP_TILE_URL` / `VITE_ROUTING_URL` (the demo router and OSM tiles are not meant for heavy production traffic).
- Theme follows the device by default; the sun/moon button switches light, dark or system.

## Integration notes

- Many backend endpoints require a Bearer token and specific roles. Sign in with an account that has the correct role before using protected endpoints.
- The current backend `ParkingLotResponseDto` exposes total capacity and status, but not a live free-space count, freshness timestamp, verification state, or pricing. The UI must not fabricate these values; these require mapping the spaces, occupancy, verification, and pricing endpoints.
- The payment endpoints create and manage payment records. They do not by themselves confirm that MTN MoMo or Airtel Money provider checkout is configured. Do not show payment success until a trusted provider/backend response confirms it.
