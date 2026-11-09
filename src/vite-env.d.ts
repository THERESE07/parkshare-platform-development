/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ParkShare API base URL without /api, e.g. http://localhost:8080 */
  readonly VITE_API_URL: string;
  /** "false" hides the sandbox payment notice (production). */
  readonly VITE_PAYMENTS_SANDBOX?: string;
  readonly VITE_MAP_TILE_URL?: string;
  readonly VITE_ROUTING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
