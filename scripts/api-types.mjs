// Regenerates src/api/schema.d.ts from the backend's OpenAPI spec.
// Usage: pnpm api:types   (reads VITE_API_URL from the environment, .env.local or .env)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

function fromEnvFiles(name) {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const match = readFileSync(file, "utf8").match(new RegExp(`^\\s*${name}\\s*=\\s*(.+?)\\s*$`, "m"));
    if (match) return match[1].replace(/^["']|["']$/g, "");
  }
  return undefined;
}

const apiUrl = (process.env.VITE_API_URL || fromEnvFiles("VITE_API_URL") || "").replace(/\/$/, "");
if (!apiUrl) {
  console.error("Set VITE_API_URL (e.g. http://localhost:8080) in .env.local first.");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const cli = require.resolve("openapi-typescript/bin/cli.js");
console.log(`Generating types from ${apiUrl}/v3/api-docs`);
execFileSync(process.execPath, [cli, `${apiUrl}/v3/api-docs`, "-o", "src/api/schema.d.ts"], { stdio: "inherit" });
