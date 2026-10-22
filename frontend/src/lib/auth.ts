"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

// Demo sign-in: one fixed member account, kept in the browser only.
export const DEMO_CREDENTIALS = { email: "member@ledgerline.app", password: "ledgerline2026" };
const STORAGE_KEY = "ledgerline.session";

export function isSignedIn(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "member";
  } catch {
    return false;
  }
}

export function signIn(email: string, password: string): boolean {
  if (email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, "member");
  } catch {}
  notify();
  return true;
}

export function signOut() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  notify();
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function notify() {
  listeners.forEach((cb) => cb());
}

/** Sends the visitor to /login until they have signed in. Returns true once the session is confirmed. */
export function useRequireAuth(): boolean {
  const router = useRouter();
  // `false` on the server and during hydration, the real value right after.
  const ok = useSyncExternalStore(subscribe, isSignedIn, () => false);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  useEffect(() => {
    if (hydrated && !ok) router.replace("/login");
  }, [hydrated, ok, router]);
  return ok;
}
