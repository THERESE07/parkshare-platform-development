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

Set `VITE_API_BASE_URL=http://localhost:8080/api` in `.env.local` for the local Spring Boot backend. Never put database passwords, JWT signing secrets, or other server secrets in Vite environment variables: `VITE_*` values are included in browser code.

## Available commands

- `pnpm dev` — Vite development server
- `pnpm typecheck` — TypeScript validation
- `pnpm build` — TypeScript validation and production build
- `pnpm preview` — preview the production build

## API layer

The typed API service is in `src/lib/api.ts`. It centralizes the base URL, Bearer token, HTTP errors, and methods for authentication, parking lots, vehicles, reservations, payments, and events. The access token is kept in session storage for the current browser session.

## Integration notes

- Many backend endpoints require a Bearer token and specific roles. Sign in with an account that has the correct role before using protected endpoints.
- The current backend `ParkingLotResponseDto` exposes total capacity and status, but not a live free-space count, freshness timestamp, verification state, or pricing. The UI must not fabricate these values; these require mapping the spaces, occupancy, verification, and pricing endpoints.
- The payment endpoints create and manage payment records. They do not by themselves confirm that MTN MoMo or Airtel Money provider checkout is configured. Do not show payment success until a trusted provider/backend response confirms it.
