import { useEffect, useState } from "react";
import type { ApiErrorBody } from "./api-types";

// The API is normally on the same domain (Laravel serves this app from /app).
// NEXT_PUBLIC_API_URL points the build at an API on another domain instead.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiUrl = (path: string) => `${API_BASE}${path}`;

export type ApiResult<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "not-found" }
  | { status: "error"; message: string };

/**
 * Loads JSON from the API in the browser. The app is a static export, so every
 * page fetches its data after it opens. `retry` loads it again.
 */
export function useApiGet<T>(path: string | null): [ApiResult<T>, retry: () => void] {
  const [result, setResult] = useState<{ key: string; value: ApiResult<T> } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${path}#${attempt}`;

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const settle = (value: ApiResult<T>) => {
      if (!controller.signal.aborted) setResult({ key, value });
    };
    fetch(apiUrl(path), { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (res.status === 404) return settle({ status: "not-found" });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const message = (body as ApiErrorBody | null)?.error?.message ?? `The API request failed (${res.status}).`;
          return settle({ status: "error", message });
        }
        settle({ status: "ready", data: body as T });
      })
      .catch(() => settle({ status: "error", message: "Can't reach the Ledgerline API. Check that the backend is running." }));
    return () => controller.abort();
  }, [path, key]);

  // A result for an earlier path or attempt is stale: show loading until the new one arrives.
  return [result?.key === key ? result.value : { status: "loading" }, () => setAttempt((n) => n + 1)];
}
