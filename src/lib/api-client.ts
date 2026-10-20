import { connection } from "next/server";
import type { ApiErrorBody } from "./api-types";

// Used by server components to read from the Express API. Browser code calls
// the same endpoints through the `/api/*` rewrite in next.config.ts.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** GETs JSON from the API. Returns null on 404 so pages can call notFound(). */
export async function apiGet<T>(path: string): Promise<T | null> {
  await connection(); // invoice data is per request: never prerender pages that read it at build time
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  } catch {
    throw new Error(`Can't reach the Ledgerline API at ${API_URL}. Start it with "npm run dev".`);
  }
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(body?.error.message ?? `API request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
